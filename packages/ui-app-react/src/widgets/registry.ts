import type { ComponentType } from 'react';
import type { WidgetKind } from '@davepi/ui-core';
import type { WidgetComponentProps } from './types';

import { TextInput } from './TextInput';
import { TextAreaWidget } from './TextAreaWidget';
import { NumberInput } from './NumberInput';
import { SwitchWidget } from './SwitchWidget';
import { DateInput } from './DateInput';
import { EnumSelect } from './EnumSelect';
import { TagInput } from './TagInput';
import { EmailInput } from './EmailInput';
import { UrlInput } from './UrlInput';
import { CurrencyInput } from './CurrencyInput';
import { JsonEditor } from './JsonEditor';
import { RelationPickerStub } from './RelationPickerStub';
import { FileUploaderStub } from './FileUploaderStub';

/**
 * Maps every `WidgetKind` to its React implementation.
 *
 * Override at runtime by passing a custom registry to `<ResourceForm>`.
 * Unknown kinds fall back to `TextInput` rather than throwing — the UI
 * stays functional even if a future widget hint isn't recognised yet.
 */
export const widgetRegistry: Record<WidgetKind, ComponentType<WidgetComponentProps<any>>> = {
  TextInput,
  TextArea: TextAreaWidget,
  NumberInput,
  Switch: SwitchWidget,
  DatePicker: DateInput,
  EnumSelect,
  TagInput,
  EmailInput,
  UrlInput,
  CurrencyInput,
  RelationPicker: RelationPickerStub,
  MultiRelationPicker: RelationPickerStub,
  FileUploader: FileUploaderStub,
  JsonEditor,
  RichTextEditor: TextAreaWidget,
};

export function resolveWidgetComponent(
  kind: WidgetKind,
  overrides?: Partial<typeof widgetRegistry>
): ComponentType<WidgetComponentProps<any>> {
  return overrides?.[kind] ?? widgetRegistry[kind] ?? TextInput;
}

export type { WidgetComponentProps } from './types';
