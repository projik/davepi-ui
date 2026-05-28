import type { ResourceConfig } from '@davepi/ui-core';

/**
 * Auto-discover per-resource override files at build time via Vite's
 * `import.meta.glob`. Consumers drop files at `src/resources/{path}.ts(x)`
 * exporting a default `ResourceConfig`.
 *
 * Lives at `src/resourceOverrides.ts` (not inside `src/resources/`) so
 * the loader file itself isn't matched by its own glob — that would
 * pull a copy of every resource module into a self-reference and bloat
 * the bundle.
 *
 * Filename → path mapping: `src/resources/account.ts` → `account`.
 * Hyphenated paths supported (`crm-deal.ts` → `crm-deal`).
 */

interface OverrideModule {
  default?: ResourceConfig;
}

const modules = import.meta.glob<OverrideModule>('./resources/*.{ts,tsx}', {
  eager: true,
});

export const resourceOverrides: Record<string, ResourceConfig> = Object.fromEntries(
  Object.entries(modules)
    .map(([path, mod]) => {
      const filename = path.replace(/^\.\/resources\//, '').replace(/\.(ts|tsx)$/, '');
      const cfg = mod.default;
      if (!cfg) return null;
      return [filename, cfg] as const;
    })
    .filter((x): x is readonly [string, ResourceConfig] => x !== null)
);
