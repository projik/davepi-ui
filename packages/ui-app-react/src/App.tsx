import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard, useAuth } from '@davepi/ui-react';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './pages/LoginScreen';
import { DashboardPage } from './pages/DashboardPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { ResourceDetailStubPage } from './pages/ResourceDetailStubPage';

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
        <Route path="r/:path/:id" element={<ResourceDetailStubPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
