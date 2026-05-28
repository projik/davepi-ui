import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { labelize } from '@davepi/ui-core';
import type { WidgetComponentProps } from './types';

export function EnumSelect({
  spec,
  value,
  onChange,
  disabled,
  id,
  name,
  placeholder,
}: WidgetComponentProps<string | undefined>) {
  const options = spec.options ?? [];
  return (
    <Select value={value ?? ''} onValueChange={(next) => onChange(next || undefined)} disabled={disabled}>
      <SelectTrigger id={id} aria-label={name}>
        <SelectValue placeholder={placeholder ?? 'Select…'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {labelize(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
