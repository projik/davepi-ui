# davepi-ui

Schema-driven, agent-first admin UI framework for [davepi](https://github.com/projik/davepi) backends.

Auto-generates default views from `/_describe`, ships a shadcn-based widget library, exposes a JSON descriptor schema and MCP server so AI agents can compose pages.

## Status

Pre-alpha. M0 scaffolding only — see [plan](https://github.com/projik/davepi-ui) for milestones.

## Packages

- `@davepi/ui-core` — framework-agnostic schema registry, widget resolver, descriptors, zod-from-describe.
- `@davepi/ui-react` — React components, TanStack Query hooks, AuthProvider on top of `client/davepi-runtime`.
- `@davepi/ui-app-react` — deployable Vite admin shell with sidebar/login/resource routes.
- `@davepi/ui-cli` — `create-davepi-ui` scaffolder.
- `@davepi/ui-mcp` — MCP server for agent-driven page composition.

## Development

```bash
pnpm install
pnpm dev
```

## License

MIT
