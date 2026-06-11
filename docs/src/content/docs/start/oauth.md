---
title: OAuth authentication
description: Switch from email/password login to OAuth using davepi-plugin-oauth.
---

By default davepi-ui uses the built-in email/password flow (`POST /login`).
If your davepi backend has [`davepi-plugin-oauth`](https://github.com/projik/davepi-plugin-oauth) installed, you can switch the frontend to accept OAuth tokens instead — no parallel hooks, custom fetch wrappers, or side-channel storage needed.

## Prerequisites

- A davepi backend with `davepi-plugin-oauth` installed and configured (Google, GitHub, etc.).
- The plugin's callback URL set to your frontend (e.g. `http://localhost:5173/auth/callback`).
- `@davepi/ui-react` ≥ 0.2.0 (which exposes `useAuth().setSession`).

## How it works

When a user clicks "Sign in with Google" (or any configured provider), the browser redirects to the OAuth provider. After consent, `davepi-plugin-oauth` issues a **davepi access + refresh token pair** and redirects back to your frontend callback URL with the tokens in the query string:

```
/auth/callback?token=<accessToken>&refreshToken=<refreshToken>
```

Your callback route reads those params and hands them to `setSession()`. From that point on, `AuthProvider` treats the session identically to a password login — the JWT is decoded for roles/identity, `status` flips to `'authenticated'`, the refresh token is persisted under the canonical `davepi.refreshToken` localStorage key, and every data hook + `<AuthGuard>` unblocks.

## Step 1 — Add the callback route

Create a component that reads the tokens from the URL and calls `setSession`:

```tsx
// src/pages/OAuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@davepi/ui-react';

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

## Step 2 — Register the route

In your `App.tsx`, add the callback route **outside** the `<AuthGuard>` so it's accessible to unauthenticated users:

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '@davepi/ui-react';
import { OAuthCallback } from './pages/OAuthCallback';
import { LoginScreen } from './pages/LoginScreen';
import { AppShell } from './components/AppShell';
// ...other page imports

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route
        path="/"
        element={
          <AuthGuard fallback={<Navigate to="/login" replace />}>
            <AppShell />
          </AuthGuard>
        }
      >
        {/* ...resource routes */}
      </Route>
    </Routes>
  );
}
```

## Step 3 — Add a login button

On your login page, add a link/button that redirects to the backend's OAuth initiation endpoint:

```tsx
function LoginScreen() {
  const apiUrl = import.meta.env.VITE_API_URL;

  return (
    <div>
      <h1>Sign in</h1>
      {/* existing email/password form (optional — remove if OAuth-only) */}
      <a href={`${apiUrl}/auth/google`}>Sign in with Google</a>
    </div>
  );
}
```

The path (`/auth/google`, `/auth/github`, etc.) depends on which providers you configured in `davepi-plugin-oauth`.

## Step 4 — Configure the backend callback URL

In your davepi backend's OAuth plugin config, set the callback/redirect URL to point at your frontend route:

```js
// davepi backend — plugin config
{
  plugin: 'davepi-plugin-oauth',
  options: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: 'http://localhost:5173/auth/callback',
    },
  },
}
```

For production, update `callbackUrl` to your deployed frontend URL.

## Session lifecycle

Once `setSession` is called:

| Concern | Behaviour |
|---|---|
| Token storage | Access token in memory; refresh token in `localStorage` under `davepi.refreshToken` |
| Page reload | `AuthProvider` reads the persisted refresh token on mount and calls `POST /auth/refresh` — stays authenticated |
| 401 interceptor | The built-in retry logic refreshes transparently, same as password login |
| Logout | `useAuth().logout()` clears both tokens and hits `POST /auth/logout` |
| Race conditions | A session epoch prevents an in-flight refresh from overwriting tokens adopted by `setSession` |

## Using `DescribeProvider` (optional)

If your OAuth flow fetches the `/_describe` manifest through a separate query (e.g. using the OAuth access token directly rather than the auth-gated client), wrap your app with `<DescribeProvider>` to inject it:

```tsx
import { DescribeProvider } from '@davepi/ui-react';

function AuthenticatedApp({ manifest }) {
  return (
    <DescribeProvider manifest={manifest}>
      {/* RelationPicker, ResourceForm, etc. all read from this manifest */}
      <AppShell />
    </DescribeProvider>
  );
}
```

This prevents "Unknown relation target" errors when nested widgets call `useDescribe()` before the standard auth-gated query has resolved.

## Full example

A minimal app using OAuth only (no email/password form):

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, AuthGuard, ConfigProvider } from '@davepi/ui-react';
import { OAuthCallback } from './pages/OAuthCallback';
import { AppShell } from './components/AppShell';

const queryClient = new QueryClient();
const apiUrl = import.meta.env.VITE_API_URL;

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider config={{ apiBaseUrl: apiUrl }}>
          <AuthProvider baseUrl={apiUrl}>
            <Routes>
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route
                path="/login"
                element={<RedirectToOAuth />}
              />
              <Route
                path="/*"
                element={
                  <AuthGuard fallback={<Navigate to="/login" replace />}>
                    <AppShell />
                  </AuthGuard>
                }
              />
            </Routes>
          </AuthProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

function RedirectToOAuth() {
  window.location.href = `${apiUrl}/auth/google`;
  return <p>Redirecting to sign-in…</p>;
}
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Redirect loop after callback | `OAuthCallback` route is inside `<AuthGuard>` | Move it outside the guard |
| Page reload logs user out | `@davepi/ui-react` < 0.2.0 (stale-closure bug) | Upgrade to ≥ 0.2.0 |
| "Unknown relation target" in `RelationPicker` | Manifest fetched outside standard auth flow | Wrap with `<DescribeProvider manifest={…}>` |
| `setSession` has no effect | Tokens missing from URL (`token` or `refreshToken` param is `null`) | Check backend callback URL and plugin config |
