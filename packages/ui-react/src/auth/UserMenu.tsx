import type { ReactElement } from 'react';
import { useAuth } from './AuthProvider.js';

/**
 * Minimal user menu — email + logout button. Replace with a styled
 * variant in your app; this exists so the default shell is functional.
 *
 * @example
 * <header><UserMenu /></header>
 */
export interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps): ReactElement | null {
  const { user, logout, status } = useAuth();
  if (status !== 'authenticated' || !user) return null;
  return (
    <div className={className ?? 'davepi-ui-user-menu'}>
      <span>{user.email}</span>
      <button type="button" onClick={() => void logout()}>
        Sign out
      </button>
    </div>
  );
}
