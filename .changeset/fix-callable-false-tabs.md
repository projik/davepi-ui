---
'@davepi/ui-core': patch
---

Fix `ResourceDetailPage` rendering tabs for `callable:false` relations.

Relations marked `callable: false` are manifest-only inverse edges that cannot be addressed via REST `__include`, MCP relation tools, or GraphQL. The detail page was incorrectly rendering a tab for every `hasMany`/`hasOne` edge without checking the flag, causing spurious tabs (e.g. `expenseClaims2`, `leaveRequests2`, `policies`) to appear on entities that declare non-callable inverses.

- Add `&& r.callable !== false` to the `allChildRelations` filter in `ResourceDetailPage`.
- Add regression test to `registry.test.ts` confirming filtered callable list excludes `callable:false` edges.
