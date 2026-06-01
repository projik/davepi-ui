# @davepi/ui-mcp

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
