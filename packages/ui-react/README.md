# @davepi/ui-react

React bindings for [davepi-ui](https://github.com/projik/davepi-ui) — schema-driven, agent-first admin UI for [davepi](https://github.com/projik/davepi) backends.

## What's inside

- **`<AuthProvider>`** — JWT auth context with refresh-token rotation, 401-retry interceptor, role decoding for ACL gating. Memory access token + localStorage refresh.
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

## Docs

Full reference + component catalogue: https://github.com/projik/davepi-ui

## License

MIT
