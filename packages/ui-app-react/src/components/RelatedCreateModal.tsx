import { useState } from 'react';
import { useCreateResource, useDescribe } from '@davepi/ui-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResourceForm } from './ResourceForm';

/**
 * Inline create dialog for a related resource.
 *
 * Wraps `<ResourceForm>` in a shadcn Dialog. Fields named in `prefill`
 * render hidden + readonly but submit normally — used by `<RelatedList>`
 * to stamp the parent foreign key and by `<RelationPicker>`'s
 * "+ Create new" button.
 *
 * On success, fires `onCreated(record)` with the newly created object.
 * Callers commonly use the returned `_id` to auto-select the new record
 * in the picker that opened the modal.
 *
 * @example
 * <RelatedCreateModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   resource="contact"
 *   prefill={{ accountId }}
 *   onCreated={(record) => picker.select(record._id)}
 * />
 */
export interface RelatedCreateModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  resource: string;
  prefill?: Record<string, unknown>;
  onCreated?: (record: Record<string, unknown>) => void;
}

export function RelatedCreateModal({
  open,
  onOpenChange,
  resource,
  prefill,
  onCreated,
}: RelatedCreateModalProps) {
  const { data: describe } = useDescribe();
  const create = useCreateResource(resource);
  const [error, setError] = useState<string | null>(null);

  const display = describe?.registry.display(resource);
  const hidden = prefill ? Object.keys(prefill) : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New {display?.label ?? resource}</DialogTitle>
          <DialogDescription>
            Create a {display?.label?.toLowerCase() ?? resource} without leaving this page.
          </DialogDescription>
        </DialogHeader>
        <ResourceForm
          resourcePath={resource}
          initial={prefill}
          hiddenFields={hidden}
          submitLabel={`Create ${display?.label ?? resource}`}
          serverError={error}
          onCancel={() => onOpenChange(false)}
          onSubmit={async (values) => {
            setError(null);
            try {
              const created = await create.mutateAsync(values);
              onOpenChange(false);
              onCreated?.(created as Record<string, unknown>);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Create failed');
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
