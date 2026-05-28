import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  useDavepiConfig,
  useDescribe,
  useResourcePerm,
} from '@davepi/ui-react';
import { cn } from '@/lib/utils';

/**
 * Sidebar nav derived from the live `/_describe` manifest, with
 * consumer-supplied config applied on top:
 *
 *   - Resources grouped by `config.resources[path].category`. Order
 *     respects `config.categoryOrder` first, then alphabetical.
 *   - Labels prefer the consumer config's `label`/`pluralLabel`, falling
 *     back to backend hints, falling back to title-cased path.
 *   - Resources excluded by `permissions.list` (consumer config) OR
 *     `acl.list` (describe) are hidden — server still enforces.
 */
export function Sidebar() {
  const { data, isPending, error } = useDescribe();
  const { config } = useDavepiConfig();
  const { pathname } = useLocation();

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4 font-semibold">
        {config.branding?.name ?? 'davepi-ui'}
      </div>
      <nav className="flex flex-1 flex-col gap-2 overflow-auto p-3">
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
        {data ? <SidebarSections currentPath={pathname} /> : null}
      </nav>
    </aside>
  );
}

interface SectionEntry {
  path: string;
  pluralLabel: string;
}

interface Section {
  category: string;
  items: SectionEntry[];
}

function SidebarSections({ currentPath }: { currentPath: string }) {
  const { data } = useDescribe();
  const { config, resolveResource } = useDavepiConfig();

  const sections = useMemo<Section[]>(() => {
    if (!data) return [];
    const byCategory = new Map<string, SectionEntry[]>();
    for (const path of data.registry.paths()) {
      const display = data.registry.display(path);
      const cfg = resolveResource(path);
      const category = cfg.category ?? '';
      const label = cfg.pluralLabel ?? cfg.label ?? display.pluralLabel;
      const list = byCategory.get(category) ?? [];
      list.push({ path, pluralLabel: label });
      byCategory.set(category, list);
    }
    const orderedCategories = orderCategories(
      Array.from(byCategory.keys()),
      config.categoryOrder
    );
    return orderedCategories.map((category) => ({
      category,
      items: (byCategory.get(category) ?? []).sort((a, b) =>
        a.pluralLabel.localeCompare(b.pluralLabel)
      ),
    }));
  }, [config.categoryOrder, data, resolveResource]);

  if (!sections.length) return null;

  return (
    <>
      {sections.map((section) => (
        <SidebarSection
          key={section.category || '__default__'}
          section={section}
          currentPath={currentPath}
        />
      ))}
    </>
  );
}

function SidebarSection({
  section,
  currentPath,
}: {
  section: Section;
  currentPath: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {section.category ? (
        <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {section.category}
        </div>
      ) : null}
      {section.items.map((entry) => (
        <SidebarLink
          key={entry.path}
          path={entry.path}
          pluralLabel={entry.pluralLabel}
          currentPath={currentPath}
        />
      ))}
    </div>
  );
}

function SidebarLink({
  path,
  pluralLabel,
  currentPath,
}: {
  path: string;
  pluralLabel: string;
  currentPath: string;
}) {
  const perm = useResourcePerm(path, 'list');
  if (!perm.allowed) return null;
  const href = `/r/${path}`;
  const active = currentPath === href || currentPath.startsWith(`${href}/`);
  return (
    <Link
      to={href}
      className={cn(
        'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {pluralLabel}
    </Link>
  );
}

function orderCategories(found: string[], order: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  if (order) {
    for (const cat of order) {
      if (found.includes(cat) && !seen.has(cat)) {
        out.push(cat);
        seen.add(cat);
      }
    }
  }
  const remaining = found.filter((c) => !seen.has(c)).sort((a, b) => a.localeCompare(b));
  return [...out, ...remaining];
}
