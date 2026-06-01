---
title: Component manifest
description: Public components published in @davepi/ui-react and @davepi/ui-app-react.
---

The manifest in `@davepi/ui-core/manifest.ts` is the source of truth for every public component. Each entry includes name, category, package, description, props (JSON Schema), and at least one canonical example.

| Component | Category | Package | What |
|---|---|---|---|
| `ResourceTable` | data | `@davepi/ui-app-react` | schema-driven list table |
| `ResourceForm` | data | `@davepi/ui-app-react` | auto-generated create/edit form |
| `ResourceDetail` | data | `@davepi/ui-app-react` | detail page with relation tabs |
| `RelationPicker` | field | `@davepi/ui-app-react` | combobox over target resource |
| `MultiRelationPicker` | field | `@davepi/ui-app-react` | multi-select picker with chips |
| `RelatedList` | data | `@davepi/ui-app-react` | embedded table filtered by parent FK |
| `RelatedCreateModal` | action | `@davepi/ui-app-react` | inline create with prefill |
| `AuthProvider` | auth | `@davepi/ui-react` | JWT auth context |
| `AuthGuard` | auth | `@davepi/ui-react` | conditional render by role |
| `ConfigProvider` | config | `@davepi/ui-react` | per-resource config context |

Browse the full manifest with `describe_component` over MCP.

## Contract gate

`packages/ui-core/test/manifest.test.ts` snapshots the manifest. Any PR that changes a public prop, name, or example fails until the snapshot is updated deliberately. Update with `pnpm --filter @davepi/ui-core test -u`.
