---
'@davepi/ui-react': minor
---

Add `DescribeProvider` so apps can inject an already-fetched `/_describe` manifest. `useDescribe()` / `useAnonymousDescribe()` now resolve the injected manifest first, falling back to the standard auth-gated query — fixing "Unknown relation target" in `RelationPicker` / `MultiRelationPicker` when the manifest is sourced outside the standard auth flow (e.g. a custom OAuth data layer). Also exports `useOptionalAuth()`.
