import { z, type ZodTypeAny } from 'zod';
import type { DescribeField, DescribeSchemaEntry } from './describe/types.js';

/**
 * Build a runtime zod schema from a `/_describe` resource entry.
 *
 * One zod field per describe field. Required fields use `.min(1)` on strings
 * (matches the backend's `required: true` semantics — empty strings are
 * rejected). Reference / FK fields validate as non-empty strings but do
 * not enforce uuid format (davepi accepts both ObjectId and arbitrary id
 * strings). Date fields use `z.coerce.date()` so form inputs that arrive
 * as ISO strings parse correctly. File fields validate as `unknown`
 * (consumers should layer file-specific checks).
 *
 * The output is the *write* shape — fields stamped by the server (`userId`,
 * `accountId`, `_id`, `createdAt`, `updatedAt`, `deletedAt`, `__v`) are
 * excluded so clients don't need to supply them.
 *
 * Override per-resource by passing a `transform` callback that receives
 * the base zod object and returns a refined one.
 *
 * @example
 * const Schema = zodFromDescribe(entry);
 * Schema.parse({ accountName: 'Acme', description: 'test' });
 */

const SERVER_STAMPED = new Set([
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'userId',
  'accountId',
]);

export interface ZodFromDescribeOptions {
  /** Set true to include server-stamped fields. Defaults to false. */
  includeServerStamped?: boolean;
  /** Custom per-field override. Returning `undefined` keeps the default. */
  fieldOverride?: (field: DescribeField) => ZodTypeAny | undefined;
}

export function zodFromDescribe(
  entry: DescribeSchemaEntry,
  opts: ZodFromDescribeOptions = {}
): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const field of entry.fields) {
    if (!opts.includeServerStamped && SERVER_STAMPED.has(field.name)) continue;
    const override = opts.fieldOverride?.(field);
    shape[field.name] = override ?? buildField(field);
  }
  return z.object(shape);
}

function buildField(field: DescribeField): ZodTypeAny {
  let base: ZodTypeAny = scalar(field);
  if (!field.required) base = base.optional();
  return base;
}

function scalar(field: DescribeField): ZodTypeAny {
  const { type, enum: enumValues } = field;

  if (enumValues && enumValues.length) {
    const opts = enumValues as readonly [string, ...string[]];
    return field.required ? z.enum(opts) : z.enum(opts).optional();
  }

  switch (type) {
    case 'Boolean':
      return z.boolean();
    case 'Number':
      return z.coerce.number();
    case 'Date':
      return z.coerce.date();
    case 'String':
    case 'ObjectId':
      return field.required ? z.string().min(1) : z.string();
    case 'File':
      return z.unknown();
    case 'Mixed':
      return z.unknown();
  }

  if (typeof type === 'string' && type.startsWith('[') && type.endsWith(']')) {
    const inner = type.slice(1, -1);
    if (inner === 'String' || inner === 'ObjectId') return z.array(z.string());
    if (inner === 'Number') return z.array(z.coerce.number());
    if (inner === 'Boolean') return z.array(z.boolean());
    if (inner === 'Date') return z.array(z.coerce.date());
    return z.array(z.unknown());
  }

  return z.unknown();
}
