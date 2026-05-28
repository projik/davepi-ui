import type { DescribeField, DescribeSchemaEntry } from './describe/types.js';
import type { SchemaRegistry } from './describe/registry.js';

/**
 * Map a `/_describe` field to the abstract widget kind a frontend should
 * render. The output is intentionally framework-agnostic — a React/Vue
 * widget library implements one component per kind and looks the kind up
 * via `resolveWidget`.
 *
 * Resolution order (lowest → highest priority):
 *   1. Built-in default per (type, name-pattern).
 *   2. Backend hint: `field.widget` (M0.5 backend addition).
 *   3. App-wide override map keyed by `resource.field` or `*.field`.
 *   4. Per-resource override map keyed by `field`.
 *
 * The final two are caller-supplied via {@link ResolveWidgetCtx.appOverrides}
 * / {@link ResolveWidgetCtx.resourceOverrides}. Inline JSX `widgets` props
 * sit even higher and are merged by `<ResourceForm>` directly.
 *
 * @example
 * const widget = resolveWidget(field, { resourcePath: 'contact', registry });
 * // → { kind: 'RelationPicker', field, target: 'account', searchField: 'accountName' }
 */

export type WidgetKind =
  | 'TextInput'
  | 'TextArea'
  | 'NumberInput'
  | 'Switch'
  | 'DatePicker'
  | 'EnumSelect'
  | 'TagInput'
  | 'FileUploader'
  | 'JsonEditor'
  | 'RelationPicker'
  | 'MultiRelationPicker'
  | 'EmailInput'
  | 'UrlInput'
  | 'CurrencyInput'
  | 'RichTextEditor';

export interface WidgetSpec {
  kind: WidgetKind;
  field: DescribeField;
  /** Resource path of the target collection for relation pickers. */
  target?: string;
  /** Field used as a search/preview hint for relation pickers. */
  searchField?: string;
  /** Enum options when kind === 'EnumSelect'. */
  options?: readonly string[];
  /** Format hint passed through from backend (e.g. 'currency:USD'). */
  format?: string;
  /** Optional ISO-format hint for currency widgets. */
  currency?: string;
}

export interface ResolveWidgetCtx {
  resourcePath: string;
  registry: SchemaRegistry;
  /** Field overrides keyed by `*.field` or `resource.field`. */
  appOverrides?: Record<string, WidgetKind>;
  /** Field overrides keyed by `field` for the current resource. */
  resourceOverrides?: Record<string, WidgetKind>;
}

const TEXTAREA_NAME = /^(description|notes|body|summary|comment|details)$/i;
const EMAIL_NAME = /(^|_|[a-z])email$/i;
const URL_NAME = /(url|link)$/i;

export function resolveWidget(field: DescribeField, ctx: ResolveWidgetCtx): WidgetSpec {
  const overridden = pickOverride(ctx, field.name);
  if (overridden) return finalize({ kind: overridden, field }, field);

  if (field.widget) return finalize({ kind: mapHint(field.widget), field }, field);

  return finalize(defaultWidget(field, ctx), field);
}

function defaultWidget(field: DescribeField, ctx: ResolveWidgetCtx): WidgetSpec {
  const { type, enum: enumValues, reference } = field;

  if (enumValues && enumValues.length) {
    return { kind: 'EnumSelect', field, options: enumValues };
  }

  if (type === 'Boolean') return { kind: 'Switch', field };
  if (type === 'Number') return { kind: 'NumberInput', field };
  if (type === 'Date') return { kind: 'DatePicker', field };
  if (type === 'File') return { kind: 'FileUploader', field };
  if (type === 'Mixed') return { kind: 'JsonEditor', field };

  if (type === 'String' || type === 'ObjectId') {
    const relTarget = inferRelationTarget(field, ctx);
    if (reference || relTarget) {
      const target = reference ?? relTarget;
      if (target) {
        const display = ctx.registry.display(target);
        return { kind: 'RelationPicker', field, target, searchField: display.displayField };
      }
    }
    if (EMAIL_NAME.test(field.name)) return { kind: 'EmailInput', field };
    if (URL_NAME.test(field.name)) return { kind: 'UrlInput', field };
    if (TEXTAREA_NAME.test(field.name)) return { kind: 'TextArea', field };
    return { kind: 'TextInput', field };
  }

  if (typeof type === 'string' && type.startsWith('[') && type.endsWith(']')) {
    const inner = type.slice(1, -1);
    if (inner === 'String' || inner === 'ObjectId') {
      const relTarget = inferRelationTarget(field, ctx);
      if (reference || relTarget) {
        const target = reference ?? relTarget;
        if (target) {
          const display = ctx.registry.display(target);
          return {
            kind: 'MultiRelationPicker',
            field,
            target,
            searchField: display.displayField,
          };
        }
      }
      return { kind: 'TagInput', field };
    }
  }

  return { kind: 'TextInput', field };
}

function finalize(spec: WidgetSpec, field: DescribeField): WidgetSpec {
  if (field.format) {
    spec.format = field.format;
    const [head, tail] = field.format.split(':', 2);
    if (head === 'currency' && tail) spec.currency = tail;
  }
  return spec;
}

function pickOverride(ctx: ResolveWidgetCtx, fieldName: string): WidgetKind | undefined {
  if (ctx.resourceOverrides && ctx.resourceOverrides[fieldName]) {
    return ctx.resourceOverrides[fieldName];
  }
  const app = ctx.appOverrides;
  if (!app) return undefined;
  return (
    app[`${ctx.resourcePath}.${fieldName}`] ??
    app[`*.${fieldName}`] ??
    undefined
  );
}

function mapHint(hint: string): WidgetKind {
  switch (hint) {
    case 'rich-text':
      return 'RichTextEditor';
    case 'textarea':
      return 'TextArea';
    case 'email':
      return 'EmailInput';
    case 'url':
      return 'UrlInput';
    case 'currency':
      return 'CurrencyInput';
    case 'enum':
      return 'EnumSelect';
    case 'json':
      return 'JsonEditor';
    case 'tags':
      return 'TagInput';
    case 'relation':
      return 'RelationPicker';
    case 'multi-relation':
      return 'MultiRelationPicker';
    case 'switch':
    case 'boolean':
      return 'Switch';
    case 'date':
      return 'DatePicker';
    default:
      return 'TextInput';
  }
}

function inferRelationTarget(
  field: DescribeField,
  ctx: ResolveWidgetCtx
): string | undefined {
  if (!field.name.endsWith('Id') || field.name.length <= 2) return undefined;
  const candidate = field.name.slice(0, -2);
  return ctx.registry.get(candidate) ? candidate : undefined;
}

/** Convenience: resolve every visible field on a resource at once. */
export function resolveFormWidgets(
  entry: DescribeSchemaEntry,
  ctx: ResolveWidgetCtx
): WidgetSpec[] {
  return entry.fields.map((f) => resolveWidget(f, ctx));
}
