import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { WidgetComponentProps } from './types';

/**
 * JSON editor backed by a textarea. Parses on blur — invalid JSON shows
 * inline and keeps the prior value. A real Monaco-based editor lands
 * later as an optional add-on.
 */
export function JsonEditor({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
}: WidgetComponentProps<unknown>) {
  const [text, setText] = useState(() => stringify(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(stringify(value));
  }, [value]);

  return (
    <div>
      <Textarea
        id={id}
        name={name}
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        className="font-mono text-xs"
        onBlur={() => {
          if (!text.trim()) {
            onChange(undefined);
            setError(null);
          } else {
            try {
              onChange(JSON.parse(text));
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Invalid JSON');
            }
          }
          onBlur?.();
        }}
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function stringify(value: unknown): string {
  if (value == null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}
