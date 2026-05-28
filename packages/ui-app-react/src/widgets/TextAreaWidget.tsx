import { Textarea } from '@/components/ui/textarea';
import type { WidgetComponentProps } from './types';

export function TextAreaWidget({
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
    <Textarea
      id={id}
      name={name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={4}
    />
  );
}
