---
'create-davepi-ui': minor
---

Use npm (not pnpm) in scaffolded projects to match the davepi backend's package-manager posture. davepi-ui itself stays on pnpm internally (it's a monorepo); the scaffolded admin output is a plain Vite app and uses npm so a user installing `davepi` via `npm install` doesn't suddenly need a second package manager.

Changes:
- `sync-templates.js` filters `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` out of the copied template — scaffolded project picks a fresh lock on `npm install`.
- `bin/index.js` spawns `npm install` (with the `.cmd` shim on Windows) instead of `pnpm install`. Next-steps output prints `npm install` / `npm run dev`.
- README + JSDoc updated to match.

Scripts in the scaffolded `package.json` were already named generically (`dev`, `build`, `preview`, `typecheck`, `clean`) so `npm run dev` works without script renames.
