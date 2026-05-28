import { Link, useParams } from 'react-router-dom';
import { useDescribe, useResourceList } from '@davepi/ui-react';

/**
 * Stub list page — enumerates the first page of records for the current
 * resource and prints their displayField preview. The full sortable /
 * filterable `<ResourceTable>` lands in M1; this exists so M0 smoke
 * tests can prove the full request path (auth → describe → /api/v1/*).
 */
export function ResourceListPage() {
  const params = useParams<{ path: string }>();
  const { data: describe } = useDescribe();
  const path = params.path ?? '';
  const list = useResourceList<Record<string, unknown>>(path, { params: { page: 1 } });

  if (!describe) return <p>Loading schema…</p>;
  const entry = describe.registry.get(path);
  if (!entry) return <p className="text-destructive">Unknown resource: {path}</p>;
  const display = describe.registry.display(path);

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{display.pluralLabel}</h1>
          <p className="text-sm text-muted-foreground">
            <code>{entry.path}</code>
          </p>
        </div>
      </header>
      {list.isPending ? <p>Loading…</p> : null}
      {list.error ? <p className="text-destructive">{list.error.message}</p> : null}
      {list.data ? (
        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-4 py-2 text-left font-medium">{describe.registry
                  ? describe.registry.display(path).displayField
                  : 'preview'}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.results.map((record) => {
                const id = String(record._id ?? '');
                return (
                  <tr key={id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link to={`/r/${path}/${id}`} className="hover:underline">
                        {id}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{describe.registry.preview(path, record)}</td>
                  </tr>
                );
              })}
              {list.data.results.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={2}>
                    No records.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            {list.data.totalResults} total · page {list.data.page} of {list.data.totalPages ?? '?'}
          </div>
        </div>
      ) : null}
    </div>
  );
}
