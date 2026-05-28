import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { useAuth, useDescribe, useResource, useResourceList } from '@davepi/ui-react';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RelatedCreateModal } from '@/components/RelatedCreateModal';
import type { WidgetComponentProps } from './types';

/**
 * Schema-driven relation picker (M2 flagship).
 *
 * Renders as a Popover-backed combobox over the target resource list.
 * Typing triggers `__q` search (debounced 250ms) when the target schema
 * declares searchable fields; otherwise client-side filter on the
 * `displayField` value. Selecting a result writes the record id back
 * to the form. An inline "+ Create new <Target>" item opens a
 * `RelatedCreateModal` so a missing referent doesn't break the flow.
 *
 * The currently selected id is resolved via `useResource` so the trigger
 * shows the human-readable label (not the raw id) even on reload.
 *
 * @example
 * <Controller name="accountId" render={({ field }) => (
 *   <RelationPicker
 *     spec={{ kind: 'RelationPicker', field, target: 'account', searchField: 'accountName' }}
 *     value={field.value}
 *     onChange={field.onChange}
 *   />
 * )} />
 */
export function RelationPicker({
  spec,
  value,
  onChange,
  disabled,
  readOnly,
  id,
  placeholder,
}: WidgetComponentProps<string | undefined>) {
  const target = spec.target;
  const { data: describe } = useDescribe();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const [creating, setCreating] = useState(false);

  const selectedRecord = useResource<Record<string, unknown>>(target ?? '', value, {
    enabled: !!value && !!target,
  });

  const list = useResourceList<Record<string, unknown>>(target ?? '', {
    params: { page: 1, q: debouncedSearch || undefined },
    enabled: !!target && open,
  });

  if (!target || !describe) {
    return (
      <div className="text-xs text-muted-foreground">
        Unknown relation target. Did the backend register the schema?
      </div>
    );
  }

  const display = describe.registry.display(target);
  const triggerLabel = value
    ? selectedRecord.data
      ? describe.registry.preview(target, selectedRecord.data)
      : selectedRecord.isPending
        ? 'Loading…'
        : value
    : (placeholder ?? `Select ${display.label.toLowerCase()}…`);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              role="combobox"
              variant="outline"
              aria-expanded={open}
              aria-controls={`${id ?? target}-listbox`}
              disabled={disabled || readOnly}
              className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
              id={id}
            >
              <span className="truncate text-left">{triggerLabel}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false} id={`${id ?? target}-listbox`}>
              <CommandInput
                placeholder={`Search ${display.pluralLabel.toLowerCase()}…`}
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {list.isPending ? <CommandLoading>Searching…</CommandLoading> : null}
                {list.data?.results.length === 0 ? (
                  <CommandEmpty>
                    No {display.pluralLabel.toLowerCase()} match {search ? `"${search}"` : 'your search'}.
                  </CommandEmpty>
                ) : null}
                {list.data?.results.map((record) => {
                  const recordId = String(record._id ?? '');
                  const label = describe.registry.preview(target, record);
                  const selected = recordId === value;
                  return (
                    <CommandItem
                      key={recordId}
                      value={recordId}
                      onSelect={() => {
                        onChange(recordId);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="truncate">{label}</span>
                    </CommandItem>
                  );
                })}
                <CommandSeparator />
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreating(true);
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new {display.label.toLowerCase()}
                </CommandItem>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {value && !disabled && !readOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Clear ${display.label}`}
            onClick={() => onChange(undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <RelatedCreateModal
        open={creating}
        onOpenChange={setCreating}
        resource={target}
        prefill={search ? guessPrefill(spec.searchField, search) : undefined}
        onCreated={(record) => {
          const newId = (record as { _id?: string })._id;
          if (newId) onChange(newId);
        }}
      />
    </div>
  );
}

/**
 * Multi-select variant on top of the same combobox. Backing value is a
 * string array; selections render as chips with X-to-remove.
 */
export function MultiRelationPicker({
  spec,
  value,
  onChange,
  disabled,
  readOnly,
  id,
  placeholder,
}: WidgetComponentProps<string[] | undefined>) {
  const target = spec.target;
  const { data: describe } = useDescribe();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const [creating, setCreating] = useState(false);

  const selected = value ?? [];
  const list = useResourceList<Record<string, unknown>>(target ?? '', {
    params: { page: 1, q: debouncedSearch || undefined },
    enabled: !!target && open,
  });

  if (!target || !describe) {
    return <div className="text-xs text-muted-foreground">Unknown relation target.</div>;
  }
  const display = describe.registry.display(target);

  function toggle(recordId: string) {
    if (selected.includes(recordId)) {
      onChange(selected.filter((x) => x !== recordId));
    } else {
      onChange([...selected, recordId]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((sid) => (
            <SelectedChip
              key={sid}
              target={target}
              id={sid}
              onRemove={readOnly || disabled ? undefined : () => toggle(sid)}
            />
          ))}
        </div>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || readOnly}
            className="w-full justify-between font-normal text-muted-foreground"
            id={id}
          >
            <span>{placeholder ?? `Add ${display.label.toLowerCase()}…`}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${display.pluralLabel.toLowerCase()}…`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {list.isPending ? <CommandLoading>Searching…</CommandLoading> : null}
              {list.data?.results.length === 0 ? (
                <CommandEmpty>No results.</CommandEmpty>
              ) : null}
              {list.data?.results.map((record) => {
                const recordId = String(record._id ?? '');
                const isSelected = selected.includes(recordId);
                return (
                  <CommandItem
                    key={recordId}
                    value={recordId}
                    onSelect={() => toggle(recordId)}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    {describe.registry.preview(target, record)}
                  </CommandItem>
                );
              })}
              <CommandSeparator />
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  setCreating(true);
                }}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new {display.label.toLowerCase()}
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <RelatedCreateModal
        open={creating}
        onOpenChange={setCreating}
        resource={target}
        onCreated={(record) => {
          const newId = (record as { _id?: string })._id;
          if (newId) onChange([...selected, newId]);
        }}
      />
    </div>
  );
}

function SelectedChip({
  target,
  id,
  onRemove,
}: {
  target: string;
  id: string;
  onRemove?: () => void;
}) {
  const { client, status } = useAuth();
  const { data: describe } = useDescribe();
  const record = useQuery({
    queryKey: ['davepi', 'resource', target, 'v1', 'preview', id],
    enabled: status === 'authenticated' && !!id,
    staleTime: 60_000,
    queryFn: () => client.get<Record<string, unknown>>(`/api/v1/${target}`, id),
  });
  const label = record.data && describe ? describe.registry.preview(target, record.data) : id;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="rounded-sm hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

function guessPrefill(searchField: string | undefined, search: string): Record<string, unknown> | undefined {
  if (!searchField) return undefined;
  // Stamp the user-typed search term into the most-likely display field of
  // the new record so the modal feels like a continuation of the search.
  return { [searchField]: search };
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return useMemo(() => debounced, [debounced]);
}
