---
title: Getting started
description: Spin up a davepi-ui admin against an existing davepi backend.
---

## Prerequisites

- A running [davepi](https://github.com/projik/davepi) backend (`/_describe` reachable).
- Node 20 or newer.
- pnpm 10 or newer (the monorepo uses pnpm workspaces).

## Clone + install

```bash
git clone https://github.com/projik/davepi-ui
cd davepi-ui
pnpm install
```

## Point it at your backend

Create `packages/ui-app-react/.env` (or copy `.env.example`):

```env
VITE_API_URL=http://localhost:4001
```

## Run

```bash
pnpm --filter @davepi/ui-app-react dev
```

Open `http://localhost:5173` and sign in with any davepi user. Every resource the backend exposes shows up in the sidebar.

## Build for production

```bash
pnpm --filter @davepi/ui-app-react build
```

Output lands in `packages/ui-app-react/dist/`. Serve as a static site behind your usual CDN / reverse proxy.

## Add your first override

Drop a file at `packages/ui-app-react/src/resources/account.ts`:

```ts
import type { ResourceConfig } from '@davepi/ui-core';

const config: ResourceConfig = {
  label: 'Customer',
  pluralLabel: 'Customers',
  category: 'CRM',
  displayField: 'accountName',
  listColumns: [
    { field: 'accountName', label: 'Customer name' },
    { field: 'description', label: 'Notes' },
  ],
};

export default config;
```

Save. Hot reload picks it up. The sidebar entry renames to "Customers" and the list shows your configured columns.
