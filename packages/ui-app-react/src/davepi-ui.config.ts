import { defineConfig } from '@davepi/ui-core';

/**
 * App-wide configuration for the davepi-ui example app shell.
 *
 * Per-resource overrides live in `src/resources/{path}.ts(x)` and merge
 * deeply on top of these defaults. Inline JSX props on `<ResourceTable>`
 * / `<ResourceForm>` win over everything.
 */
export default defineConfig({
  apiBaseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4001',
  branding: { name: 'davepi-ui' },
  categoryOrder: ['CRM', 'Catalogue', 'Delivery'],
});
