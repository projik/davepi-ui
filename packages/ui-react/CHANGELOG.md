# @davepi/ui-react

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
