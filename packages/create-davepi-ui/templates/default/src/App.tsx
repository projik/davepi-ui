import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard, useAuth } from '@davepi/ui-react';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './pages/LoginScreen';
import { OAuthCallback } from './pages/OAuthCallback';
import { DashboardPage } from './pages/DashboardPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { ResourceCreatePage } from './pages/ResourceCreatePage';
import { ResourceEditPage } from './pages/ResourceEditPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';

export function App() {
  const { status } = useAuth();

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
      <Route path="/auth/callback" element={<OAuthCallback />} />
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
