import { Switch } from '@/components/ui/switch';
import type { WidgetComponentProps } from './types';

export function SwitchWidget({
  value,
  onChange,
  disabled,
  id,
  name,
}: WidgetComponentProps<boolean | undefined>) {
  return (
    <Switch
      id={id}
      name={name}
      checked={value ?? false}
      onCheckedChange={(next) => onChange(next)}
      disabled={disabled}
    />
  );
}
