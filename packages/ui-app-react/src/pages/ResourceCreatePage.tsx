import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCreateResource, useDescribe } from '@davepi/ui-react';
import { ResourceForm } from '@/components/ResourceForm';

/**
 * Create page. Accepts `?prefill_{field}={value}` URL params so a parent
 * resource can hand the child a pre-stamped FK (used by M2 RelatedList).
 * For M1 the FK lands as a hidden+readonly field so the create still works.
 */
export function ResourceCreatePage() {
  const params = useParams<{ path: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: describe } = useDescribe();
  const path = params.path ?? '';
  const create = useCreateResource(path);
  const [error, setError] = useState<string | null>(null);

  const display = describe?.registry.display(path);
  const initial: Record<string, unknown> = {};
  const hidden: string[] = [];
  for (const [k, v] of searchParams.entries()) {
    if (!k.startsWith('prefill_')) continue;
    const field = k.slice('prefill_'.length);
    initial[field] = v;
    hidden.push(field);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <Link to={`/r/${path}`} className="text-xs text-muted-foreground hover:underline">
          ← {display?.pluralLabel ?? path}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New {display?.label ?? path}</h1>
      </header>
      <ResourceForm
        resourcePath={path}
        initial={initial}
        hiddenFields={hidden}
        submitLabel={`Create ${display?.label ?? path}`}
        serverError={error}
        onCancel={() => navigate(`/r/${path}`)}
        onSubmit={async (values) => {
          setError(null);
          try {
            const created = await create.mutateAsync(values);
            const id = (created as { _id?: string })._id;
            navigate(id ? `/r/${path}/${id}` : `/r/${path}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Create failed');
          }
        }}
      />
    </div>
  );
}
