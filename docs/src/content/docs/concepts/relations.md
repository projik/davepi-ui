---
title: Relation graph
description: Declared + synthetic inverse relations across resources.
---

`SchemaRegistry.relations(path)` returns every edge the framework knows about:

- **Declared** — straight from the schema's `relations` block (`belongsTo` / `hasMany` / `hasOne`).
- **Synthetic** — inverses inferred from FK-by-convention.

## Synthetic inverse rules

For each `belongsTo: { target: 'X', localKey: 'xId' }` on resource `Y`, the registry registers a virtual `hasMany` edge from `X` to `Y` with `foreignKey: 'xId'`. The inverse is also synthesised when a field is named `{target}Id` even without a relations block.

This is what lets a parent page render child lists *before* the backend ships explicit inverse relations.

## Effect on the UI

- `<ResourceDetail>` — every child relation becomes a tab with an embedded `<RelatedList>`.
- `<RelatedList>` — embedded `<ResourceTable>` filtered by parent FK with `+ New <Child>` opening `<RelatedCreateModal>` pre-stamped.
- `<RelationPicker>` — shows the target's records via the picker's combobox.

## Backend asks (M0.5)

For the cleanest experience, the davepi backend can expose:

- `displayField` per schema — single field used by RelationPicker / breadcrumbs.
- `label` / `pluralLabel` per schema.
- Field-level `widget` / `format` hints.
- Auto-populated inverse relations.

None of these are blockers. The UI synthesises today.
