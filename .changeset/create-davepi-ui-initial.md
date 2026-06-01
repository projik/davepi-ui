---
'create-davepi-ui': minor
---

Initial release. `npx create-davepi-ui <name>` scaffolds a new davepi-ui admin project from the bundled Vite + React Router shell:

- copies the template (sans build artifacts) into `<name>/`
- rewrites `package.json` — pins `@davepi/ui-*` deps to the published versions at scaffold time (no `workspace:` protocol leaks), sets `private: true`, drops upstream repo metadata
- inlines the monorepo's shared `tsconfig.base.json` so the scaffolded `tsconfig.json` is standalone
- writes `.env` with `VITE_API_URL` (default `http://localhost:4001`, override with `--api-url`)
- runs `pnpm install` (skip with `--no-install`)

Templates are regenerated at publish time by `bin/sync-templates.js` so the published tarball always matches the current `packages/ui-app-react` state — no manual snapshotting drift.
