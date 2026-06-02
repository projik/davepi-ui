import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import {
  useDeleteResource,
  useDescribe,
  useResource,
} from '@davepi/ui-react';
import { Button } from '@/components/ui/button';
import { labelize } from '@davepi/ui-core';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelatedList } from '@/components/RelatedList';

const SERVER_STAMPED = new Set(['__v', 'userId', 'accountId']);

/**
 * Schema-driven detail page.
 *
 * Renders fields in describe order with type-aware formatting and ships
 * Edit + Delete actions. Every child relation (declared `hasMany`/`hasOne`
 * plus inverse edges synthesised by `SchemaRegistry`) becomes either an
 * embedded `<RelatedList>` (single relation) or a tab (multiple
 * relations) so users can browse and inline-create children without
 * leaving the parent page.
 */
export function ResourceDetailPage() {
  const params = useParams<{ path: string; id: string }>();
  const navigate = useNavigate();
  const path = params.path ?? '';
  const id = params.id ?? '';
  const { data: describe } = useDescribe();
  const record = useResource<Record<string, unknown>>(path, id);
  const remove = useDeleteResource(path);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!describe) return <p>Loading…</p>;
  const entry = describe.registry.get(path);
  if (!entry) return <p className="text-destructive">Unknown resource: {path}</p>;
  const display = describe.registry.display(path);
  if (record.isPending) return <p>Loading…</p>;
  if (record.error) return <p className="text-destructive">{record.error.message}</p>;
  if (!record.data) return <p>Not found.</p>;

  const preview = describe.registry.preview(path, record.data);
  const visibleFields = entry.fields.filter((f) => !SERVER_STAMPED.has(f.name));
  // Suppress redundant `hasOne` tabs: when a parent declares both
  // `hasMany: contact` and `hasOne: contact` against the same FK
  // (e.g. `primaryContact` for "the one flagged as primary"), the
  // hasMany tab already lists every contact including the primary —
  // a separate Primary Contact tab is UX clutter, not information.
  // Skip the hasOne when an equivalent hasMany exists; the user can
  // sort / filter the main list to find the primary.
  const allChildRelations = describe.registry
    .relations(path)
    .filter((r) => r.kind === 'hasMany' || r.kind === 'hasOne');
  const hasManyKeys = new Set(
    allChildRelations
      .filter((r) => r.kind === 'hasMany')
      .map((r) => `${r.target}:${r.foreignKey}`)
  );
  const childRelations = allChildRelations.filter(
    (r) => r.kind !== 'hasOne' || !hasManyKeys.has(`${r.target}:${r.foreignKey}`)
  );

  const detailsBlock = (
    <section className="rounded-md border border-border bg-card">
      <dl className="divide-y divide-border">
        {visibleFields.map((field) => (
          <div key={field.name} className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">
              {labelize(field.name, {
                stripIdSuffix: field.name.endsWith('Id') && field.name !== 'Id',
              })}
            </dt>
            <dd className="col-span-2 text-sm">{formatField(record.data[field.name])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/r/${path}`} className="text-xs text-muted-foreground hover:underline">
            ← {display.pluralLabel}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{preview}</h1>
          <p className="font-mono text-xs text-muted-foreground">{id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/r/${path}/${id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </header>

      {childRelations.length === 0 ? (
        detailsBlock
      ) : (
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {childRelations.map((rel) => {
              const target = describe.registry.display(rel.target);
              // Include `rel.name` in the key — without it, a parent
              // that declares both `contacts: hasMany` and
              // `primaryContact: hasOne` on the same target/FK pair
              // would collide on a `target:foreignKey`-only key.
              // The label uses the relation name (humanised) instead
              // of the bare target plural so the tabs read distinctly.
              const key = `${rel.name}:${rel.target}:${rel.foreignKey}`;
              const tabLabel =
                rel.kind === 'hasOne'
                  ? labelize(rel.name)
                  : target.pluralLabel;
              return (
                <TabsTrigger key={key} value={key}>
                  {tabLabel}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <TabsContent value="details" className="mt-4">
            {detailsBlock}
          </TabsContent>
          {childRelations.map((rel) => {
            const key = `${rel.name}:${rel.target}:${rel.foreignKey}`;
            return (
              <TabsContent key={key} value={key} className="mt-4">
                <RelatedList
                  parentPath={path}
                  parentId={id}
                  target={rel.target}
                  foreignKey={rel.foreignKey}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {display.label}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone via the UI. Soft-deleted records can be restored from
              the API.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await remove.mutateAsync(id);
                setConfirmOpen(false);
                navigate(`/r/${path}`);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatField(value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
