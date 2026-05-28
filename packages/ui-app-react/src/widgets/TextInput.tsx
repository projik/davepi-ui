import { Input } from '@/components/ui/input';
import type { WidgetComponentProps } from './types';

/**
 * Single-line text widget. Used for plain String fields.
 *
 * @example
 * <TextInput spec={spec} value={value ?? ''} onChange={onChange} />
 */
export function TextInput({
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
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
    />
  );
}
