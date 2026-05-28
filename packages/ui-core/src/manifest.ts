/**
 * Component manifest — the contract between davepi-ui and AI agents.
 *
 * Every component published by `@davepi/ui-react` / `@davepi/ui-app-react`
 * has an entry here describing: what it does, what props it takes (as a
 * JSON Schema fragment), where it sits in the component taxonomy, and
 * one or more canonical usage examples. Agents read the manifest via
 * the `@davepi/ui-mcp` server and use it to compose pages.
 *
 * The manifest is hand-curated today; a `react-docgen-typescript`-driven
 * generator that derives it from TSDoc + prop types is the M4 task. The
 * hand-curated version stays as the source of truth for examples and
 * agent notes — auto-generated prop schemas merge on top at build time.
 */

export interface ComponentExample {
  /** Short label shown to the agent. */
  label: string;
  /** JSON spec showing how to invoke the component declaratively. */
  spec: Record<string, unknown>;
  /** TSX snippet for JSX-driven usage. */
  jsx?: string;
}

export interface ComponentManifestEntry {
  name: string;
  package: string;
  category: 'data' | 'field' | 'layout' | 'action' | 'auth' | 'page';
  description: string;
  /** JSON-Schema fragment for the component's props (subset of full TS types). */
  propsSchema: Record<string, unknown>;
  examples: ComponentExample[];
  /** Notes specifically aimed at agents — common pitfalls, prefer-this guidance. */
  agentNotes?: string;
}

/**
 * Hand-curated manifest for the M1 surface. Add new entries as
 * components ship. Order matters only for stable diffs.
 */
export const componentManifest: ComponentManifestEntry[] = [
  {
    name: 'ResourceTable',
    package: '@davepi/ui-app-react',
    category: 'data',
    description:
      'Schema-driven list table. Reads the `/_describe` entry for the resource, picks default columns from the first non-stamped fields, supports sortable headers, full-text search (when the schema declares searchable fields), and pagination. Row clicks navigate to `/r/:path/:id`.',
    propsSchema: {
      type: 'object',
      required: ['resourcePath'],
      properties: {
        resourcePath: {
          type: 'string',
          description: 'Short resource path, e.g. "account" or "contact".',
        },
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Explicit column field names. Defaults to first ~5 non-stamped fields.',
        },
        filters: {
          type: 'object',
          additionalProperties: true,
          description: 'Mongo-querystring filters merged into every list call.',
        },
      },
    },
    examples: [
      {
        label: 'List all contacts',
        spec: { kind: 'table', resource: 'contact' },
        jsx: '<ResourceTable resourcePath="contact" />',
      },
      {
        label: 'List active deals with explicit columns',
        spec: {
          kind: 'table',
          resource: 'deal',
          columns: [
            { field: 'name', label: 'Deal name' },
            { field: 'stage' },
            { field: 'amount', format: 'currency:USD' },
            { field: 'closeDate' },
          ],
          filters: { stage: { $ne: 'lost' } },
        },
      },
    ],
    agentNotes:
      'Prefer the JSON spec form when emitting a page descriptor; pass explicit `columns` only when the default first-N fields are wrong for the use case.',
  },
  {
    name: 'ResourceForm',
    package: '@davepi/ui-app-react',
    category: 'data',
    description:
      'Auto-generated create/edit form. Builds a zod schema from `/_describe`, resolves a widget per field, drives validation through react-hook-form. Hidden fields stay in the payload but render readonly — used by RelatedCreateModal in M2 to stamp parent FKs.',
    propsSchema: {
      type: 'object',
      required: ['resourcePath', 'onSubmit'],
      properties: {
        resourcePath: { type: 'string' },
        initial: { type: 'object', additionalProperties: true },
        hiddenFields: { type: 'array', items: { type: 'string' } },
        omitFields: { type: 'array', items: { type: 'string' } },
        submitLabel: { type: 'string' },
      },
    },
    examples: [
      {
        label: 'Create new contact form',
        spec: {
          kind: 'form',
          resource: 'contact',
          sections: [{ title: 'Identity', fields: [{ field: 'first_name' }, { field: 'last_name' }] }],
        },
      },
    ],
  },
  {
    name: 'ResourceDetail',
    package: '@davepi/ui-app-react',
    category: 'data',
    description:
      'Detail view for a single record. Renders fields in describe order with type-aware formatting; ships Edit and Delete actions. Lists related resources for one-click navigation.',
    propsSchema: {
      type: 'object',
      required: ['resourcePath', 'id'],
      properties: {
        resourcePath: { type: 'string' },
        id: { type: 'string' },
      },
    },
    examples: [
      {
        label: 'View an account',
        spec: { kind: 'detail', resource: 'account', id: '<account-id>' },
      },
    ],
  },
  {
    name: 'AuthProvider',
    package: '@davepi/ui-react',
    category: 'auth',
    description:
      'JWT auth context. Memory access token + localStorage refresh token + rotation on refresh + 401-retry interceptor. Decodes JWT for roles so ACL gating works without a /me round-trip.',
    propsSchema: {
      type: 'object',
      required: ['baseUrl'],
      properties: {
        baseUrl: { type: 'string', description: 'davepi backend base URL.' },
      },
    },
    examples: [
      {
        label: 'Mount at app root',
        spec: {},
        jsx: '<AuthProvider baseUrl="http://localhost:4001"><App /></AuthProvider>',
      },
    ],
  },
  {
    name: 'AuthGuard',
    package: '@davepi/ui-react',
    category: 'auth',
    description:
      'Conditional render guard. Shows children only when authenticated (and optionally holding one of the listed roles). Server-side ACL is still the source of truth.',
    propsSchema: {
      type: 'object',
      properties: {
        roles: { type: 'array', items: { type: 'string' } },
      },
    },
    examples: [
      {
        label: 'Admin-only section',
        spec: {},
        jsx: '<AuthGuard roles={["admin"]} fallback={<NotAllowed />}><AdminPanel /></AuthGuard>',
      },
    ],
  },
];

/** Lookup by name. */
export function getComponent(name: string): ComponentManifestEntry | undefined {
  return componentManifest.find((c) => c.name === name);
}

/** All categories in display order. */
export function listCategories(): ComponentManifestEntry['category'][] {
  return ['page', 'data', 'field', 'layout', 'action', 'auth'];
}

/**
 * Curated patterns combining multiple components. Returned by the MCP
 * `recipes()` tool so an agent can lift a known-good shape rather than
 * inventing from scratch.
 */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  spec: Record<string, unknown>;
}

export const recipes: Recipe[] = [
  {
    id: 'list-with-search',
    title: 'Searchable resource list',
    description:
      'Default list page with sort + search. The simplest descriptor — useful as a base for per-resource overrides.',
    spec: {
      kind: 'page',
      title: '<resource> list',
      blocks: [{ kind: 'table', resource: '<resource>' }],
    },
  },
  {
    id: 'detail-with-children',
    title: 'Detail page with related lists',
    description:
      'Detail view of one record. M1 uses link-out buttons; once M2 ships, swap the `blocks` to include embedded `<RelatedList>` blocks.',
    spec: {
      kind: 'page',
      title: 'View <resource>',
      blocks: [{ kind: 'detail', resource: '<resource>', id: '<id>' }],
    },
  },
  {
    id: 'pre-stamped-create',
    title: 'Create a child with parent FK pre-stamped',
    description:
      'Navigate from a parent detail to `/r/<child>/new?prefill_<parentFk>=<parentId>` — the form renders the FK hidden but keeps it in the submitted payload.',
    spec: {
      kind: 'page',
      title: 'New <child>',
      blocks: [
        {
          kind: 'form',
          resource: '<child>',
          sections: [{ title: 'Details', fields: [{ field: '<parentFk>', hidden: true }] }],
        },
      ],
    },
  },
];
