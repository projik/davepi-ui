---
title: Override layers
description: How config and per-resource overrides compose.
---

Three customisation surfaces compose on top of schema defaults:

1. **`davepi-ui.config.ts`** — app-wide: branding, base URL, sidebar category ordering, app-wide widget overrides.
2. **`src/resources/{path}.ts(x)`** — per-resource override file, auto-discovered via Vite's `import.meta.glob`. Default-exports a `ResourceConfig`.
3. **Inline JSX props** — `<ResourceTable columns={[...]} />` overrides everything else.

## Merge order

From lowest precedence to highest: built-in defaults ← describe hints ← app-wide config ← per-resource override ← inline JSX prop.

Arrays **replace** rather than concatenate, so consumer `listColumns` deterministically overrides defaults.

## Example

```ts
// davepi-ui.config.ts
import { defineConfig } from '@davepi/ui-core';

export default defineConfig({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  branding: { name: 'CRM' },
  categoryOrder: ['CRM', 'Catalogue', 'Delivery'],
});
```

```ts
// src/resources/contact.ts
import type { ResourceConfig } from '@davepi/ui-core';

const config: ResourceConfig = {
  label: 'Contact',
  category: 'CRM',
  formSections: [
    { title: 'Identity', fields: [{ field: 'first_name' }, { field: 'last_name' }] },
    { title: 'Contact', fields: [{ field: 'email' }, { field: 'phone' }] },
  ],
};

export default config;
```

```tsx
// inline JSX last-mile
<ResourceTable resourcePath="contact" columns={[{ field: 'email' }]} />
```

The inline `columns` wins. Drop it to fall back to the per-resource override. Delete the override file to fall back to describe defaults.
