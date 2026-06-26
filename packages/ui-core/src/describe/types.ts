/**
 * TypeScript shape of davepi's `GET /_describe` manifest.
 *
 * Mirrors `utils/describeManifest.js` in the davepi backend. Keep in sync
 * when backend manifest fields change. The Reference here is intentionally
 * permissive (Record<string, unknown> on unknown extras) so the UI does
 * not break on additive backend changes.
 *
 * @see https://github.com/projik/davepi/blob/main/utils/describeManifest.js
 */

export type DescribeFieldType =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Date'
  | 'Buffer'
  | 'ObjectId'
  | 'Mixed'
  | 'File'
  | `[${string}]`
  | (string & {});

export interface DescribeFieldAcl {
  read?: string[];
  create?: string[];
  update?: string[];
}

export interface DescribeFileMeta {
  maxBytes?: number;
  accept?: string[];
  access?: 'public' | 'private';
}

export interface DescribeField {
  name: string;
  type: DescribeFieldType;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  reference?: string;
  searchable?: boolean;
  searchWeight?: number;
  acl?: DescribeFieldAcl;
  file?: DescribeFileMeta;
  /** Enum values for String fields (mongoose `enum` array). */
  enum?: readonly string[];
  /** Widget kind hint, e.g. 'rich-text' | 'textarea' | 'email' | 'url' | 'currency'. */
  widget?: string;
  /** Value-format hint, e.g. 'currency:USD' | 'date'. */
  format?: string;
  /** Explicit display label override for the field. */
  label?: string;
  /** True when the server fills this field from the JWT — UI hides it from create / edit forms. */
  stamped?: boolean;
  /**
   * True when the server derives this field from other fields on read.
   * Sending a value is meaningless (silently overwritten), so the UI
   * treats it like `stamped`: hidden from create / edit, read-only.
   */
  computed?: boolean;
}

export type DescribeRelation =
  | { kind: 'belongsTo'; target: string; localKey: string }
  | {
      kind: 'hasMany';
      target: string;
      foreignKey?: string;
      where?: Record<string, unknown>;
      /** True when the backend synthesised this from a sibling `belongsTo`. */
      inverse?: boolean;
      /**
       * False when this edge is manifest-only — the parent's per-schema
       * runtime relation map doesn't know about it, so REST `__include`,
       * MCP relation tools, and GraphQL graph edges will reject the
       * relation by name. Consumers should fetch the children with a
       * regular list + filter on `foreignKey` instead. Default (absent
       * or true) = callable through every surface.
       */
      callable?: boolean;
    }
  | {
      kind: 'hasOne';
      target: string;
      foreignKey?: string;
      where?: Record<string, unknown>;
      inverse?: boolean;
      callable?: boolean;
    };

export interface DescribeAcl {
  list?: string[];
  delete?: string[];
  fields?: Record<string, DescribeFieldAcl>;
}

export interface DescribeAggregationParam {
  type: string;
  required?: boolean;
  description?: string;
}

export interface DescribeAggregation {
  name: string;
  description?: string;
  params?: Record<string, DescribeAggregationParam>;
  cache?: { ttlSeconds: number };
  unsafe?: boolean;
  maxResults?: number;
}

export interface DescribeFileField {
  name: string;
  access: 'public' | 'private';
  maxBytes?: number;
  accept?: string[];
}

export interface DescribeFeatures {
  softDelete: boolean;
  audit: boolean;
  search?: string[];
}

export interface DescribeEndpoints {
  list: string;
  create: string;
  bulkPut: string;
  get: string;
  update: string;
  delete: string;
  schema: string;
  restore?: string;
  history?: string;
  files?: Record<string, { upload: string; fetch: string; delete: string }>;
  aggregations?: string[];
}

export interface DescribeGraphql {
  queries: string[];
  mutations: string[];
  relations?: string[];
}

export interface DescribeSchemaEntry {
  version: string;
  path: string;
  collection: string;
  description?: string;
  fields: DescribeField[];
  features: DescribeFeatures;
  endpoints: DescribeEndpoints;
  graphql: DescribeGraphql;
  relations?: Record<string, DescribeRelation>;
  aggregations?: DescribeAggregation[];
  fileFields?: DescribeFileField[];
  acl?: DescribeAcl;
  /** Backend M0.5 addition (planned). Resource display label. */
  label?: string;
  /** Backend M0.5 addition (planned). Plural resource display label. */
  pluralLabel?: string;
  /** Backend M0.5 addition (planned). Field name shown in pickers / breadcrumbs. */
  displayField?: string;
}

export interface DescribeManifest {
  service: { name: string; version: string };
  auth: Record<string, string>;
  conventions: Record<string, unknown>;
  graphql: { endpoint: string; playground: string };
  /** Keyed by `${version}/${path}`, e.g. `v1/account`. */
  schemas: Record<string, DescribeSchemaEntry>;
}
