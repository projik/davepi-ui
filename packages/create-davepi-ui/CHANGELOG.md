# create-davepi-ui

## 0.4.0

### Minor Changes

- Add OAuth authentication support via `--auth oauth` flag

  - New `--auth oauth` CLI flag enables interactive OAuth setup
  - Prompts for auth mode: OAuth-only or OAuth + email/password
  - Multi-select OAuth providers: Google, GitHub, Microsoft, Discord
  - Generates `auth.config.ts` with selected configuration
  - Updates `LoginScreen` with conditional OAuth provider buttons
  - Includes `OAuthCallback` route for handling OAuth redirects

## 0.3.0

### Minor Changes

- [`45c6d6d`](https://github.com/projik/davepi-ui/commit/45c6d6d1e1fb38cf3168b6af5f555c5ad8ab6dcc) Thanks [@projik](https://github.com/projik)! - UX cleanup pass after running create-davepi-ui against a non-davepi-seed schema set (the CRM template from `create-davepi-app`) surfaced four issues:

  1. **Demo override files leaked into every scaffolded project.** The `packages/ui-app-react/src/resources/*.ts` files were davepi-seed-schema demos (`accountName`, `first_name`, …) but the scaffolded template carried them verbatim. Against a CRM template (where fields are `name`, `firstName`), the listColumns referenced non-existent fields → table cells rendered "—". Demo files deleted; scaffolded `src/resources/` ships empty (with `.gitkeep`). The override layer is still wired and documented — consumers add files when they need overrides, the framework's `/_describe` defaults work out of the box.

  2. **Redundant `hasOne` tab next to an equivalent `hasMany`.** When a parent declares both `hasMany: contact` (e.g. `contacts`) and `hasOne: contact` (e.g. `primaryContact`) against the same foreign key, `<ResourceDetail>` now suppresses the hasOne tab — the hasMany already lists every child including whichever one the hasOne would surface. Cuts the duplicate "Contacts" label that the user reported.

  3. **Tab key collision warning.** `<TabsTrigger>` + `<TabsContent>` keyed only on `${target}:${foreignKey}`, so a parent with multiple relations against the same pair (e.g. `hasMany` + `hasOne`) emitted React duplicate-key warnings even before the hasOne dedupe above. Keys now include `rel.name`, so distinct relations always have distinct keys regardless of dedupe rules.

  4. **Theme bias toward black-on-white was visually heavy.** Default flipped from forced `dark` to **system-preference** (with `light` and `dark` as explicit overrides). Palette softened: slate neutrals + indigo accent in both modes, slate-blue dark instead of near-pure-black, indigo primary buttons instead of monochrome. A `<ThemeToggle>` lives in the app shell header — Sun / Moon icon with a dropdown menu (Light / Dark / System). Choice persisted to `localStorage` under `davepi-theme`; an inline `<script>` in `index.html` applies the saved preference before first paint to avoid a FOUC. System mode also listens for OS-level preference changes so day-night transitions track automatically.

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
