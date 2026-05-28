import { useMemo } from 'react';
import { Controller, useForm, type DefaultValues, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  labelize,
  resolveWidget,
  zodFromDescribe,
  type WidgetKind,
} from '@davepi/ui-core';
import { useDescribe } from '@davepi/ui-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { resolveWidgetComponent, type WidgetComponentProps } from '@/widgets/registry';
import type { ComponentType } from 'react';

/**
 * Schema-driven create/edit form.
 *
 * For a resource path, builds a zod schema from `/_describe`, walks the
 * declared fields, resolves a widget per field, and renders each via
 * react-hook-form Controller. Submission goes through whichever mutator
 * the parent passes — same form is reused for create and edit by the
 * route components.
 *
 * @example
 * <ResourceForm
 *   resourcePath="account"
 *   initial={existing}
 *   onSubmit={(values) => mutation.mutateAsync(values)}
 *   submitLabel="Save"
 * />
 */
export interface ResourceFormProps {
  resourcePath: string;
  initial?: Record<string, unknown>;
  /** Field overrides keyed by name → component. */
  widgetOverrides?: Partial<Record<WidgetKind, ComponentType<WidgetComponentProps>>>;
  /** Fields to render hidden + readonly (e.g. parent FK from URL). */
  hiddenFields?: string[];
  /** Fields to omit entirely. Defaults to server-stamped fields. */
  omitFields?: string[];
  onSubmit: (values: Record<string, unknown>) => Promise<unknown> | unknown;
  onCancel?: () => void;
  submitLabel?: string;
  /** Top-level submission error (e.g. from server). */
  serverError?: string | null;
}

const DEFAULT_OMIT = new Set([
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'userId',
  'accountId',
]);

export function ResourceForm({
  resourcePath,
  initial,
  widgetOverrides,
  hiddenFields,
  omitFields,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  serverError,
}: ResourceFormProps) {
  const { data: describe } = useDescribe();
  const entry = describe?.registry.get(resourcePath);

  const omit = useMemo(() => {
    const base = new Set(DEFAULT_OMIT);
    for (const f of omitFields ?? []) base.add(f);
    return base;
  }, [omitFields]);

  const hidden = useMemo(() => new Set(hiddenFields ?? []), [hiddenFields]);

  const schema = useMemo(() => {
    if (!entry) return null;
    return zodFromDescribe(entry, {
      includeServerStamped: hidden.size > 0,
      fieldOverride: (field) => {
        if (omit.has(field.name) && !hidden.has(field.name)) return undefined;
        return undefined;
      },
    });
  }, [entry, hidden, omit]);

  const defaultValues = useMemo<DefaultValues<FieldValues>>(() => {
    if (!entry) return {};
    const out: Record<string, unknown> = {};
    for (const f of entry.fields) {
      if (omit.has(f.name) && !hidden.has(f.name)) continue;
      out[f.name] = initial?.[f.name] ?? defaultForField(f.type);
    }
    return out;
  }, [entry, hidden, initial, omit]);

  const form = useForm({
    defaultValues,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  if (!describe || !entry || !schema) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const fieldsToRender = entry.fields.filter((f) => !omit.has(f.name) || hidden.has(f.name));

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="space-y-4">
        {fieldsToRender.map((field) => {
          const spec = resolveWidget(field, {
            resourcePath,
            registry: describe.registry,
          });
          const Component = resolveWidgetComponent(spec.kind, widgetOverrides);
          const isHidden = hidden.has(field.name);
          return (
            <div key={field.name} className={cn(isHidden && 'hidden')}>
              <Controller
                control={form.control}
                name={field.name}
                render={({ field: ctrl, fieldState }) => (
                  <FormField
                    label={labelize(field.name, { stripIdSuffix: field.name.endsWith('Id') && field.name !== 'Id' })}
                    required={field.required}
                    error={fieldState.error?.message}
                  >
                    <Component
                      spec={spec}
                      id={field.name}
                      name={field.name}
                      value={ctrl.value}
                      onChange={ctrl.onChange}
                      onBlur={ctrl.onBlur}
                      readOnly={isHidden}
                    />
                  </FormField>
                )}
              />
            </div>
          );
        })}
      </div>
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function defaultForField(type: string): unknown {
  if (type === 'Boolean') return false;
  if (type.startsWith('[')) return [];
  return '';
}
