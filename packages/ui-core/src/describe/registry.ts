import type {
  DescribeField,
  DescribeManifest,
  DescribeRelation,
  DescribeSchemaEntry,
} from './types.js';
import { labelize, pluralize } from '../label.js';

/**
 * In-memory schema registry built from a `/_describe` manifest snapshot.
 *
 * Responsibilities:
 *   - Resolve a resource by short path (`account`) or full key (`v1/account`).
 *   - Compute resource display labels with hint fallback chain
 *     (explicit `label` → title-cased path).
 *   - Compute the canonical `displayField` for a resource (explicit
 *     `displayField` hint → field named `name|title|<path>Name` → first
 *     searchable String field → `_id`). Used by RelationPicker and breadcrumbs.
 *   - Build a bidirectional relation graph. For every `belongsTo` declared
 *     on schema A pointing to B, register a synthetic inverse `hasMany`
 *     edge on B even when B's schema omits one. This is what lets
 *     `<RelatedList parent="account" relation="contacts">` work today,
 *     before backend M0.5 ships explicit inverse relations.
 *
 * Build it once (`new SchemaRegistry(manifest)`) at app boot; treat it as
 * immutable. Re-create when `/_describe` is refetched.
 */

export interface InverseRelation {
  /** Parent resource path that this synthetic edge lives on. */
  source: string;
  /** Child resource path (the original `belongsTo` declarer). */
  target: string;
  /** FK field on the child pointing back to the parent. */
  foreignKey: string;
  /** Stable name for the relation. Defaults to the pluralised child path. */
  name: string;
  /** True when the edge is declared explicitly on the parent schema. */
  declared: boolean;
}

export interface RelationEdge extends InverseRelation {
  kind: 'belongsTo' | 'hasMany' | 'hasOne';
}

export interface ResolvedDisplay {
  label: string;
  pluralLabel: string;
  displayField: string;
}

const DISPLAY_FIELD_GUESSES = ['name', 'title', 'label', 'displayName'];

export class SchemaRegistry {
  readonly manifest: DescribeManifest;
  /** Indexed by short path (e.g. `account`) → full key (`v1/account`). */
  private readonly pathToKey = new Map<string, string>();
  /** Inverse relations indexed by parent path → list of inferred hasMany edges. */
  private readonly inverseRelations = new Map<string, RelationEdge[]>();

  constructor(manifest: DescribeManifest) {
    this.manifest = manifest;
    for (const [key, entry] of Object.entries(manifest.schemas)) {
      this.pathToKey.set(entry.path.replace(/^\/api\/[^/]+\//, ''), key);
      // Fallback: also map raw key path segment (e.g. `v1/account` → `account`).
      const tail = key.split('/').slice(-1)[0];
      if (tail) this.pathToKey.set(tail, key);
    }
    this.buildInverseGraph();
  }

  /** All known resource short paths (e.g. ['account', 'contact', 'quote']). */
  paths(): string[] {
    return Array.from(this.pathToKey.keys()).sort();
  }

  /** All schema entries in registry order. */
  entries(): DescribeSchemaEntry[] {
    return Object.values(this.manifest.schemas);
  }

  /** Lookup an entry by short path. Returns `undefined` when not found. */
  get(pathOrKey: string): DescribeSchemaEntry | undefined {
    const key = this.pathToKey.get(pathOrKey) ?? pathOrKey;
    return this.manifest.schemas[key];
  }

  /**
   * Compute display strings for a resource. Falls back gracefully when the
   * backend manifest predates the M0.5 `label`/`pluralLabel`/`displayField` hints.
   */
  display(pathOrKey: string): ResolvedDisplay {
    const entry = this.get(pathOrKey);
    const shortPath = entry ? this.shortPath(entry) : pathOrKey;
    const label = entry?.label ?? labelize(shortPath);
    const pluralLabel = entry?.pluralLabel ?? pluralize(label);
    const displayField = this.resolveDisplayField(entry, shortPath);
    return { label, pluralLabel, displayField };
  }

  /**
   * Walk a record's reference-style fields and produce a printable preview.
   * Returns the first non-empty value of the resource's `displayField`,
   * else `_id`, else the literal `[no display]`.
   */
  preview(pathOrKey: string, record: Record<string, unknown>): string {
    const { displayField } = this.display(pathOrKey);
    const direct = record[displayField];
    if (typeof direct === 'string' && direct.length) return direct;
    if (typeof direct === 'number') return String(direct);
    if (typeof record._id === 'string') return record._id;
    return '[no display]';
  }

  /**
   * Declared and synthetic relations for a resource. Declared edges come
   * straight from the schema's `relations` block; synthetic edges are
   * inverses inferred from foreign-key declarations on sibling schemas.
   */
  relations(pathOrKey: string): RelationEdge[] {
    const entry = this.get(pathOrKey);
    if (!entry) return [];
    const out: RelationEdge[] = [];
    if (entry.relations) {
      for (const [name, def] of Object.entries(entry.relations)) {
        out.push(this.declaredEdge(this.shortPath(entry), name, def));
      }
    }
    const inverses = this.inverseRelations.get(this.shortPath(entry)) ?? [];
    for (const edge of inverses) {
      // Skip inverses that the schema already declares to avoid dupes.
      if (out.some((e) => e.target === edge.target && e.foreignKey === edge.foreignKey)) continue;
      out.push(edge);
    }
    return out;
  }

  /** Fields visible to the given role set, in schema order. */
  fieldsForRoles(pathOrKey: string, roles: readonly string[], op: 'read' | 'create' | 'update'): DescribeField[] {
    const entry = this.get(pathOrKey);
    if (!entry) return [];
    const userRoles = new Set(roles);
    return entry.fields.filter((f) => fieldVisibleTo(f, userRoles, op));
  }

  /** Short path (e.g. `account`) from an entry. */
  private shortPath(entry: DescribeSchemaEntry): string {
    return entry.path.replace(/^\/api\/[^/]+\//, '');
  }

  private declaredEdge(source: string, name: string, def: DescribeRelation): RelationEdge {
    const fk =
      def.kind === 'belongsTo' ? def.localKey : def.foreignKey ?? `${source}Id`;
    return {
      kind: def.kind,
      name,
      source,
      target: def.target,
      foreignKey: fk,
      declared: true,
    };
  }

  private buildInverseGraph(): void {
    for (const entry of Object.values(this.manifest.schemas)) {
      const childPath = this.shortPath(entry);
      // Explicit `belongsTo` from relations block.
      if (entry.relations) {
        for (const [, def] of Object.entries(entry.relations)) {
          if (def.kind !== 'belongsTo') continue;
          this.recordInverse({
            source: def.target,
            target: childPath,
            foreignKey: def.localKey,
            name: pluralize(childPath),
            declared: false,
            kind: 'hasMany',
          });
        }
      }
      // FK-by-convention: any field with `reference` set, or named `${target}Id`.
      for (const field of entry.fields) {
        if (field.reference) {
          this.recordInverse({
            source: field.reference,
            target: childPath,
            foreignKey: field.name,
            name: pluralize(childPath),
            declared: false,
            kind: 'hasMany',
          });
          continue;
        }
        if (field.name.endsWith('Id') && field.name.length > 2) {
          const target = field.name.slice(0, -2);
          if (this.pathToKey.has(target)) {
            this.recordInverse({
              source: target,
              target: childPath,
              foreignKey: field.name,
              name: pluralize(childPath),
              declared: false,
              kind: 'hasMany',
            });
          }
        }
      }
    }
  }

  private recordInverse(edge: RelationEdge): void {
    const list = this.inverseRelations.get(edge.source) ?? [];
    if (list.some((e) => e.target === edge.target && e.foreignKey === edge.foreignKey)) return;
    list.push(edge);
    this.inverseRelations.set(edge.source, list);
  }

  private resolveDisplayField(
    entry: DescribeSchemaEntry | undefined,
    shortPath: string
  ): string {
    if (!entry) return '_id';
    if (entry.displayField) return entry.displayField;
    const fieldNames = new Set(entry.fields.map((f) => f.name));
    for (const guess of DISPLAY_FIELD_GUESSES) {
      if (fieldNames.has(guess)) return guess;
    }
    const pathSpecific = `${shortPath}Name`;
    if (fieldNames.has(pathSpecific)) return pathSpecific;
    const firstSearchable = entry.fields.find(
      (f) => f.searchable && f.type === 'String' && !f.name.endsWith('Id')
    );
    if (firstSearchable) return firstSearchable.name;
    const firstString = entry.fields.find(
      (f) => f.type === 'String' && !f.name.endsWith('Id') && f.name !== 'userId'
    );
    if (firstString) return firstString.name;
    return '_id';
  }
}

function fieldVisibleTo(
  field: DescribeField,
  roles: ReadonlySet<string>,
  op: 'read' | 'create' | 'update'
): boolean {
  const acl = field.acl?.[op];
  if (!acl || !acl.length) return true;
  return acl.some((role) => roles.has(role));
}
