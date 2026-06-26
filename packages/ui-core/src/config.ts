import type { WidgetKind } from './resolveWidget.js';
import type { ColumnSpec, ActionSpec, FormSectionSpec } from './descriptor/index.js';

/**
 * Consumer-supplied configuration loaded from `davepi-ui.config.ts` in
 * the consumer project. Drives sidebar grouping, per-resource defaults,
 * and per-field overrides. Merge order (low → high):
 *   built-in default → backend hint → app config → per-resource override
 *   file → inline JSX prop. This module owns the merge logic for the
 *   first three layers; per-resource override files plug in directly to
 *   the React layer.
 */

export interface ResourceRelationConfig {
  /** Embed style on the parent's detail page: 'tab' | 'inline' | 'hidden'. */
  embed?: 'tab' | 'inline' | 'hidden';
  /** Columns shown on the embedded list. Falls back to top-level listColumns. */
  columns?: ColumnSpec[];
}

export interface ResourceConfig {
  label?: string;
  pluralLabel?: string;
  displayField?: string;
  category?: string;
  /**
   * Icon for this resource in the sidebar / dashboard. Either a
   * [lucide](https://lucide.dev) icon name (`'users'`, `'shopping-cart'`,
   * `'ShoppingCart'` — kebab/snake/Pascal all accepted) or any literal
   * string (e.g. an emoji `'📦'`), rendered as-is when no icon matches.
   */
  icon?: string;
  /**
   * Hide this resource from the sidebar and dashboard. The routes
   * (`/r/:path…`) still resolve — this only declutters navigation, it is
   * NOT an access control (use `permissions` / backend ACL for that).
   */
  hidden?: boolean;
  listColumns?: ColumnSpec[];
  formSections?: FormSectionSpec[];
  widgets?: Record<string, WidgetKind>;
  relations?: Record<string, ResourceRelationConfig>;
  actions?: {
    row?: ActionSpec[];
    bulk?: ActionSpec[];
  };
  permissions?: {
    /** Roles allowed to see this resource at all. Default: any authenticated user. */
    list?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };
}

export interface DavepiUiConfig {
  apiBaseUrl: string;
  branding?: {
    name?: string;
    logo?: string;
  };
  /** App-wide widget overrides keyed by `*.field` or `resource.field`. */
  widgets?: Record<string, WidgetKind>;
  resources?: Record<string, ResourceConfig>;
  /** Order of categories in the sidebar. Unlisted categories go after. */
  categoryOrder?: string[];
  /** Home / dashboard page customization. */
  dashboard?: DashboardConfig;
}

export interface DashboardConfig {
  /** Heading shown at the top of the dashboard. Default: `'Dashboard'`. */
  title?: string;
  /** Sub-heading under the title. Set to `''` to hide the default copy. */
  subtitle?: string;
  /**
   * Render the auto-generated grid of resource cards. Default: `true`.
   * Set `false` when you want a blank dashboard to drop custom widgets onto.
   */
  showResourceCards?: boolean;
  /**
   * Restrict the resource cards to these resource paths, in this order.
   * Omit to show every (non-`hidden`) resource. Unknown paths are skipped.
   */
  resourceCards?: string[];
}

/**
 * Helper for typed config files. Pure identity at runtime — the value
 * matters at type-check time.
 *
 * @example
 * // davepi-ui.config.ts
 * import { defineConfig } from '@davepi/ui-core';
 * export default defineConfig({
 *   apiBaseUrl: import.meta.env.VITE_API_URL,
 *   resources: { account: { label: 'Account', displayField: 'accountName' } },
 * });
 */
export function defineConfig(config: DavepiUiConfig): DavepiUiConfig {
  return config;
}

/**
 * Merge two `ResourceConfig` snapshots. Arrays are *replaced* (not
 * concatenated) so a consumer-provided `listColumns` deterministically
 * overrides the default — concat semantics surprise users when ordering
 * matters.
 */
export function mergeResourceConfig(
  base: ResourceConfig | undefined,
  override: ResourceConfig | undefined
): ResourceConfig {
  if (!base) return { ...(override ?? {}) };
  if (!override) return { ...base };
  return {
    ...base,
    ...override,
    widgets: { ...(base.widgets ?? {}), ...(override.widgets ?? {}) },
    relations: { ...(base.relations ?? {}), ...(override.relations ?? {}) },
    actions: {
      row: override.actions?.row ?? base.actions?.row,
      bulk: override.actions?.bulk ?? base.actions?.bulk,
    },
    permissions: { ...(base.permissions ?? {}), ...(override.permissions ?? {}) },
  };
}
