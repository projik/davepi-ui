---
title: Config reference
description: davepi-ui.config.ts + per-resource ResourceConfig shape.
---

## `defineConfig(config)`

```ts
import { defineConfig } from '@davepi/ui-core';

defineConfig({
  apiBaseUrl: 'http://localhost:4001',
  branding: { name: 'CRM', logo: '/logo.svg' },
  categoryOrder: ['CRM', 'Catalogue'],
  widgets: { '*.email': 'EmailInput' },
  resources: {
    account: { label: 'Customer' },
  },
});
```

| Key | Type | Notes |
|---|---|---|
| `apiBaseUrl` | `string` | davepi backend base URL |
| `branding` | `{ name?, logo? }` | shown in the sidebar header |
| `categoryOrder` | `string[]` | sidebar category order; unlisted categories fall to alphabetical |
| `widgets` | `Record<string, WidgetKind>` | glob keys `*.field` or `resource.field` |
| `resources` | `Record<string, ResourceConfig>` | inline per-resource config (prefer override files) |

## `ResourceConfig`

```ts
{
  label, pluralLabel, category, displayField,
  listColumns, formSections, widgets,
  actions: { row: ActionSpec[], bulk: ActionSpec[] },
  permissions: { list, read, create, update, delete },
}
```

| Key | Type | Notes |
|---|---|---|
| `label` / `pluralLabel` | `string` | resource display labels |
| `category` | `string` | sidebar group |
| `displayField` | `string` | field used by RelationPicker + breadcrumbs |
| `listColumns` | `(string \| ColumnSpec)[]` | table columns |
| `formSections` | `FormSectionSpec[]` | form grouping |
| `widgets` | `Record<string, WidgetKind>` | per-field widget overrides |
| `actions.row` | `ActionSpec[]` | row kebab menu items |
| `actions.bulk` | `ActionSpec[]` | bulk-action bar buttons |
| `permissions` | `Record<op, string[]>` | role allowlist per operation |
