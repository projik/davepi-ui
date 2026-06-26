---
name: davepi-ui
description: Build, customise, and extend davepi-ui admin frontends — schema-driven React admin generated from a davepi backend's /_describe manifest. Use when the user is editing a davepi-ui project (root has packages/ui-app-react, davepi-ui.config.ts, or src/resources/), wants to compose pages from JSON descriptors, override a resource's columns/forms/actions, build a new widget, or wire the @davepi/ui-mcp server. Triggers on "davepi-ui", "admin UI", "ResourceTable", "RelationPicker", "/_describe", "shadcn admin", "agent first admin", or when CLAUDE.md / package.json mention davepi.
---

# davepi-ui

Schema-driven, agent-first React admin framework on top of [davepi](https://github.com/projik/davepi) backends. Components are composable via plain JSX *and* JSON descriptors so AI agents can emit pages programmatically.

## When to use this skill

- The repo has `packages/ui-app-react` or imports from `@davepi/ui-*`.
- The user wants to add or override a resource view (`/r/contact`, `/r/account/new`, etc.).
- The user wants to compose a page from a JSON descriptor.
- The user is wiring the `@davepi/ui-mcp` server into Claude Code or another MCP client.
- The user wants to add a custom widget, a new shadcn primitive, or a bulk/row action.

## Conceptual model (read once, return when stuck)

```
/_describe (live davepi)        ←  source of truth: fields, types, ACL, relations
        │
        ▼
SchemaRegistry (@davepi/ui-core) ←  builds bidirectional relation graph + display labels
        │
        ▼
resolveWidget(field)             ←  maps a describe field → a WidgetKind
        │
        ▼
widgetRegistry[kind]              ←  React component (TextInput / RelationPicker / …)
        │
        ▼
<ResourceTable> / <ResourceForm> / <ResourceDetail>  ←  page-level components
        │
        ▼
davepi-ui.config.ts + src/resources/{path}.ts  ←  per-resource overrides
        │
        ▼
inline JSX props                  ←  last-mile escape hatch
```

Override merge order (low → high): describe defaults ← app-wide config ← per-resource override ← inline JSX prop.

## Packages

| Package | Purpose | Notes |
|---|---|---|
| `@davepi/ui-core` | framework-agnostic — registry, widget resolver, descriptors, zod-from-describe, manifest, recipes | zero React |
| `@davepi/ui-react` | React: AuthProvider, hooks, ConfigProvider, ACL hooks | peer-dep on react + TanStack Query |
| `@davepi/ui-app-react` | deployable Vite + React Router shell with widgets and pages | the example app — clone or import |
| `@davepi/ui-mcp` | MCP server exposing manifest + recipes + live resource graph | stdio transport |

## Common tasks — recipes

### 1. Override a resource's list columns + bulk delete

Create `src/resources/{path}.ts` exporting a default `ResourceConfig`:

```ts
import type { ResourceConfig } from '@davepi/ui-core';

const config: ResourceConfig = {
  label: 'Account',
  pluralLabel: 'Accounts',
  category: 'CRM',
  displayField: 'accountName',
  listColumns: [
    { field: 'accountName', label: 'Account name' },
    { field: 'description', label: 'Notes' },
  ],
  actions: {
    bulk: [{ id: 'bulk-delete', label: 'Delete selected', kind: 'bulkDelete' }],
  },
};

export default config;
```

Auto-discovered by `src/resourceOverrides.ts` via `import.meta.glob('./resources/*.{ts,tsx}', { eager: true })`. No registration step.

### 2. Group, order, icon, and hide sidebar resources

App-wide `davepi-ui.config.ts` controls grouping order:

```ts
import { defineConfig } from '@davepi/ui-core';

export default defineConfig({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  branding: { name: 'My CRM' },
  categoryOrder: ['CRM', 'Catalogue', 'Delivery'],
});
```

Then set per-resource nav fields on each override file (or under `resources` in the app config):

```ts
const config: ResourceConfig = {
  category: 'CRM',          // sidebar group; respects categoryOrder above
  icon: 'users',            // lucide name (kebab/snake/Pascal) OR an emoji '👤'
  hidden: false,            // true → drop from sidebar + dashboard (route still works)
};
```

- Resources without `category` land at the bottom in alphabetical order; items within a group sort alphabetically by label.
- `icon` resolves against the [lucide](https://lucide.dev) set (`'shopping-cart'`, `'ShoppingCart'`, `'users'` all work); anything unmatched renders as a literal string, so emojis just work. Rendered by `src/components/ResourceIcon.tsx`.
- `hidden` is **cosmetic only** — it declutters nav, the `/r/{path}…` routes still resolve. For real access control use `permissions` / backend ACL (recipe 8).

### 3. Group form fields into sections

```ts
const config: ResourceConfig = {
  formSections: [
    { title: 'Identity', fields: [{ field: 'first_name' }, { field: 'last_name' }, { field: 'email' }] },
    { title: 'Contact', fields: [{ field: 'phone' }, { field: 'mobile' }] },
    {
      title: 'Address',
      description: 'Postal address used for invoices.',
      fields: [{ field: 'address1' }, { field: 'address2' }, { field: 'suburb' }, { field: 'state' }, { field: 'postcode' }, { field: 'country' }],
    },
  ],
};
```

### 4. Build a page from a JSON descriptor

Validate the spec via `PageSpec.parse` (or call `validate_page_spec` over MCP) then drop into the runtime:

```ts
const spec = {
  kind: 'page',
  title: 'Customers',
  blocks: [
    { kind: 'heading', text: 'High-value customers', level: 1 },
    {
      kind: 'table',
      resource: 'account',
      columns: [{ field: 'accountName' }, { field: 'description' }],
      bulkActions: [{ id: 'export', label: 'Export', kind: 'custom' }],
    },
  ],
};
```

### 5. Add a parent → child detail tab

It's automatic. As long as the child schema declares a `belongsTo` relation OR has a FK field named `{parent}Id`, `SchemaRegistry` synthesises the inverse and `<ResourceDetail>` adds a tab. No code needed.

### 6. Customise a widget for one field

Inline (highest precedence):

```tsx
<ResourceForm
  resourcePath="contact"
  widgetOverrides={{ email: MyFancyEmailWidget }}
  ...
/>
```

Or app-wide via `config.widgets`:

```ts
defineConfig({
  widgets: { '*.email': 'EmailInput', 'contact.notes': 'RichTextEditor' },
});
```

### 7. Add a custom widget

1. Implement a component receiving `WidgetComponentProps` from `@davepi/ui-app-react`.
2. Register in `src/widgets/registry.ts` under a new `WidgetKind` or override an existing kind.
3. Use `field.widget` hint in describe (or `widgets` override in config) to dispatch.

### 8. Gate access by role

Server enforces; UI declutters:

```ts
const config: ResourceConfig = {
  permissions: {
    list: ['admin', 'manager'],
    delete: ['admin'],
  },
};
```

`<Sidebar>` hides resources excluded by `permissions.list` (server still enforces). `<ResourceTable>` hides the "New" / "Delete" buttons. `<ResourceForm>` disables fields gated by field-level ACL on the backend. To declutter nav *without* a role gate, use `hidden: true` (recipe 2) instead.

### 9. Customize the dashboard / home page

App-wide `davepi-ui.config.ts` `dashboard` block tunes the home view (`src/pages/DashboardPage.tsx`):

```ts
export default defineConfig({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  dashboard: {
    title: 'Admin',                    // default: 'Dashboard'
    subtitle: 'Welcome back.',         // '' hides the line; omit for default copy
    resourceCards: ['account', 'order'], // explicit list + order; omit → every resource
    // showResourceCards: false,        // blank canvas — then drop your own widgets in
  },
});
```

- Cards skip any resource with `hidden: true` and honour its `icon` / `pluralLabel`.
- For a fully custom dashboard, set `showResourceCards: false` and edit `DashboardPage.tsx` directly — it's part of the app template you clone, not a published package.

## MCP server (`@davepi/ui-mcp`)

Tools available over stdio:

| Tool | Purpose |
|---|---|
| `list_components` | name + category per published component |
| `describe_component({ name })` | full manifest entry (props JSON Schema, examples, agent notes) |
| `list_recipes` | curated patterns (`list-with-search`, `detail-with-children`, `pre-stamped-create`, …) |
| `validate_page_spec({ spec })` | parse JSON descriptor against PageSpec, return parsed value or zod issues |
| `list_resources` | live resource paths from `/_describe` (requires `DAVEPI_API_URL`) |
| `relation_graph` | full edge list across all resources (requires `DAVEPI_API_URL`) |

Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "davepi-ui": {
      "command": "node",
      "args": ["./node_modules/@davepi/ui-mcp/dist/server.js"],
      "env": {
        "DAVEPI_API_URL": "http://localhost:4001",
        "DAVEPI_API_TOKEN": "<optional bearer>"
      }
    }
  }
}
```

## File-finding cheat sheet

| You want | Look at |
|---|---|
| widget resolver rules | `packages/ui-core/src/resolveWidget.ts` |
| relation graph logic | `packages/ui-core/src/describe/registry.ts` |
| auth + 401 refresh interceptor | `packages/ui-react/src/auth/AuthProvider.tsx` |
| describe + resource hooks | `packages/ui-react/src/hooks/*.ts` |
| widget component for kind X | `packages/ui-app-react/src/widgets/{Kind}.tsx` |
| sidebar grouping / icon / hidden | `packages/ui-app-react/src/components/Sidebar.tsx` |
| resource icon resolution (lucide/emoji) | `packages/ui-app-react/src/components/ResourceIcon.tsx` |
| dashboard / home page | `packages/ui-app-react/src/pages/DashboardPage.tsx` |
| config field definitions | `packages/ui-core/src/config.ts` |
| add a shadcn primitive | `packages/ui-app-react/src/components/ui/` |
| descriptor JSON schemas | `packages/ui-core/src/descriptor/index.ts` |
| component manifest entries | `packages/ui-core/src/manifest.ts` |

## Don't-dos

- Don't bypass the merge order — inline props are intentional last-mile only. Push reusable behaviour into per-resource overrides.
- Don't render raw `_id` strings to humans. Always go through `SchemaRegistry.preview(path, record)` so the `displayField` rules apply.
- Don't write `<ResourceForm>` field children as JSX literals when a section config works — sections survive config-driven changes; JSX doesn't.
- Don't fetch `/_describe` more than once per session. `useDescribe()` already caches with `staleTime: Infinity`.
- Don't store the access token in localStorage. The refresh token goes there; the access token stays in memory in `AuthProvider`.

## Smoke test before claiming done

1. `pnpm build` at the repo root — all packages compile clean.
2. `pnpm --filter @davepi/ui-core test` — vitest green (including manifest snapshot).
3. `pnpm --filter @davepi/ui-app-react dev` against a davepi backend on `:4001`, login, sidebar populates, navigate to a resource list, create + edit a record.
4. If MCP changes: `printf '...' | node packages/ui-mcp/dist/server.js` round-trip with `tools/list` + a tool call.
