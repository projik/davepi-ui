import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { WidgetComponentProps } from './types';

/**
 * Comma-delimited / Enter-delimited tag input. Backing value is a string
 * array. Empty state renders just the input; values render as chips with
 * an X to remove.
 */
export function TagInput({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
  placeholder,
}: WidgetComponentProps<string[] | undefined>) {
  const tags = value ?? [];
  const [pending, setPending] = useState('');

  function commit(raw: string) {
    const next = raw.trim();
    if (!next) return;
    if (tags.includes(next)) return;
    onChange([...tags, next]);
    setPending('');
  }

  function remove(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(pending);
    } else if (e.key === 'Backspace' && pending === '' && tags.length) {
      e.preventDefault();
      remove(tags.length - 1);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-background p-1">
      {tags.map((t, i) => (
        <span
          key={`${t}:${i}`}
          className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
        >
          {t}
          {!readOnly && !disabled ? (
            <button
              type="button"
              aria-label={`Remove ${t}`}
              className="rounded-sm hover:bg-muted"
              onClick={() => remove(i)}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </span>
      ))}
      <Input
        id={id}
        name={name}
        value={pending}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={tags.length ? undefined : (placeholder ?? 'Add tag…')}
        className="h-7 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        onChange={(e) => setPending(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => {
          commit(pending);
          onBlur?.();
        }}
      />
    </div>
  );
}
