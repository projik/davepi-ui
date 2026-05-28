import { MoreHorizontal } from 'lucide-react';
import type { descriptor } from '@davepi/ui-core';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Per-row action menu. Renders a "three dots" trigger that opens a
 * Radix dropdown of `ActionSpec` items. Each item dispatches via the
 * `onRun` callback so the parent table can choose how to execute
 * (mutation, navigate, etc.).
 */
export interface RowActionsProps {
  actions: descriptor.ActionSpec[];
  record: Record<string, unknown>;
  onRun: (action: descriptor.ActionSpec, record: Record<string, unknown>) => void;
}

export function RowActions({ actions, record, onRun }: RowActionsProps) {
  if (!actions.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 data-[state=open]:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onSelect={(e) => {
              e.preventDefault();
              onRun(action, record);
            }}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
