# @davepi/ui-react

React bindings for [davepi-ui](https://github.com/projik/davepi-ui) — schema-driven, agent-first admin UI for [davepi](https://github.com/projik/davepi) backends.

## What's inside

- **`<AuthProvider>`** — JWT auth context with refresh-token rotation, 401-retry interceptor, role decoding for ACL gating. Memory access token + localStorage refresh. Token-source agnostic: `useAuth().setSession({ accessToken, refreshToken })` adopts tokens from any flow (e.g. an OAuth redirect), so the standard hooks and guard just work.
- **`<AuthGuard>`** — conditional render by authentication status + roles.
- **`<ConfigProvider>`** — app-wide + per-resource config context. Deep-merge with array replacement.
- **TanStack Query hooks** — `useDescribe` (cached `/_describe` + `SchemaRegistry`), `useResourceList`, `useResource`, `useCreateResource`, `useUpdateResource`, `useDeleteResource`. Surgical invalidation on mutations.
- **ACL hooks** — `useResourcePerm(path, op)`, `useFieldAcl(path, field, op)` — read describe ACL + JWT roles → hide / disable UI surface. Server still enforces.

## Install

```bash
npm install @davepi/ui-react @davepi/ui-core @tanstack/react-query
```

Peer deps: `react@^18 || ^19`, `react-dom@^18 || ^19`.

## Example

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ConfigProvider, useDescribe } from '@davepi/ui-react';

const client = new QueryClient();

function Sidebar() {
  const { data } = useDescribe();
  if (!data) return null;
  return (
    <nav>
      {data.registry.paths().map((p) => (
        <a key={p} href={`/r/${p}`}>{data.registry.display(p).pluralLabel}</a>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <ConfigProvider config={{ apiBaseUrl: '/api' }}>
        <AuthProvider baseUrl="/api">
          <Sidebar />
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
```

## OAuth / external tokens

`AuthProvider` is not tied to the email/password flow. Any flow that yields a
davepi access + refresh token pair — e.g. `davepi-plugin-oauth`, which lands the
pair on your callback URL as `?token=…&refreshToken=…` — hands them to the
provider with `setSession`. The tokens then travel the exact same path as a
password login: `status` flips to `'authenticated'`, the refresh token is
persisted under the canonical key (so reloads and the 401 interceptor refresh
normally), and every data hook + `<AuthGuard>` unblocks. No second storage key,
no parallel refresh loop, no OAuth-specific hooks.

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@davepi/ui-react';

// Route this at your OAuth callback path, e.g. /auth/success
export function OAuthCallback() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('token');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      setSession({ accessToken, refreshToken });
    }
    navigate('/', { replace: true });
  }, [navigate, setSession]);

  return null;
}
```

After `setSession`, use the standard `useDescribe`, `useResourceList`, etc. —
they read the token through the configured `DavepiClient`, so there's nothing
OAuth-specific to wire up.

## Docs

Full reference + component catalogue: https://github.com/projik/davepi-ui

## License

MIT
