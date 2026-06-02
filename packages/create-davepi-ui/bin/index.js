#!/usr/bin/env node
/**
 * `npx create-davepi-ui <name> [--api-url <url>] [--no-install]`
 *
 * Scaffolds a new davepi-ui admin project against a running davepi
 * backend:
 *   - copies the `default` template (a stripped Vite + React Router
 *     shell built on @davepi/ui-react + shadcn primitives)
 *   - rewrites `package.json` with the new project name + pinned
 *     published versions of @davepi/ui-* (no workspace: protocol)
 *   - writes `.env` carrying VITE_API_URL
 *   - runs `npm install` (skip with --no-install)
 *   - prints the next three commands
 *
 * No `inquirer`, no progress bars — keeps the failure surface small.
 * Match davepi's own `create-davepi-app` posture.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_API_URL = 'http://localhost:4001';

function out(line) {
  process.stdout.write(line + '\n');
}
function err(line) {
  process.stderr.write(line + '\n');
}

/**
 * Read a `--name <value>` flag from argv. Returns:
 *   - null   when flag absent
 *   - true   when flag present but no value follows (boolean flag)
 *   - string when flag has a non-flag value following
 *
 * Throws when the next token starts with `--` so a missing value
 * doesn't silently consume the next flag's name.
 */
function flag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const next = args[i + 1];
  if (next === undefined) return true;
  if (typeof next === 'string' && next.startsWith('--')) {
    const e = new Error(`Flag ${name} requires a value (got "${next}" which looks like another flag)`);
    e.usage = true;
    throw e;
  }
  return next;
}

function usage() {
  out('Usage: npx create-davepi-ui <name> [--api-url <url>] [--no-install]');
  out('');
  out('Flags:');
  out('  --api-url <url>   davepi backend base URL (default: http://localhost:4001)');
  out('  --no-install      skip the post-scaffold `npm install`');
}

function copyTree(src, dst, skip) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip && skip.has(entry.name)) continue;
    const a = path.join(src, entry.name);
    const b = path.join(dst, entry.name);
    if (entry.isDirectory()) copyTree(a, b, skip);
    else fs.copyFileSync(a, b);
  }
}

/**
 * Resolve the template root. Two layouts:
 *   - published package: `<pkg>/templates/default` (shipped via
 *     `prepublishOnly`).
 *   - inside the monorepo during dev: fall back to
 *     `<pkg>/../ui-app-react` directly.
 */
function resolveTemplate() {
  const shipped = path.resolve(__dirname, '..', 'templates', 'default');
  if (fs.existsSync(shipped)) return shipped;
  const monorepoFallback = path.resolve(__dirname, '..', '..', 'ui-app-react');
  if (fs.existsSync(monorepoFallback)) return monorepoFallback;
  err('Could not find scaffolder template. Reinstall create-davepi-ui.');
  process.exit(1);
}

/**
 * Pin versions used in the template's `package.json`. Reads the
 * shipped `pinned-versions.json` if present (written at publish time
 * by `sync-templates.js`); otherwise falls back to the monorepo
 * workspace versions discovered by walking siblings.
 */
function resolvePinnedVersions() {
  const pinnedFile = path.resolve(__dirname, '..', 'templates', 'pinned-versions.json');
  if (fs.existsSync(pinnedFile)) {
    return JSON.parse(fs.readFileSync(pinnedFile, 'utf8'));
  }
  const out = {};
  const packagesDir = path.resolve(__dirname, '..', '..');
  for (const name of fs.readdirSync(packagesDir)) {
    const pj = path.join(packagesDir, name, 'package.json');
    if (!fs.existsSync(pj)) continue;
    try {
      const p = JSON.parse(fs.readFileSync(pj, 'utf8'));
      if (p.name && p.name.startsWith('@davepi/ui-') && p.version) {
        out[p.name] = `^${p.version}`;
      }
    } catch {}
  }
  return out;
}

/**
 * Rewrite a scaffolded `package.json`:
 *   - set `name` to the project name
 *   - reset to `private: true`, `version: "0.0.0"`
 *   - replace `workspace:^` / `workspace:*` references in deps and
 *     devDeps with the pinned semver from the published packages
 *   - drop the original repo / publish metadata so the user's new
 *     project doesn't impersonate davepi-ui
 */
function rewritePackageJson(file, projectName, pins) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  raw.name = projectName;
  raw.version = '0.0.0';
  raw.private = true;
  delete raw.description;
  delete raw.publishConfig;
  delete raw.repository;
  delete raw.bugs;
  delete raw.homepage;
  delete raw.keywords;
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const block = raw[section];
    if (!block) continue;
    for (const [dep, spec] of Object.entries(block)) {
      if (typeof spec === 'string' && spec.startsWith('workspace:')) {
        if (pins[dep]) {
          block[dep] = pins[dep];
        } else {
          // Conservative fallback — leave a known-bad spec rather than
          // an unresolvable workspace: marker so the install surface
          // surfaces the gap loudly.
          block[dep] = 'latest';
        }
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }

  const positional = args.filter((a) => !a.startsWith('--'));
  const name = positional[0];
  if (!name) {
    err('Project name is required.');
    usage();
    process.exit(1);
  }
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
    err(`Invalid project name: "${name}". Use kebab-case, no leading dot/dash.`);
    process.exit(1);
  }

  let apiUrl, skipInstall;
  try {
    const a = flag(args, '--api-url');
    apiUrl = typeof a === 'string' ? a : DEFAULT_API_URL;
    skipInstall = flag(args, '--no-install') === true;
  } catch (e) {
    err(e.message);
    if (e.usage) usage();
    process.exit(1);
  }

  const target = path.resolve(process.cwd(), name);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    err(`Target directory "${name}" already exists and is not empty.`);
    process.exit(1);
  }

  const template = resolveTemplate();
  out(`Scaffolding ${name} from ${template} → ${target}`);
  copyTree(template, target, new Set(['node_modules', 'dist', '.turbo', 'storybook-static', '.astro']));

  const pkgPath = path.join(target, 'package.json');
  if (fs.existsSync(pkgPath)) {
    rewritePackageJson(pkgPath, name, resolvePinnedVersions());
  }

  // Write a starter `.env` so the user can run `npm run dev` immediately.
  fs.writeFileSync(path.join(target, '.env'), `VITE_API_URL=${apiUrl}\n`);

  if (!skipInstall) {
    out('Installing dependencies…');
    // spawnSync with an argument array — no shell, no interpolation,
    // so the only program ever invoked is the literal `npm`. npm ships
    // as `.cmd` shim on Windows, hence the platform-specific name.
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const r = spawnSync(npmCmd, ['install'], { cwd: target, stdio: 'inherit' });
    if (r.status !== 0) {
      err('npm install failed. You can re-run it from the project directory.');
    }
  }

  out('');
  out('Done.');
  out('');
  out(`  cd ${name}`);
  if (skipInstall) out('  npm install');
  out('  npm run dev');
  out('');
  out(`Backend expected at ${apiUrl}. Edit .env to point elsewhere.`);
}

try {
  main();
} catch (e) {
  err(e.stack || e.message);
  process.exit(1);
}
