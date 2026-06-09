# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`davepi-ui` is a schema-driven, agent-first admin UI framework for [davepi](https://github.com/projik/davepi) backends. It auto-generates list / detail / create / edit views by reading the backend's live `GET /_describe` manifest — no per-resource code required. A single manifest is the source of truth for labels, widget choice, relations, ACLs, and validation.

pnpm + turbo monorepo. Node 22 (`.nvmrc`; `engines` says `>=20`). Package manager pinned to `pnpm@10.18.1`.

## Commands

Run from repo root (turbo orchestrates across packages):

```bash
pnpm install
pnpm build          # turbo run build (tsup per package; respects ^build dep order)
pnpm test           # turbo run test (depends on ^build — builds deps first)
pnpm lint
pnpm typecheck      # tsc --noEmit per package
pnpm clean          # clean + rm -rf node_modules
```

Per-package / targeted:

```bash
pnpm --filter @davepi/ui-core test          # one package's tests
pnpm --filter @davepi/ui-core test -- <file>  # single vitest file/pattern
pnpm --filter @davepi/ui-core dev           # tsup --watch
VITE_API_URL=http://localhost:4001 pnpm --filter @davepi/ui-app-react dev  # run admin shell against a backend
```

Tests use **vitest** (`vitest run`). There is no separate single-test command — pass a file path or `-t <name>` pattern to vitest.

## Packages (`packages/*`)

| Package | Role | Published? |
|---|---|---|
| `@davepi/ui-core` | Framework-agnostic: schema registry, widget resolver, zod-from-describe, JSON page descriptors, component manifest | yes |
| `@davepi/ui-react` | React: HTTP client, TanStack Query hooks, Auth/Config providers, ACL hooks | yes |
| `@davepi/ui-mcp` | MCP (stdio) server exposing component manifest + recipes + live resource graph to agents | yes |
| `@davepi/ui-app-react` | Deployable Vite + React Router admin shell; the widget implementations live here | **template — clone, don't install** |
| `create-davepi-ui` | `npx` scaffolder; templates synced from `ui-app-react` on `prepublishOnly` | yes |

Dependency direction: `ui-app-react` → `ui-react` → `ui-core`; `ui-mcp` → `ui-core`. Internal deps use `workspace:*` / `workspace:^`.

## Architecture — the big picture

Everything flows from the **`/_describe` manifest**. Trace this to understand the system:

1. **Fetch & registry** (`ui-core/src/describe/`): `fetchDescribe` pulls the manifest; `SchemaRegistry` (`registry.ts`) wraps a manifest snapshot — resolve a resource by short path (`account`) or full key (`v1/account`), compute display labels, compute the canonical `displayField`, and expose relation edges (`belongsTo` / `hasMany` / `hasOne`, including backend-synthesised inverse edges). Build once at boot; treat as immutable; re-create on refetch. The manifest shape is mirrored in `describe/types.ts` — **keep in sync with the davepi backend's `utils/describeManifest.js`**.

2. **Widget resolution** (`ui-core/src/resolveWidget.ts`): maps each manifest field to an abstract `WidgetKind` (framework-agnostic string). Resolution priority, low → high: built-in default per (type, name-pattern) → backend `field.widget` hint → app-wide override (`resource.field` or `*.field`) → per-resource override → inline JSX `widgets` prop (merged by `<ResourceForm>`). Relations are inferred from `field.reference` or the `<name>Id` → `<name>` naming convention.

3. **Validation** (`ui-core/src/zodFromDescribe.ts`): generates zod schemas from the manifest for form validation.

4. **React layer** (`ui-react`): `client.ts` is a standalone davepi HTTP client (`DavepiError`, list/CRUD, 401-refresh hook) — intentionally **not** depending on davepi as a peer dep. Hooks (`useResource`, `useDescribe`) wrap it in TanStack Query. `AuthProvider` / `ConfigProvider` / `useAcl` round it out.

5. **App shell** (`ui-app-react`): `App.tsx` defines the only routes — `/`, `/r/:path`, `/r/:path/new`, `/r/:path/:id`, `/r/:path/:id/edit`. `widgets/registry.ts` maps every `WidgetKind` → a concrete React component (shadcn/Radix + Tailwind); unknown kinds fall back to `TextInput` rather than throwing. The kind→component map is overridable at runtime via `<ResourceForm>`.

### Configuration & override layering

Three tiers, deep-merged, highest wins:
- App-wide: `ui-app-react/src/davepi-ui.config.ts` (`defineConfig` from ui-core) — `apiBaseUrl`, branding, `categoryOrder`.
- Per-resource: `ui-app-react/src/resources/{path}.ts(x)`.
- Inline: JSX props on `<ResourceTable>` / `<ResourceForm>`.

### Notable manifest semantics (don't trip on these)

- `stamped` fields (server fills from JWT) are hidden from create/edit forms.
- `hasMany` edges with `callable: false` are **manifest-only** — REST `__include`, MCP relation tools, and GraphQL edges reject them by name. Fetch children via a plain list + foreign-key filter instead (this is what `<RelatedList>` already does).

## MCP server

`ui-mcp` is a stdio MCP server. Tools: `list_components`, `describe_component`, `list_recipes`, `validate_page_spec` (runs spec through `PageSpec.parse` from `@davepi/ui-core/descriptor`), and — when `DAVEPI_API_URL` is set — `list_resources` and `relation_graph` (live, from `/_describe`). Env: `DAVEPI_API_URL`, `DAVEPI_API_TOKEN`. See the header comment in `src/server.ts` for `.mcp.json` wiring.

## Releases

Changesets-driven. `linked` group: `ui-core` / `ui-react` / `ui-mcp` version together. `ui-app-react`, docs, and playground are `ignore`d (not published). Base branch `main`. CI/release in `.github/workflows/{ci,release}.yml`. Add a changeset (`pnpm changeset`) for any change to a published package.

## Docs

Astro Starlight site in `docs/`. Claude Code skill at `docs/skill/davepi-ui/SKILL.md`.
