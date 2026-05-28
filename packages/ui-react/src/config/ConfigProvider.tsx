import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  mergeResourceConfig,
  type DavepiUiConfig,
  type ResourceConfig,
} from '@davepi/ui-core';

/**
 * App-wide configuration context for davepi-ui.
 *
 * Two layers compose:
 *   1. App-wide config from `davepi-ui.config.ts` — branding, base URL,
 *      sidebar categories, widget overrides, default per-resource shape.
 *   2. Per-resource override files (the consumer's `src/resources/*.ts(x)`
 *      auto-discovered via Vite glob in the app shell) — passed in via
 *      `resourceOverrides` keyed by short path.
 *
 * `useResourceConfig(path)` returns the deep-merged effective config for
 * one resource — caller consumes it directly. Override merge order
 * follows the plan: built-in default ← describe hint ← app-wide config
 * ← per-resource override file ← inline JSX prop.
 *
 * @example
 * <ConfigProvider
 *   config={defineConfig({ apiBaseUrl: '/api', resources: { account: { label: 'Customer' } } })}
 *   resourceOverrides={{ account: { listColumns: [{ field: 'accountName' }] } }}
 * >
 *   <App />
 * </ConfigProvider>
 */

export interface DavepiConfigContextValue {
  config: DavepiUiConfig;
  /** Per-resource overrides keyed by short path (consumer-supplied files). */
  resourceOverrides: Record<string, ResourceConfig>;
  /** Merged effective config for a single resource. */
  resolveResource(path: string): ResourceConfig;
}

const ConfigContext = createContext<DavepiConfigContextValue | null>(null);

export interface ConfigProviderProps {
  config: DavepiUiConfig;
  resourceOverrides?: Record<string, ResourceConfig>;
  children: ReactNode;
}

export function ConfigProvider({
  config,
  resourceOverrides,
  children,
}: ConfigProviderProps) {
  const overrides = resourceOverrides ?? {};
  const value = useMemo<DavepiConfigContextValue>(
    () => ({
      config,
      resourceOverrides: overrides,
      resolveResource(path: string) {
        return mergeResourceConfig(config.resources?.[path], overrides[path]);
      },
    }),
    [config, overrides]
  );
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

/** Access the raw app-wide config + override map. */
export function useDavepiConfig(): DavepiConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    // ConfigProvider is optional — a consumer can run with zero config.
    // Return a no-op shim so child components don't need to null-check.
    return EMPTY_CONFIG;
  }
  return ctx;
}

/** Effective merged config for one resource. */
export function useResourceConfig(path: string): ResourceConfig {
  return useDavepiConfig().resolveResource(path);
}

const EMPTY_CONFIG: DavepiConfigContextValue = {
  config: { apiBaseUrl: '' },
  resourceOverrides: {},
  resolveResource: () => ({}),
};
