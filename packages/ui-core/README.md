# @davepi/ui-core

Framework-agnostic core for [davepi-ui](https://github.com/projik/davepi-ui) — the schema-driven, agent-first admin UI framework for [davepi](https://github.com/projik/davepi) backends.

Zero React. Pure TypeScript. Imported by `@davepi/ui-react`, `@davepi/ui-mcp`, and any other consumer of the davepi `/_describe` manifest.

## What's inside

- **`SchemaRegistry`** — wraps `/_describe`, surfaces declared + backend-synthesised inverse relations, computes display labels (label → pluralLabel → displayField fallback chain).
- **`resolveWidget(field, ctx)`** — maps a describe field to a `WidgetKind` via type + name + backend hint + override merge order.
- **`zodFromDescribe(entry)`** — builds a runtime zod schema from a describe entry, with `includeStampedFields` allowlist for parent-FK pre-stamping.
- **`descriptor.PageSpec`** + cousins — JSON descriptor schemas an AI agent can emit to compose pages programmatically.
- **`componentManifest`** + **`recipes`** — agent-facing catalogue of every davepi-ui component + curated page patterns.
- **`labelize`** / **`pluralize`** — camel/snake/kebab → Title Case with acronym table + Id-suffix strip.
- **`defineConfig`** + **`mergeResourceConfig`** — typed config helpers for the per-resource override layer.

## Install

```bash
npm install @davepi/ui-core
```

## Example

```ts
import { SchemaRegistry, resolveWidget, zodFromDescribe } from '@davepi/ui-core';

const manifest = await fetch(`${apiUrl}/_describe`).then((r) => r.json());
const registry = new SchemaRegistry(manifest);

console.log(registry.display('account'));
// { label: 'Account', pluralLabel: 'Accounts', displayField: 'accountName' }

console.log(registry.relations('contact'));
// [{ kind: 'hasMany', target: 'quote', foreignKey: 'contactId', inverse: true, callable: false, ... }]

const entry = registry.get('account')!;
const Schema = zodFromDescribe(entry);
Schema.parse({ accountName: 'Acme' });
```

## Docs

Full reference: https://github.com/projik/davepi-ui

## License

MIT
