import { Input } from '@/components/ui/input';
import type { WidgetComponentProps } from './types';

export function UrlInput({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
  placeholder,
}: WidgetComponentProps<string | undefined>) {
  return (
    <Input
      id={id}
      name={name}
      type="url"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder ?? 'https://…'}
    />
  );
}
