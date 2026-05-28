import { Input } from '@/components/ui/input';
import type { WidgetComponentProps } from './types';

/**
 * Native HTML date input. A richer date-picker (Radix popover + calendar)
 * lands in M2; today's input is simple, accessible, and accepts ISO
 * strings either from form state or paste.
 */
export function DateInput({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
}: WidgetComponentProps<string | Date | undefined>) {
  const stringValue =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : typeof value === 'string'
        ? value.slice(0, 10)
        : '';
  return (
    <Input
      id={id}
      name={name}
      type="date"
      value={stringValue}
      onChange={(e) => onChange(e.target.value || undefined)}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}
