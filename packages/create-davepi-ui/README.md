# create-davepi-ui

Scaffolder for new [davepi-ui](https://github.com/projik/davepi-ui) admin projects against a running [davepi](https://github.com/projik/davepi) backend.

## Usage

```bash
npx create-davepi-ui my-admin --api-url http://localhost:4001
cd my-admin
npm run dev
```

## Flags

| Flag | Default | Purpose |
|---|---|---|
| `--api-url <url>` | `http://localhost:4001` | davepi backend base URL written to `.env` |
| `--no-install` | off | Skip post-scaffold `npm install` |

## What it does

1. Copies the bundled template (Vite + React Router + shadcn + `@davepi/ui-react`). Lock files are filtered out so the scaffolded project picks its own package manager — npm by default, matching the davepi backend.
2. Rewrites `package.json` — pins `@davepi/ui-*` deps to the published versions matching this scaffolder, sets `private: true`, drops upstream repo metadata.
3. Writes `.env` with `VITE_API_URL`.
4. Runs `npm install` (unless `--no-install`).

## License

MIT
