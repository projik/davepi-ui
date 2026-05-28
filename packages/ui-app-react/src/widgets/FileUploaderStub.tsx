import type { WidgetComponentProps } from './types';

export function FileUploaderStub({ spec }: WidgetComponentProps<unknown>) {
  return (
    <div className="rounded-md border border-dashed border-input p-3 text-xs text-muted-foreground">
      File widget for <code>{spec.field.name}</code> coming in M2.
    </div>
  );
}
