import type { ReactElement, ReactNode } from 'react';
import { useAuth } from './AuthProvider.js';

/**
 * Renders `children` only when the viewer is authenticated (and, when
 * `roles` is provided, holds at least one of the listed roles).
 * Otherwise renders `fallback`. The fallback default is `null` so it is
 * safe to mount as a tree-wide guard.
 *
 * Server-side ACL is the source of truth; this guard only gates the UI.
 *
 * @example
 * <AuthGuard roles={['admin']} fallback={<LoginPage />}>
 *   <SettingsPage />
 * </AuthGuard>
 */
export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  roles?: readonly string[];
  loadingFallback?: ReactNode;
}

export function AuthGuard({
  children,
  fallback = null,
  roles,
  loadingFallback = null,
}: AuthGuardProps): ReactElement {
  const { status, user } = useAuth();
  if (status === 'unknown') return <>{loadingFallback}</>;
  if (status !== 'authenticated' || !user) return <>{fallback}</>;
  if (roles && roles.length && !roles.some((r) => user.roles?.includes(r))) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
