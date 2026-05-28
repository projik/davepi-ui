import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus, Search } from 'lucide-react';
import {
  useDeleteResource,
  useDescribe,
  useResourceList,
  useResourceConfig,
  useResourcePerm,
} from '@davepi/ui-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { labelize, type descriptor } from '@davepi/ui-core';
import { cn } from '@/lib/utils';
import { RowActions } from './RowActions';
import { BulkActionBar } from './BulkActionBar';

/**
 * Schema-driven resource list table.
 *
 * Three layers compose to produce the table:
 *   1. `/_describe` — types, sortable hints, search affordance.
 *   2. Consumer config (`davepi-ui.config.ts` + per-resource override file)
 *      — `listColumns`, `actions.row`, `actions.bulk`, `permissions`.
 *   3. Inline JSX props — last-mile overrides on `columns`/`filters`.
 *
 * Selection is opt-in: appears when at least one bulk action is configured.
 * Row actions menu (`...`) appears when at least one row action is configured.
 * Both menus and the "New" button respect `permissions.create/delete` and
 * the live JWT roles.
 *
 * @example
 * <ResourceTable resourcePath="account" />
 */
export interface ResourceTableProps {
  resourcePath: string;
  /** Override the default first-N columns. Wins over consumer config. */
  columns?: string[] | descriptor.ColumnSpec[];
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

interface NormalizedColumn {
  field: string;
  label: string;
  format?: string;
}

export function ResourceTable({
  resourcePath,
  columns,
  filters,
  embedded = false,
  readUrlFilters,
}: ResourceTableProps) {
  const { data: describe } = useDescribe();
  const config = useResourceConfig(resourcePath);
  const createPerm = useResourcePerm(resourcePath, 'create');
  const deletePerm = useResourcePerm(resourcePath, 'delete');
  const remove = useDeleteResource(resourcePath);
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
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

  const effectiveColumns = useMemo<NormalizedColumn[]>(() => {
    const fromProp = normalizeColumns(columns);
    if (fromProp) return fromProp;
    const fromConfig = normalizeColumns(config.listColumns);
    if (fromConfig) return fromConfig;
    if (!entry) return [];
    return entry.fields
      .filter((f) => !STAMPED.has(f.name))
      .slice(0, 5)
      .map((f) => ({
        field: f.name,
        label: labelize(f.name, { stripIdSuffix: f.name.endsWith('Id') }),
      }));
  }, [columns, config.listColumns, entry]);

  const rowActions = config.actions?.row ?? DEFAULT_ROW_ACTIONS(deletePerm.allowed);
  const bulkActions = config.actions?.bulk ?? [];
  const selectionEnabled = bulkActions.length > 0;
  const searchable = entry?.features.search ?? [];

  function toggleSort(field: string) {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return null;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(rows: readonly Record<string, unknown>[]) {
    const allIds = rows.map((r) => String(r._id ?? ''));
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of allIds) next.delete(id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of allIds) next.add(id);
        return next;
      });
    }
  }

  async function runRowAction(
    action: descriptor.ActionSpec,
    record: Record<string, unknown>
  ): Promise<void> {
    if (action.kind === 'navigate' && action.to) {
      const id = String(record._id ?? '');
      navigate(action.to.replace('{id}', id).replace('{path}', resourcePath));
      return;
    }
    if (action.id === '__delete__') {
      const id = String(record._id ?? '');
      if (!confirm('Delete this record?')) return;
      await remove.mutateAsync(id);
      return;
    }
    if (action.id === '__edit__') {
      navigate(`/r/${resourcePath}/${record._id}/edit`);
      return;
    }
  }

  function runBulkAction(action: descriptor.ActionSpec, ids: readonly string[]): void {
    if (action.kind === 'bulkDelete') {
      if (!confirm(`Delete ${ids.length} record(s)?`)) return;
      void Promise.all(ids.map((id) => remove.mutateAsync(id))).then(clearSelection);
      return;
    }
    // Custom actions handled by the consumer through the run callback they
    // pass into their ActionSpec — for M3 we surface the noop and let
    // future work plumb a richer dispatch.
    console.warn('[davepi-ui] bulk action not wired:', action.id);
  }

  if (!describe || !entry || !display) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const visibleRows = list.data?.results ?? [];
  const allSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selected.has(String(r._id ?? '')));

  return (
    <div className="space-y-4">
      {!embedded ? (
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {config.pluralLabel ?? display.pluralLabel}
            </h1>
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
                  placeholder={`Search ${(config.pluralLabel ?? display.pluralLabel).toLowerCase()}…`}
                  className="w-64 pl-8"
                />
              </div>
            ) : null}
            {createPerm.allowed ? (
              <Button asChild>
                <Link to={prefillCreateUrl(resourcePath, mergedFilters)}>
                  <Plus className="mr-1 h-4 w-4" />
                  New {config.label ?? display.label}
                </Link>
              </Button>
            ) : null}
          </div>
        </header>
      ) : null}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {selectionEnabled ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleAll(visibleRows)}
                    aria-label="Select all visible rows"
                  />
                </TableHead>
              ) : null}
              {effectiveColumns.map((col) => {
                const isSorted = sort?.field === col.field;
                return (
                  <TableHead key={col.field}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col.field)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.label}
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
              {rowActions.length ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isPending ? (
              <TableRow>
                <TableCell
                  colSpan={effectiveColumns.length + (selectionEnabled ? 1 : 0) + (rowActions.length ? 1 : 0)}
                  className="text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : null}
            {list.error ? (
              <TableRow>
                <TableCell
                  colSpan={effectiveColumns.length + (selectionEnabled ? 1 : 0) + (rowActions.length ? 1 : 0)}
                  className="text-destructive"
                >
                  {list.error.message}
                </TableCell>
              </TableRow>
            ) : null}
            {!list.isPending && visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={effectiveColumns.length + (selectionEnabled ? 1 : 0) + (rowActions.length ? 1 : 0)}
                  className="text-center text-muted-foreground"
                >
                  No records.
                </TableCell>
              </TableRow>
            ) : null}
            {visibleRows.map((record) => {
              const id = String(record._id ?? '');
              const isSelected = selected.has(id);
              return (
                <TableRow key={id} className="cursor-pointer" data-state={isSelected ? 'selected' : undefined}>
                  {selectionEnabled ? (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </TableCell>
                  ) : null}
                  {effectiveColumns.map((col, idx) => (
                    <TableCell key={col.field} className={cn(idx === 0 && 'font-medium')}>
                      <Link to={`/r/${resourcePath}/${id}`} className="block w-full">
                        {formatCell(getField(record, col.field), col.format)}
                      </Link>
                    </TableCell>
                  ))}
                  {rowActions.length ? (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        actions={rowActions}
                        record={record}
                        onRun={(a, r) => void runRowAction(a, r)}
                      />
                    </TableCell>
                  ) : null}
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
      {selectionEnabled ? (
        <BulkActionBar
          selectedIds={Array.from(selected)}
          actions={bulkActions}
          resourceLabel={config.pluralLabel ?? display.pluralLabel}
          onClear={clearSelection}
          onRun={runBulkAction}
        />
      ) : null}
    </div>
  );
}

function normalizeColumns(
  raw: ResourceTableProps['columns'] | descriptor.ColumnSpec[] | undefined
): NormalizedColumn[] | null {
  if (!raw || !raw.length) return null;
  return raw.map((col) => {
    if (typeof col === 'string') {
      return {
        field: col,
        label: labelize(col, { stripIdSuffix: col.endsWith('Id') }),
      };
    }
    return {
      field: col.field,
      label:
        col.label ?? labelize(col.field, { stripIdSuffix: col.field.endsWith('Id') }),
      format: col.format,
    };
  });
}

function getField(record: Record<string, unknown>, fieldPath: string): unknown {
  if (!fieldPath.includes('.')) return record[fieldPath];
  return fieldPath.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[segment];
    return undefined;
  }, record);
}

function formatCell(value: unknown, format?: string): string {
  if (value == null) return '—';
  if (format?.startsWith('currency:')) {
    const code = format.slice('currency:'.length);
    const num = Number(value);
    if (Number.isFinite(num)) {
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(num);
      } catch {
        return `${code} ${num}`;
      }
    }
  }
  if (format === 'date') {
    const date = value instanceof Date ? value : new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
  }
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function DEFAULT_ROW_ACTIONS(canDelete: boolean): descriptor.ActionSpec[] {
  const out: descriptor.ActionSpec[] = [
    { id: '__edit__', label: 'Edit', kind: 'custom' },
  ];
  if (canDelete) out.push({ id: '__delete__', label: 'Delete', kind: 'custom' });
  return out;
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
