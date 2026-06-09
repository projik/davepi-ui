---
'@davepi/ui-react': minor
---

Make `AuthProvider` token-source agnostic so OAuth flows (e.g. `davepi-plugin-oauth`) work without workarounds.

- Add `useAuth().setSession({ accessToken, refreshToken })` to adopt tokens obtained outside the password flow — such as the `?token=…&refreshToken=…` an OAuth provider lands on the callback URL. The pair travels the same path as a password login: the JWT is decoded for roles/identity, `status` flips to `'authenticated'`, the refresh token is persisted under the canonical `davepi.refreshToken` key, and every data hook + `<AuthGuard>` unblocks.
- Fix the mount refresh path clobbering a successful reload back to `'unauthenticated'`. The post-refresh fallback read a stale `status` closure (always `'unknown'`), so a valid refresh-on-reload logged the user out and redirected to login. It now downgrades to `'unauthenticated'` only when the refresh genuinely left the status unresolved.
- Guard against an in-flight `performRefresh` overwriting a newer session. A refresh started at mount (or by a 401) that settles *after* `login`/`register`/`setSession`/`logout` no longer commits its result — previously a stale refresh failing could `applyTokens(null)` and log the user out right after an OAuth callback. Authoritative session changes now bump a session epoch that refresh results are checked against.

Together these remove the need for side-channel token keys, an OAuth-aware auth guard, a custom fetch wrapper, and parallel OAuth data hooks.
