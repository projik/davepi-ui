---
title: Schema-driven model
description: How davepi's /_describe manifest drives every view in davepi-ui.
---

`davepi-ui` builds every page from one source of truth: the live `/_describe` manifest your backend exposes.

## Data flow

```
/_describe          → SchemaRegistry → resolveWidget → widgetRegistry → page
(fields, ACL,         (relation graph    (widget kind     (React component)
 relations, search)    + display labels)   per field)
```

## `/_describe` contract

The backend manifest is shaped by `utils/describeManifest.js` in davepi. Key fields davepi-ui reads:

- `fields[]` — name, type (`String` / `[String]` / `Number` / `Date` / `File` / `ObjectId` / etc.), `required`, `unique`, `searchable`, `acl`, `reference`, optional `widget`/`format` hints.
- `relations` — `belongsTo`/`hasMany`/`hasOne` with FK declarations.
- `features.search` — fields the backend will accept `__q` against.
- `acl.list` / `acl.delete` / `acl.fields[name]` — role gates.

## `SchemaRegistry`

`@davepi/ui-core` exports `SchemaRegistry`. Built once at boot from the cached manifest. Responsibilities:

- Resolve `display()` → label, pluralLabel, displayField (with fallback chain when backend hints absent).
- Compute `preview(path, record)` — the human label to render for a record.
- Build the **bidirectional relation graph**: for every declared `belongsTo`, synthesise an inverse `hasMany` on the parent even if the parent's schema omits one. This is what lets `<RelatedList parent="account" relation="contacts">` work today, before backend hints land.

## Caching

`useDescribe()` fetches once with `staleTime: Infinity`. The hook returns both the raw manifest and a memoised `SchemaRegistry`. Schemas update only on backend redeploy or hot-reload, so we don't refetch on focus.
