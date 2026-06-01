---
title: Recipes
description: Curated patterns agents can lift directly.
---

Call `list_recipes` over MCP to fetch the latest. Each recipe is a JSON `PageSpec` template — drop in resource names, ship.

## `list-with-search`

```ts
{
  kind: 'page',
  title: '<plural label>',
  blocks: [
    {
      kind: 'table',
      resource: '<path>',
      pageSize: 25,
    },
  ],
}
```

## `detail-with-children`

```ts
{
  kind: 'page',
  title: '<record preview>',
  blocks: [
    { kind: 'detail', resource: '<path>', id: '<id>' },
  ],
}
```

The `<ResourceDetail>` runtime adds tabs for every child relation discovered through the schema graph. No explicit `embeds` block needed unless you want to filter.

## `pre-stamped-create`

For a child create that inherits a parent FK:

```ts
{
  kind: 'page',
  title: 'New <Child>',
  blocks: [
    {
      kind: 'form',
      resource: '<child path>',
      onSuccessTo: '/r/<parent path>/<parent id>',
    },
  ],
}
```

Then navigate to `/r/<child>/new?prefill_<fk>=<parent id>` — the form picks up prefill from the URL and renders the FK hidden + readonly.
