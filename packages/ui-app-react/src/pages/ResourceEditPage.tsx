import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDescribe,
  useResource,
  useUpdateResource,
} from '@davepi/ui-react';
import { ResourceForm } from '@/components/ResourceForm';

export function ResourceEditPage() {
  const params = useParams<{ path: string; id: string }>();
  const navigate = useNavigate();
  const path = params.path ?? '';
  const id = params.id ?? '';
  const { data: describe } = useDescribe();
  const record = useResource<Record<string, unknown>>(path, id);
  const update = useUpdateResource(path);
  const [error, setError] = useState<string | null>(null);

  const display = describe?.registry.display(path);

  if (record.isPending) return <p>Loading…</p>;
  if (record.error) return <p className="text-destructive">{record.error.message}</p>;
  if (!record.data) return <p className="text-muted-foreground">Not found.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <Link to={`/r/${path}/${id}`} className="text-xs text-muted-foreground hover:underline">
          ← {describe?.registry.preview(path, record.data) ?? id}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit {display?.label ?? path}</h1>
      </header>
      <ResourceForm
        resourcePath={path}
        initial={record.data}
        submitLabel="Save changes"
        serverError={error}
        onCancel={() => navigate(`/r/${path}/${id}`)}
        onSubmit={async (values) => {
          setError(null);
          try {
            await update.mutateAsync({ id, body: values });
            navigate(`/r/${path}/${id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
          }
        }}
      />
    </div>
  );
}
