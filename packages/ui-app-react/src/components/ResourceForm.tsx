import { useMemo, type ComponentType, type ReactNode } from 'react';
import { Controller, useForm, type DefaultValues, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  labelize,
  resolveWidget,
  zodFromDescribe,
  type DescribeField,
  type WidgetKind,
} from '@davepi/ui-core';
import { useAuth, useDescribe, useResourceConfig } from '@davepi/ui-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { resolveWidgetComponent, type WidgetComponentProps } from '@/widgets/registry';

/**
 * Schema-driven create/edit form.
 *
 * Three configuration sources compose:
 *   1. `/_describe` — fields, types, required, ACL.
 *   2. Consumer config (`davepi-ui.config.ts` + per-resource override file)
 *      — `formSections` (groups fields under headings), `widgets`
 *      (kind overrides keyed by field name).
 *   3. Inline JSX props — `widgetOverrides`, `hiddenFields`, `omitFields`.
 *
 * Field-level ACL is enforced UI-side: fields with `acl.read` excluded
 * from the current user's roles are dropped from the form, and fields
 * with `acl.create`/`update` excluded render disabled. The server still
 * enforces — this is purely declutter.
 *
 * @example
 * <ResourceForm resourcePath="account" onSubmit={mutate.mutateAsync} />
 */
export interface ResourceFormProps {
  resourcePath: string;
  initial?: Record<string, unknown>;
  /** Field-kind overrides keyed by field name → component. */
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
  /** Detected mode — controls whether create vs update ACL applies. */
  mode?: 'create' | 'update';
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

interface RenderField {
  field: DescribeField;
  isHidden: boolean;
  isReadOnly: boolean;
}

interface RenderSection {
  title?: string;
  description?: string;
  fields: RenderField[];
}

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
  mode = initial?._id ? 'update' : 'create',
}: ResourceFormProps) {
  const { data: describe } = useDescribe();
  const config = useResourceConfig(resourcePath);
  const { user } = useAuth();
  const entry = describe?.registry.get(resourcePath);

  const omit = useMemo(() => {
    const base = new Set(DEFAULT_OMIT);
    for (const f of omitFields ?? []) base.add(f);
    return base;
  }, [omitFields]);

  const hidden = useMemo(() => new Set(hiddenFields ?? []), [hiddenFields]);

  const userRoles = useMemo(() => new Set(user?.roles ?? []), [user?.roles]);

  const fieldsByName = useMemo(() => {
    const out = new Map<string, DescribeField>();
    for (const f of entry?.fields ?? []) out.set(f.name, f);
    return out;
  }, [entry?.fields]);

  /** Set of fields the user is allowed to read at all. */
  const readableFields = useMemo(() => {
    const allow = new Set<string>();
    for (const field of entry?.fields ?? []) {
      const required = field.acl?.read;
      if (!required?.length || required.some((r) => userRoles.has(r))) {
        allow.add(field.name);
      }
    }
    return allow;
  }, [entry?.fields, userRoles]);

  /** Set of fields the user can edit (write). Hidden fields always pass. */
  const writableFields = useMemo(() => {
    const allow = new Set<string>();
    for (const field of entry?.fields ?? []) {
      const op = mode === 'create' ? 'create' : 'update';
      const required = field.acl?.[op];
      if (!required?.length || required.some((r) => userRoles.has(r))) {
        allow.add(field.name);
      }
    }
    return allow;
  }, [entry?.fields, mode, userRoles]);

  const sections = useMemo<RenderSection[]>(() => {
    if (!entry) return [];
    const visibleFieldNames = entry.fields
      .map((f) => f.name)
      .filter((name) => {
        if (hidden.has(name)) return true; // always include hidden FKs
        if (omit.has(name)) return false;
        if (!readableFields.has(name)) return false;
        return true;
      });

    const buildSection = (sectionFields: readonly string[]): RenderField[] => {
      const out: RenderField[] = [];
      for (const name of sectionFields) {
        const f = fieldsByName.get(name);
        if (!f) continue;
        if (!visibleFieldNames.includes(name)) continue;
        const isHidden = hidden.has(name);
        const isReadOnly = isHidden || !writableFields.has(name);
        out.push({ field: f, isHidden, isReadOnly });
      }
      return out;
    };

    if (config.formSections?.length) {
      const placed = new Set<string>();
      const built: RenderSection[] = [];
      for (const section of config.formSections) {
        const fields = buildSection(section.fields.map((f) => f.field));
        for (const rf of fields) placed.add(rf.field.name);
        if (fields.length) {
          built.push({ title: section.title, description: section.description, fields });
        }
      }
      const remaining = visibleFieldNames.filter((n) => !placed.has(n));
      if (remaining.length) {
        built.push({ fields: buildSection(remaining) });
      }
      return built;
    }

    return [{ fields: buildSection(visibleFieldNames) }];
  }, [config.formSections, entry, fieldsByName, hidden, omit, readableFields, writableFields]);

  const schema = useMemo(() => {
    if (!entry) return null;
    return zodFromDescribe(entry, {
      includeStampedFields: Array.from(hidden),
    });
  }, [entry, hidden]);

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

  // Combine config-level widget map with inline overrides; inline wins.
  const fieldKindMap = config.widgets ?? {};

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      {sections.map((section, sectionIdx) => (
        <section
          key={section.title ?? `__section_${sectionIdx}__`}
          className="space-y-4"
        >
          {section.title ? (
            <header className="space-y-0.5">
              <h2 className="text-base font-semibold">{section.title}</h2>
              {section.description ? (
                <p className="text-xs text-muted-foreground">{section.description}</p>
              ) : null}
            </header>
          ) : null}
          <div className="space-y-4">
            {section.fields.map(({ field, isHidden, isReadOnly }) => {
              const spec = resolveWidget(field, {
                resourcePath,
                registry: describe.registry,
                resourceOverrides: fieldKindMap,
              });
              const Component = resolveWidgetComponent(spec.kind, widgetOverrides);
              return (
                <div key={field.name} className={cn(isHidden && 'hidden')}>
                  <Controller
                    control={form.control}
                    name={field.name}
                    render={({ field: ctrl, fieldState }) => (
                      <FormField
                        label={
                          labelize(field.name, {
                            stripIdSuffix: field.name.endsWith('Id') && field.name !== 'Id',
                          })
                        }
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
                          readOnly={isReadOnly}
                          disabled={isReadOnly && !isHidden}
                        />
                      </FormField>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
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
  children: ReactNode;
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
