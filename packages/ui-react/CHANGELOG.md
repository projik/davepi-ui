# @davepi/ui-react

## 0.5.0

### Patch Changes

- Updated dependencies [[`40d419a`](https://github.com/projik/davepi-ui/commit/40d419ae82861e4c0bc966bbab9cb8bf9b6feec7)]:
  - @davepi/ui-core@0.5.0

## 0.4.0

### Minor Changes

- [#13](https://github.com/projik/davepi-ui/pull/13) [`e54df6f`](https://github.com/projik/davepi-ui/commit/e54df6f2ba5994711212c0bbc4d4eb39f5914ea5) Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)! - Add `DescribeProvider` so apps can inject an already-fetched `/_describe` manifest. `useDescribe()` / `useAnonymousDescribe()` now resolve the injected manifest first, falling back to the standard auth-gated query — fixing "Unknown relation target" in `RelationPicker` / `MultiRelationPicker` when the manifest is sourced outside the standard auth flow (e.g. a custom OAuth data layer). Also exports `useOptionalAuth()`.

## 0.3.0

### Minor Changes

- [#8](https://github.com/projik/davepi-ui/pull/8) [`8f6af25`](https://github.com/projik/davepi-ui/commit/8f6af258ac78946c2b09393a7b2df810d5b7a6f2) Thanks [@projik](https://github.com/projik)! - Make `AuthProvider` token-source agnostic so OAuth flows (e.g. `davepi-plugin-oauth`) work without workarounds.

  - Add `useAuth().setSession({ accessToken, refreshToken })` to adopt tokens obtained outside the password flow — such as the `?token=…&refreshToken=…` an OAuth provider lands on the callback URL. The pair travels the same path as a password login: the JWT is decoded for roles/identity, `status` flips to `'authenticated'`, the refresh token is persisted under the canonical `davepi.refreshToken` key, and every data hook + `<AuthGuard>` unblocks.
  - Fix the mount refresh path clobbering a successful reload back to `'unauthenticated'`. The post-refresh fallback read a stale `status` closure (always `'unknown'`), so a valid refresh-on-reload logged the user out and redirected to login. It now downgrades to `'unauthenticated'` only when the refresh genuinely left the status unresolved.
  - Guard against an in-flight `performRefresh` overwriting a newer session. A refresh started at mount (or by a 401) that settles _after_ `login`/`register`/`setSession`/`logout` no longer commits its result — previously a stale refresh failing could `applyTokens(null)` and log the user out right after an OAuth callback. Authoritative session changes now bump a session epoch that refresh results are checked against.

  Together these remove the need for side-channel token keys, an OAuth-aware auth guard, a custom fetch wrapper, and parallel OAuth data hooks.

### Patch Changes

- Updated dependencies [[`7f78c1d`](https://github.com/projik/davepi-ui/commit/7f78c1d920593f6f07d08a45f1af45ac4572c4a3)]:
  - @davepi/ui-core@0.3.0

## 0.2.0

### Minor Changes

- [`45c6d6d`](https://github.com/projik/davepi-ui/commit/45c6d6d1e1fb38cf3168b6af5f555c5ad8ab6dcc) Thanks [@projik](https://github.com/projik)! - UX cleanup pass after running create-davepi-ui against a non-davepi-seed schema set (the CRM template from `create-davepi-app`) surfaced four issues:

  1. **Demo override files leaked into every scaffolded project.** The `packages/ui-app-react/src/resources/*.ts` files were davepi-seed-schema demos (`accountName`, `first_name`, …) but the scaffolded template carried them verbatim. Against a CRM template (where fields are `name`, `firstName`), the listColumns referenced non-existent fields → table cells rendered "—". Demo files deleted; scaffolded `src/resources/` ships empty (with `.gitkeep`). The override layer is still wired and documented — consumers add files when they need overrides, the framework's `/_describe` defaults work out of the box.

  2. **Redundant `hasOne` tab next to an equivalent `hasMany`.** When a parent declares both `hasMany: contact` (e.g. `contacts`) and `hasOne: contact` (e.g. `primaryContact`) against the same foreign key, `<ResourceDetail>` now suppresses the hasOne tab — the hasMany already lists every child including whichever one the hasOne would surface. Cuts the duplicate "Contacts" label that the user reported.

  3. **Tab key collision warning.** `<TabsTrigger>` + `<TabsContent>` keyed only on `${target}:${foreignKey}`, so a parent with multiple relations against the same pair (e.g. `hasMany` + `hasOne`) emitted React duplicate-key warnings even before the hasOne dedupe above. Keys now include `rel.name`, so distinct relations always have distinct keys regardless of dedupe rules.

  4. **Theme bias toward black-on-white was visually heavy.** Default flipped from forced `dark` to **system-preference** (with `light` and `dark` as explicit overrides). Palette softened: slate neutrals + indigo accent in both modes, slate-blue dark instead of near-pure-black, indigo primary buttons instead of monochrome. A `<ThemeToggle>` lives in the app shell header — Sun / Moon icon with a dropdown menu (Light / Dark / System). Choice persisted to `localStorage` under `davepi-theme`; an inline `<script>` in `index.html` applies the saved preference before first paint to avoid a FOUC. System mode also listens for OS-level preference changes so day-night transitions track automatically.

## 0.1.1

### Patch Changes

- [`6713df7`](https://github.com/projik/davepi-ui/commit/6713df7a730ed696111903ce969c3b48661bcda1) Thanks [@projik](https://github.com/projik)! - CI release pipeline smoke test — first publish through GitHub Actions after manual 0.1.0 claim.

- Updated dependencies [[`6713df7`](https://github.com/projik/davepi-ui/commit/6713df7a730ed696111903ce969c3b48661bcda1)]:
  - @davepi/ui-core@0.1.1

## 0.1.0

### Minor Changes

- Initial public release (0.1.0).

  `@davepi/ui-core`, `@davepi/ui-react`, and `@davepi/ui-mcp` ship as a coordinated trio (kept on the same version line via the changesets `linked` config) so a consumer pinning one minor sees a known-compatible peer for the others.

  Surface:

  - `@davepi/ui-core` — `SchemaRegistry`, `resolveWidget`, `zodFromDescribe`, descriptor JSON schemas (`PageSpec` / `TableSpec` / `FormSpec` / …), label generator, component manifest + curated recipes, `defineConfig` + per-resource override merger.
  - `@davepi/ui-react` — `AuthProvider` (JWT + refresh rotation + 401 interceptor), `AuthGuard`, `ConfigProvider`, `useDescribe` / `useResource*` TanStack Query hooks, ACL hooks.
  - `@davepi/ui-mcp` — stdio MCP server with six tools: `list_components`, `describe_component`, `list_recipes`, `validate_page_spec`, `list_resources`, `relation_graph`.

  Requires davepi backend at `1.0.7` or later for the M0.5 `/_describe` hint surface (`label` / `pluralLabel` / `displayField` + `stamped` + auto-populated inverse `hasMany`). Earlier davepi versions still work — the registry has defensive fallbacks for missing hints.

### Patch Changes

- Updated dependencies []:
  - @davepi/ui-core@0.1.0
