import type { ReactNode } from 'react';
import type { WidgetSpec } from '@davepi/ui-core';

/**
 * Contract every davepi-ui widget implements.
 *
 * Widgets are *controlled* — they receive a value + onChange so they can
 * plug into react-hook-form via the Controller render prop. Errors come
 * from RHF and are presented inline by the parent FormField wrapper.
 */
export interface WidgetComponentProps<T = unknown> {
  spec: WidgetSpec;
  value: T;
  onChange: (next: T) => void;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  /** Field-level validation error message. */
  error?: string;
  /** Auxiliary helper text rendered below the field. */
  description?: ReactNode;
  /** Placeholder rendered inside the input where supported. */
  placeholder?: string;
}
