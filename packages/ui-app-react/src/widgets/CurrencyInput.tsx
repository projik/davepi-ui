import { Input } from '@/components/ui/input';
import type { WidgetComponentProps } from './types';

/**
 * Currency = NumberInput + leading currency code. The currency value is
 * read from `spec.currency` (parsed from the backend's `format: 'currency:USD'`
 * hint). Falls back to 'USD' when unset.
 */
export function CurrencyInput({
  spec,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
}: WidgetComponentProps<number | string | undefined>) {
  const currency = spec.currency ?? 'USD';
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{currency}</span>
      <Input
        id={id}
        name={name}
        type="number"
        step="0.01"
        value={value == null ? '' : String(value)}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '') {
            onChange(undefined);
            return;
          }
          const parsed = Number(next);
          onChange(Number.isFinite(parsed) ? parsed : next);
        }}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}
