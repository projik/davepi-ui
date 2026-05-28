import { Input } from '@/components/ui/input';
import type { WidgetComponentProps } from './types';

/**
 * Placeholder for the full RelationPicker which lands in M2.
 * For M1 we render a plain ID input but with the target resource label
 * visible so users know what kind of id is expected. This unblocks the
 * form generation pipeline without committing to the M2 picker UX yet.
 */
export function RelationPickerStub({
  spec,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  id,
  name,
}: WidgetComponentProps<string | undefined>) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={spec.target ? `${spec.target} id` : 'id'}
      />
      <span className="text-xs text-muted-foreground">
        Target: <code>{spec.target ?? 'unknown'}</code> · picker UX lands in M2.
      </span>
    </div>
  );
}
