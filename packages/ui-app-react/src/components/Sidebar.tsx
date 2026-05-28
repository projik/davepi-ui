import { Link, useLocation } from 'react-router-dom';
import { useDescribe } from '@davepi/ui-react';
import { cn } from '@/lib/utils';

/**
 * Sidebar nav derived from the live `/_describe` manifest.
 *
 * Every resource the backend exposes shows up as a link; titles use the
 * `SchemaRegistry.display()` rules (explicit label hint → title-cased
 * path). The active path is highlighted via pathname match. ACL gating
 * lands in M3 — for now any authenticated user sees every resource.
 */
export function Sidebar() {
  const { data, isPending, error } = useDescribe();
  const { pathname } = useLocation();

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4 font-semibold">
        davepi-ui
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-auto p-3">
        <Link
          to="/"
          className={cn(
            'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
            pathname === '/' && 'bg-accent text-accent-foreground'
          )}
        >
          Dashboard
        </Link>
        {isPending ? <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div> : null}
        {error ? (
          <div className="px-3 py-2 text-xs text-destructive">
            Failed to load schema: {error.message}
          </div>
        ) : null}
        {data
          ? data.registry.paths().map((p) => {
              const { pluralLabel } = data.registry.display(p);
              const href = `/r/${p}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={p}
                  to={href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                    active && 'bg-accent text-accent-foreground'
                  )}
                >
                  {pluralLabel}
                </Link>
              );
            })
          : null}
      </nav>
    </aside>
  );
}
