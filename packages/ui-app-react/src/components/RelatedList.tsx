import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDescribe } from '@davepi/ui-react';
import { Button } from '@/components/ui/button';
import { ResourceTable } from './ResourceTable';
import { RelatedCreateModal } from './RelatedCreateModal';

/**
 * Embedded list of related child records.
 *
 * Renders an inline `<ResourceTable>` for the child resource, pre-filtered
 * by the parent foreign key. A header button opens `<RelatedCreateModal>`
 * with the FK already stamped, so creating a child from inside the
 * parent's detail page is a single click — no manual id entry, no
 * navigation away.
 *
 * Discovery: feed the parent's path + id + the relation edge from
 * `SchemaRegistry.relations(parent)`. Inverse edges synthesised from FK-by-
 * convention work without backend changes.
 *
 * @example
 * <RelatedList
 *   parentPath="account"
 *   parentId={account._id}
 *   target="contact"
 *   foreignKey="accountId"
 * />
 */
export interface RelatedListProps {
  parentPath: string;
  parentId: string;
  target: string;
  foreignKey: string;
  /** Override default columns. */
  columns?: string[];
}

export function RelatedList({ parentPath: _parentPath, parentId, target, foreignKey, columns }: RelatedListProps) {
  const { data: describe } = useDescribe();
  const [creating, setCreating] = useState(false);
  const display = describe?.registry.display(target);

  if (!describe || !display) return null;

  const filter = { [foreignKey]: parentId };

  return (
    <div className="space-y-2">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{display.pluralLabel}</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New {display.label}
        </Button>
      </header>
      <ResourceTable
        resourcePath={target}
        filters={filter}
        columns={columns}
        embedded
      />
      <RelatedCreateModal
        open={creating}
        onOpenChange={setCreating}
        resource={target}
        prefill={filter}
      />
    </div>
  );
}
