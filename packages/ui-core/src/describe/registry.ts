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
 *   - Compute resource display labels with a hint-first fallback chain
 *     (`entry.label` → title-cased path).
 *   - Compute the canonical `displayField` for a resource:
 *     `entry.displayField` → field named `name|title|<path>Name` →
 *     first searchable String field → `_id`. The hint is the primary
 *     source; sniffing covers backends that haven't been upgraded yet
 *     or schemas without an explicit hint.
 *   - Expose declared `belongsTo` / `hasMany` / `hasOne` edges (which,
 *     post-M0.5, include the inverse `hasMany` edges the backend
 *     auto-populates from sibling `belongsTo` declarations).
 *
 * Build it once (`new SchemaRegistry(manifest)`) at app boot; treat it as
 * immutable. Re-create when `/_describe` is refetched.
 */

export interface RelationEdge {
  kind: 'belongsTo' | 'hasMany' | 'hasOne';
  /** Parent resource path that this edge lives on. */
  source: string;
  /** Other-end resource path. */
  target: string;
  /** FK field linking the two records. */
  foreignKey: string;
  /** Relation key from the manifest (or pluralised child path for legacy inverses). */
  name: string;
  /** True when the edge appears in the resource's own `relations` block. */
  declared: boolean;
  /** True when the backend marked this edge as a synthetic inverse of a sibling belongsTo. */
  inverse?: boolean;
  /**
   * False when the backend marked this edge as manifest-only — REST
   * `__include` / MCP relation tools / GraphQL graph edges will reject
   * it by name. Consumers should fetch via a regular list + foreign-key
   * filter (which is what `<RelatedList>` already does). Default
   * (absent or true) = callable.
   */
  callable?: boolean;
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

  constructor(manifest: DescribeManifest) {
    this.manifest = manifest;
    for (const [key, entry] of Object.entries(manifest.schemas)) {
      this.pathToKey.set(entry.path.replace(/^\/api\/[^/]+\//, ''), key);
      // Fallback: also map raw key path segment (e.g. `v1/account` → `account`).
      const tail = key.split('/').slice(-1)[0];
      if (tail) this.pathToKey.set(tail, key);
    }
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
   * Compute display strings for a resource. The hint trio
   * (`entry.label`/`pluralLabel`/`displayField`) wins outright; fallbacks
   * keep the UI sensible against backends that predate the M0.5 hints or
   * schemas that simply don't bother to declare them.
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
   * Declared relations for a resource, in manifest order. With davepi's
   * M0.5 backend the parent's `relations` block already includes inverse
   * `hasMany` edges synthesised from sibling `belongsTo` declarations
   * (marked `inverse: true`), so this method covers both declared and
   * inverse edges without the registry having to compute them.
   */
  relations(pathOrKey: string): RelationEdge[] {
    const entry = this.get(pathOrKey);
    if (!entry || !entry.relations) return [];
    const source = this.shortPath(entry);
    const out: RelationEdge[] = [];
    for (const [name, def] of Object.entries(entry.relations)) {
      out.push(this.toEdge(source, name, def));
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

  private toEdge(source: string, name: string, def: DescribeRelation): RelationEdge {
    if (def.kind === 'belongsTo') {
      return {
        kind: 'belongsTo',
        name,
        source,
        target: def.target,
        foreignKey: def.localKey,
        declared: true,
      };
    }
    const fk = def.foreignKey ?? `${source}Id`;
    const edge: RelationEdge = {
      kind: def.kind,
      name,
      source,
      target: def.target,
      foreignKey: fk,
      declared: !def.inverse,
    };
    if (def.inverse) edge.inverse = true;
    if (def.callable === false) edge.callable = false;
    return edge;
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
