import { Link, useParams } from 'react-router-dom';
import { useDescribe, useResource } from '@davepi/ui-react';

/**
 * Stub detail view — fetches the record by id and dumps every field.
 * Real `<ResourceDetail>` with relations and edit affordances lands in M1+.
 */
export function ResourceDetailStubPage() {
  const params = useParams<{ path: string; id: string }>();
  const { data: describe } = useDescribe();
  const path = params.path ?? '';
  const id = params.id ?? '';
  const record = useResource<Record<string, unknown>>(path, id);

  if (!describe) return <p>Loading schema…</p>;
  const entry = describe.registry.get(path);
  if (!entry) return <p className="text-destructive">Unknown resource: {path}</p>;
  const display = describe.registry.display(path);
  const preview = record.data ? describe.registry.preview(path, record.data) : id;

  return (
    <div className="space-y-4">
      <header>
        <Link to={`/r/${path}`} className="text-xs text-muted-foreground hover:underline">
          ← {display.pluralLabel}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{preview}</h1>
        <p className="font-mono text-xs text-muted-foreground">{id}</p>
      </header>
      {record.isPending ? <p>Loading…</p> : null}
      {record.error ? <p className="text-destructive">{record.error.message}</p> : null}
      {record.data ? (
        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <tbody>
              {entry.fields.map((field) => (
                <tr key={field.name} className="border-b border-border last:border-0">
                  <th className="w-48 px-4 py-2 text-left font-medium">{field.name}</th>
                  <td className="px-4 py-2 font-mono text-xs">
                    {formatValue(record.data[field.name])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
