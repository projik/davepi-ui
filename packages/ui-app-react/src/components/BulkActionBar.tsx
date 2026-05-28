import type { descriptor } from '@davepi/ui-core';
import { Button } from '@/components/ui/button';

/**
 * Sticky bar shown when one or more table rows are selected. Renders the
 * configured `bulk` actions plus a count and a "clear selection" button.
 */
export interface BulkActionBarProps {
  selectedIds: readonly string[];
  actions: descriptor.ActionSpec[];
  onClear: () => void;
  onRun: (action: descriptor.ActionSpec, ids: readonly string[]) => void;
  resourceLabel: string;
}

export function BulkActionBar({
  selectedIds,
  actions,
  onClear,
  onRun,
  resourceLabel,
}: BulkActionBarProps) {
  if (!selectedIds.length) return null;
  return (
    <div className="sticky bottom-4 z-10 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
      <span className="text-sm text-muted-foreground">
        {selectedIds.length} {resourceLabel.toLowerCase()} selected
      </span>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant={action.kind === 'bulkDelete' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => onRun(action, selectedIds)}
          >
            {action.label}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
