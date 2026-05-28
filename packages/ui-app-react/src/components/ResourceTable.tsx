import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { useDescribe, useResourceList } from '@davepi/ui-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { labelize } from '@davepi/ui-core';
import { cn } from '@/lib/utils';

/**
 * Schema-driven resource list table.
 *
 * Pulls `/_describe` for the resource, picks the first ~5 non-stamped
 * fields as default columns, supports sortable headers (`__sort`),
 * full-text search (`__q`) on schemas that declare searchable fields,
 * and `__page` pagination. Row clicks navigate to `/r/:path/:id` so the
 * detail page is one click away.
 *
 * @example
 * <ResourceTable resourcePath="account" />
 */
export interface ResourceTableProps {
  resourcePath: string;
  /** Override the default first-N columns. */
  columns?: string[];
  /** Hidden filters merged into every list call. */
  filters?: Record<string, unknown>;
  /**
   * Embedded mode: hides the page-level header (title, search bar, "New")
   * so the table can sit inside another container (typically `<RelatedList>`).
   * Standalone mode (default) renders the full chrome.
   */
  embedded?: boolean;
  /**
   * When true (default in standalone mode), filter params from the URL
   * (e.g. `?accountId=xxx`) are merged into the list query. Lets a child
   * list page deep-link back from a parent detail.
   */
  readUrlFilters?: boolean;
}

const STAMPED = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'deletedAt', 'userId', 'accountId']);

export function ResourceTable({
  resourcePath,
  columns,
  filters,
  embedded = false,
  readUrlFilters,
}: ResourceTableProps) {
  const { data: describe } = useDescribe();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null);
  const [searchParams] = useSearchParams();

  const shouldReadUrl = readUrlFilters ?? !embedded;
  const urlFilters = useMemo(() => {
    if (!shouldReadUrl) return undefined;
    const out: Record<string, unknown> = {};
    for (const [k, v] of searchParams.entries()) {
      if (k.startsWith('__')) continue;
      out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  }, [searchParams, shouldReadUrl]);

  const mergedFilters = useMemo(
    () => ({ ...(urlFilters ?? {}), ...(filters ?? {}) }),
    [filters, urlFilters]
  );

  const sortParam = sort ? `${sort.field}:${sort.dir}` : undefined;

  const list = useResourceList<Record<string, unknown>>(resourcePath, {
    params: {
      page,
      q: search || undefined,
      sort: sortParam,
      filter: Object.keys(mergedFilters).length ? mergedFilters : undefined,
    },
  });

  const entry = describe?.registry.get(resourcePath);
  const display = describe?.registry.display(resourcePath);

  const effectiveColumns = useMemo(() => {
    if (columns?.length) return columns;
    if (!entry) return [];
    const visible = entry.fields.filter((f) => !STAMPED.has(f.name)).slice(0, 5);
    return visible.map((f) => f.name);
  }, [columns, entry]);

  const searchable = entry?.features.search ?? [];

  function toggleSort(field: string) {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return null;
    });
  }

  if (!describe || !entry || !display) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      {!embedded ? (
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{display.pluralLabel}</h1>
            <p className="text-sm text-muted-foreground">
              <code>{entry.path}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {searchable.length ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder={`Search ${display.pluralLabel.toLowerCase()}…`}
                  className="w-64 pl-8"
                />
              </div>
            ) : null}
            <Button asChild>
              <Link to={prefillCreateUrl(resourcePath, mergedFilters)}>
                <Plus className="mr-1 h-4 w-4" />
                New {display.label}
              </Link>
            </Button>
          </div>
        </header>
      ) : null}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {effectiveColumns.map((col) => {
                const isSorted = sort?.field === col;
                return (
                  <TableHead key={col}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {labelize(col, { stripIdSuffix: col.endsWith('Id') })}
                      {isSorted ? (
                        sort?.dir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                      )}
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isPending ? (
              <TableRow>
                <TableCell colSpan={effectiveColumns.length} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : null}
            {list.error ? (
              <TableRow>
                <TableCell colSpan={effectiveColumns.length} className="text-destructive">
                  {list.error.message}
                </TableCell>
              </TableRow>
            ) : null}
            {list.data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={effectiveColumns.length} className="text-center text-muted-foreground">
                  No records.
                </TableCell>
              </TableRow>
            ) : null}
            {list.data?.results.map((record) => {
              const id = String(record._id ?? '');
              return (
                <TableRow key={id} className="cursor-pointer">
                  {effectiveColumns.map((col, idx) => (
                    <TableCell key={col} className={cn(idx === 0 && 'font-medium')}>
                      <Link to={`/r/${resourcePath}/${id}`} className="block w-full">
                        {formatCell(record[col])}
                      </Link>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <footer className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {list.data
            ? `${list.data.totalResults} total · page ${list.data.page} of ${list.data.totalPages ?? '?'}`
            : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!list.data || (list.data.prevPage ?? 0) < 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!list.data?.nextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

/**
 * Carry active filters into the create URL so a child opened from a
 * filtered list inherits the parent FK pre-stamped.
 */
function prefillCreateUrl(resourcePath: string, filters: Record<string, unknown>): string {
  const entries = Object.entries(filters).filter(([k, v]) => v != null && k !== '__page');
  if (!entries.length) return `/r/${resourcePath}/new`;
  const qs = new URLSearchParams();
  for (const [k, v] of entries) {
    qs.set(`prefill_${k}`, String(v));
  }
  return `/r/${resourcePath}/new?${qs.toString()}`;
}
