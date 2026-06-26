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

  // Home page customization. Drop `showResourceCards: false` for a blank
  // canvas, then edit `src/pages/DashboardPage.tsx` to add your own widgets.
  // dashboard: {
  //   title: 'Admin',
  //   subtitle: 'Welcome back.',
  //   resourceCards: ['account', 'order'], // explicit list + order; omit for all
  // },

  // Per-resource navigation tweaks (or use a `src/resources/{path}.ts` file):
  // resources: {
  //   account: { category: 'CRM', icon: 'users' },     // lucide name or emoji
  //   auditLog: { hidden: true },                        // off the menu; route still works
  // },
});
