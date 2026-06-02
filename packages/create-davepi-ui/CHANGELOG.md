# create-davepi-ui

## 0.2.0

### Minor Changes

- [`bc78384`](https://github.com/projik/davepi-ui/commit/bc783846d1321b32415308d554a6b7ef743d2c46) Thanks [@projik](https://github.com/projik)! - Use npm (not pnpm) in scaffolded projects to match the davepi backend's package-manager posture. davepi-ui itself stays on pnpm internally (it's a monorepo); the scaffolded admin output is a plain Vite app and uses npm so a user installing `davepi` via `npm install` doesn't suddenly need a second package manager.

  Changes:

  - `sync-templates.js` filters `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json` out of the copied template — scaffolded project picks a fresh lock on `npm install`.
  - `bin/index.js` spawns `npm install` (with the `.cmd` shim on Windows) instead of `pnpm install`. Next-steps output prints `npm install` / `npm run dev`.
  - README + JSDoc updated to match.

  Scripts in the scaffolded `package.json` were already named generically (`dev`, `build`, `preview`, `typecheck`, `clean`) so `npm run dev` works without script renames.

## 0.1.0

### Minor Changes

- [`1cc0c07`](https://github.com/projik/davepi-ui/commit/1cc0c074ccee84250c3733a226392fb29849f956) Thanks [@projik](https://github.com/projik)! - Initial release. `npx create-davepi-ui <name>` scaffolds a new davepi-ui admin project from the bundled Vite + React Router shell:

  - copies the template (sans build artifacts) into `<name>/`
  - rewrites `package.json` — pins `@davepi/ui-*` deps to the published versions at scaffold time (no `workspace:` protocol leaks), sets `private: true`, drops upstream repo metadata
  - inlines the monorepo's shared `tsconfig.base.json` so the scaffolded `tsconfig.json` is standalone
  - writes `.env` with `VITE_API_URL` (default `http://localhost:4001`, override with `--api-url`)
  - runs `pnpm install` (skip with `--no-install`)

  Templates are regenerated at publish time by `bin/sync-templates.js` so the published tarball always matches the current `packages/ui-app-react` state — no manual snapshotting drift.
