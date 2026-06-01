# davepi-ui

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

Schema-driven, agent-first admin UI framework for [davepi](https://github.com/projik/davepi) backends.

Auto-generates list / detail / create / edit views from the live `/_describe` manifest. Ships a shadcn-themed widget library with relation-aware combobox pickers, embedded child lists, and an inline create modal that stamps the parent foreign key. Exposes a JSON descriptor schema and an MCP server so AI agents can compose pages programmatically.

## Why

Every Refine-style admin we tried had the same three frustrations:

1. Field labels rendered raw DB names (`firstName` instead of "First name").
2. Setting a relation meant typing a UUID into a text input.
3. Creating a child resource (e.g. a `Quote` under a `Contact`) meant navigating away from the parent, opening the child form, and re-typing the parent ID.

davepi-ui fixes all three from a single source of truth — the davepi backend's `/_describe` manifest — and lets you override anything per-resource via a config file or inline JSX prop.

## Packages

| Package | Purpose | Status |
|---|---|---|
| [`@davepi/ui-core`](./packages/ui-core) | Framework-agnostic schema registry, widget resolver, JSON descriptors, zod-from-describe | publishable |
| [`@davepi/ui-react`](./packages/ui-react) | React components, TanStack Query hooks, AuthProvider, ConfigProvider, ACL hooks | publishable |
| [`@davepi/ui-mcp`](./packages/ui-mcp) | MCP server exposing the component manifest + live resource graph to agents | publishable |
| [`@davepi/ui-app-react`](./packages/ui-app-react) | Deployable Vite + React Router admin shell (clone this — don't `npm install`) | template |

## Install

```bash
npm install @davepi/ui-core @davepi/ui-react @tanstack/react-query
```

## Quick start

Point the example app shell at a running davepi backend:

```bash
git clone https://github.com/projik/davepi-ui
cd davepi-ui
pnpm install
VITE_API_URL=http://localhost:4001 pnpm --filter @davepi/ui-app-react dev
```

Open `http://localhost:5173`, sign in with any davepi user — every resource in the backend is now a CRUD page.

## Docs

- Full reference site: [Astro Starlight build in `docs/`](./docs)
- Claude Code skill: [`docs/skill/davepi-ui/SKILL.md`](./docs/skill/davepi-ui/SKILL.md)
- MCP server config: [`packages/ui-mcp/README.md`](./packages/ui-mcp/README.md)

## Development

```bash
pnpm install
pnpm -r build
pnpm --filter @davepi/ui-core test
pnpm --filter @davepi/ui-app-react dev
```

## License

[MIT](./LICENSE)
