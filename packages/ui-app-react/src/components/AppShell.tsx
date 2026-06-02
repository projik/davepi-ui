import { Outlet } from 'react-router-dom';
import { UserMenu } from '@davepi/ui-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

/**
 * Two-column shell: sidebar nav (resource list from describe) + main outlet.
 * Tablet/mobile responsive collapsing is M1+ scope.
 */
export function AppShell() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-end gap-3 border-b border-border px-6">
          <ThemeToggle />
          <UserMenu className="flex items-center gap-3 text-sm" />
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
