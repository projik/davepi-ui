/**
 * JSON-serializable page descriptors.
 *
 * An agent that wants to compose a page outputs a `PageSpec` (or one of
 * its component-level cousins) as plain JSON; the React/Vue runtime
 * walks the spec + a live `/_describe` snapshot and renders the page.
 *
 * This is what makes the framework agent-first: every visual surface
 * can be produced by emitting JSON, no JSX required.
 */

import { z } from 'zod';

export const ActionSpec = z.object({
  id: z.string(),
  label: z.string(),
  /** Optional resource path the action operates against. */
  resource: z.string().optional(),
  /** Confirmation prompt shown before the action runs. */
  confirm: z.string().optional(),
  /** REST mutation kind, dispatched by the runtime. */
  kind: z.enum(['custom', 'bulkUpdate', 'bulkDelete', 'navigate']).default('custom'),
  /** For bulkUpdate / bulkDelete: REST query and body templates. */
  query: z.record(z.unknown()).optional(),
  body: z.record(z.unknown()).optional(),
  /** For navigate: target path (templated with `{id}`). */
  to: z.string().optional(),
});
export type ActionSpec = z.infer<typeof ActionSpec>;

export const ColumnSpec = z.object({
  field: z.string(),
  label: z.string().optional(),
  /** Render hint when the column points into a related record. */
  via: z.enum(['scalar', 'relation', 'aggregate']).default('scalar'),
  width: z.union([z.number(), z.string()]).optional(),
  sortable: z.boolean().optional(),
  /** Custom format hint, e.g. 'date', 'currency:USD'. */
  format: z.string().optional(),
});
export type ColumnSpec = z.infer<typeof ColumnSpec>;

export const TableSpec = z.object({
  kind: z.literal('table'),
  resource: z.string(),
  columns: z.array(ColumnSpec).optional(),
  filters: z.record(z.unknown()).optional(),
  search: z.string().optional(),
  pageSize: z.number().optional(),
  rowActions: z.array(ActionSpec).optional(),
  bulkActions: z.array(ActionSpec).optional(),
});
export type TableSpec = z.infer<typeof TableSpec>;

export const FieldSpec = z.object({
  field: z.string(),
  label: z.string().optional(),
  widget: z.string().optional(),
  required: z.boolean().optional(),
  /** Prefill / readonly value (e.g. parent FK stamped from URL). */
  hidden: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
});
export type FieldSpec = z.infer<typeof FieldSpec>;

export const FormSectionSpec = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(FieldSpec),
});
export type FormSectionSpec = z.infer<typeof FormSectionSpec>;

export const FormSpec = z.object({
  kind: z.literal('form'),
  resource: z.string(),
  /** When set, render an edit form for this record id. */
  id: z.string().optional(),
  sections: z.array(FormSectionSpec).optional(),
  /** Submit redirect path. */
  onSuccessTo: z.string().optional(),
});
export type FormSpec = z.infer<typeof FormSpec>;

export const DetailSpec = z.object({
  kind: z.literal('detail'),
  resource: z.string(),
  id: z.string(),
  /** Tabs to embed `<RelatedList>` for each relation. */
  embeds: z
    .array(
      z.object({
        relation: z.string(),
        title: z.string().optional(),
      })
    )
    .optional(),
});
export type DetailSpec = z.infer<typeof DetailSpec>;

export const HeadingSpec = z.object({
  kind: z.literal('heading'),
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
});
export type HeadingSpec = z.infer<typeof HeadingSpec>;

export const MarkdownSpec = z.object({
  kind: z.literal('markdown'),
  body: z.string(),
});
export type MarkdownSpec = z.infer<typeof MarkdownSpec>;

export const BlockSpec = z.discriminatedUnion('kind', [
  TableSpec,
  FormSpec,
  DetailSpec,
  HeadingSpec,
  MarkdownSpec,
]);
export type BlockSpec = z.infer<typeof BlockSpec>;

export const PageSpec = z.object({
  kind: z.literal('page'),
  title: z.string(),
  /** Display in sidebar nav under this category. */
  category: z.string().optional(),
  blocks: z.array(BlockSpec),
});
export type PageSpec = z.infer<typeof PageSpec>;

/**
 * Validate a JSON-emitted spec against the schema. Throws ZodError on
 * mismatch — agents can use the error path to iterate.
 */
export function parsePageSpec(input: unknown): PageSpec {
  return PageSpec.parse(input);
}
