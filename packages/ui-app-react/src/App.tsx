import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthGuard, useAuth } from '@davepi/ui-react';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './pages/LoginScreen';
import { DashboardPage } from './pages/DashboardPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { ResourceCreatePage } from './pages/ResourceCreatePage';
import { ResourceEditPage } from './pages/ResourceEditPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';

/**
 * Adopt an OAuth token pair that davepi-plugin-oauth lands on the redirect
 * URL as `?token=…&refreshToken=…`. Handled here at the app root rather than
 * via a dedicated route so `App.tsx` keeps only the canonical resource routes.
 *
 * Tokens are scrubbed from the URL with a `replace` navigation the moment
 * they are read, so they don't linger in the address bar, browser history, or
 * outgoing referrers. The remaining query-string exposure (request logs,
 * referrer on the redirect itself) is a backend concern: the robust fix is an
 * authorization-code + state exchange in davepi-plugin-oauth — tracked as a
 * follow-up.
 */
function useAdoptOAuthTokens() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('token');
    const refreshToken = params.get('refreshToken');
    if (!accessToken || !refreshToken) return;

    setSession({ accessToken, refreshToken });
    navigate('/', { replace: true });
  }, [navigate, setSession]);
}

export function App() {
  const { status } = useAuth();
  useAdoptOAuthTokens();

  if (status === 'unknown') {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/"
        element={
          <AuthGuard fallback={<Navigate to="/login" replace />}>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="r/:path" element={<ResourceListPage />} />
        <Route path="r/:path/new" element={<ResourceCreatePage />} />
        <Route path="r/:path/:id" element={<ResourceDetailPage />} />
        <Route path="r/:path/:id/edit" element={<ResourceEditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
