import { Input } from '@/components/ui/input';
import type { WidgetComponentProps } from './types';

export function NumberInput({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
  placeholder,
}: WidgetComponentProps<number | string | undefined>) {
  return (
    <Input
      id={id}
      name={name}
      type="number"
      value={value == null ? '' : String(value)}
      onChange={(e) => {
        const next = e.target.value;
        if (next === '') {
          onChange(undefined);
        } else {
          const parsed = Number(next);
          onChange(Number.isFinite(parsed) ? parsed : next);
        }
      }}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      step="any"
    />
  );
}
