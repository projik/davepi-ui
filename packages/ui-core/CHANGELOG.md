# @davepi/ui-core

## 0.5.0

### Minor Changes

- [#22](https://github.com/projik/davepi-ui/pull/22) [`40d419a`](https://github.com/projik/davepi-ui/commit/40d419ae82861e4c0bc966bbab9cb8bf9b6feec7) Thanks [@projik](https://github.com/projik)! - Add navigation and dashboard customization knobs to consumer config:

  - `ResourceConfig.hidden` — drop a resource from the sidebar and dashboard cards without affecting its routes (cosmetic decluttering, not access control — use `permissions`/backend ACL for that).
  - `ResourceConfig.icon` is now consumed by the app shell: accepts a [lucide](https://lucide.dev) icon name (`'users'`, `'shopping-cart'`, `'ShoppingCart'`) or any literal string (e.g. an emoji), rendered beside the label in the sidebar and on dashboard cards.
  - `DavepiUiConfig.dashboard` (`title`, `subtitle`, `showResourceCards`, `resourceCards`) — customize the home page heading and which resource cards render, or blank it out to drop in your own widgets.
  - `DescribeField.computed` — typed flag for server-derived fields. Like `stamped`, the UI hides these from create/edit forms and treats them as read-only.

## 0.4.1

### Patch Changes

- [#20](https://github.com/projik/davepi-ui/pull/20) [`e188998`](https://github.com/projik/davepi-ui/commit/e18899840499b5b1873d552f3adf2552904b0e1c) Thanks [@projik](https://github.com/projik)! - Fix `zodFromDescribe` rejecting empty optional Date fields. Optional `Date` fields now treat `''` and `null` as "no date set" (coerced to `undefined`) instead of failing with an "invalid date" error.

## 0.3.0

### Patch Changes

- [`7f78c1d`](https://github.com/projik/davepi-ui/commit/7f78c1d920593f6f07d08a45f1af45ac4572c4a3) Thanks [@projik](https://github.com/projik)! - Fix `ResourceDetailPage` rendering tabs for `callable:false` relations.

  Relations marked `callable: false` are manifest-only inverse edges that cannot be addressed via REST `__include`, MCP relation tools, or GraphQL. The detail page was incorrectly rendering a tab for every `hasMany`/`hasOne` edge without checking the flag, causing spurious tabs (e.g. `expenseClaims2`, `leaveRequests2`, `policies`) to appear on entities that declare non-callable inverses.

  - Add `&& r.callable !== false` to the `allChildRelations` filter in `ResourceDetailPage`.
  - Add regression test to `registry.test.ts` confirming filtered callable list excludes `callable:false` edges.

## 0.1.1

### Patch Changes

- [`6713df7`](https://github.com/projik/davepi-ui/commit/6713df7a730ed696111903ce969c3b48661bcda1) Thanks [@projik](https://github.com/projik)! - CI release pipeline smoke test — first publish through GitHub Actions after manual 0.1.0 claim.

## 0.1.0

### Minor Changes

- Initial public release (0.1.0).

  `@davepi/ui-core`, `@davepi/ui-react`, and `@davepi/ui-mcp` ship as a coordinated trio (kept on the same version line via the changesets `linked` config) so a consumer pinning one minor sees a known-compatible peer for the others.

  Surface:

  - `@davepi/ui-core` — `SchemaRegistry`, `resolveWidget`, `zodFromDescribe`, descriptor JSON schemas (`PageSpec` / `TableSpec` / `FormSpec` / …), label generator, component manifest + curated recipes, `defineConfig` + per-resource override merger.
  - `@davepi/ui-react` — `AuthProvider` (JWT + refresh rotation + 401 interceptor), `AuthGuard`, `ConfigProvider`, `useDescribe` / `useResource*` TanStack Query hooks, ACL hooks.
  - `@davepi/ui-mcp` — stdio MCP server with six tools: `list_components`, `describe_component`, `list_recipes`, `validate_page_spec`, `list_resources`, `relation_graph`.

  Requires davepi backend at `1.0.7` or later for the M0.5 `/_describe` hint surface (`label` / `pluralLabel` / `displayField` + `stamped` + auto-populated inverse `hasMany`). Earlier davepi versions still work — the registry has defensive fallbacks for missing hints.
