#!/usr/bin/env node
/**
 * `npx create-davepi-ui <name> [--api-url <url>] [--no-install] [--auth oauth]`
 *
 * Scaffolds a new davepi-ui admin project against a running davepi
 * backend:
 *   - copies the `default` template (a stripped Vite + React Router
 *     shell built on @davepi/ui-react + shadcn primitives)
 *   - rewrites `package.json` with the new project name + pinned
 *     published versions of @davepi/ui-* (no workspace: protocol)
 *   - writes `.env` carrying VITE_API_URL
 *   - runs `npm install` (skip with --no-install)
 *   - optionally configures OAuth via --auth oauth (interactive prompts)
 *   - prints the next three commands
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// inquirer is dynamically imported when --auth oauth is used
/** @type {import('inquirer') | null} */
let inquirer = null;
async function getInquirer() {
  if (!inquirer) {
    inquirer = await import('inquirer');
  }
  return inquirer.default || inquirer;
}

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
 * doesn't silently consume the next flag's name. Pass
 * `{ requireValue: true }` for value flags (e.g. `--auth`, `--api-url`)
 * so a bare flag with no value is a usage error rather than a silent
 * `true` that callers drop on the floor.
 */
function flag(args, name, { requireValue = false } = {}) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const next = args[i + 1];
  const missingValue =
    next === undefined || (typeof next === 'string' && next.startsWith('--'));
  if (missingValue) {
    if (!requireValue) return true;
    const detail = next === undefined ? 'none given' : `got "${next}" which looks like another flag`;
    const e = new Error(`Flag ${name} requires a value (${detail})`);
    e.usage = true;
    throw e;
  }
  return next;
}

function usage() {
  out('Usage: npx create-davepi-ui <name> [--api-url <url>] [--no-install] [--auth oauth]');
  out('');
  out('Flags:');
  out('  --api-url <url>   davepi backend base URL (default: http://localhost:4001)');
  out('  --no-install      skip the post-scaffold `npm install`');
  out('  --auth oauth      enable OAuth authentication (interactive prompts for providers)');
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
 * A template root is only usable if it carries the whole app, not just a
 * stray file or two. `templates/` is generated at publish time and gitignored,
 * so a partial copy can exist in a monorepo checkout (e.g. a few files
 * accidentally committed); preferring it would scaffold a project that can't
 * build. Gate on sentinels that the full template always has.
 */
function isCompleteTemplate(dir) {
  return (
    fs.existsSync(path.join(dir, 'package.json')) &&
    fs.existsSync(path.join(dir, 'src', 'main.tsx'))
  );
}

/**
 * Resolve the template root. Two layouts:
 *   - published package: `<pkg>/templates/default` (shipped via
 *     `prepublishOnly`).
 *   - inside the monorepo during dev: fall back to
 *     `<pkg>/../ui-app-react` directly.
 *
 * The shipped template is only used when it's complete; otherwise we fall
 * back to the live `ui-app-react` source so a partial generated copy never
 * yields a broken scaffold.
 */
function resolveTemplate() {
  const shipped = path.resolve(__dirname, '..', 'templates', 'default');
  if (isCompleteTemplate(shipped)) return shipped;
  const monorepoFallback = path.resolve(__dirname, '..', '..', 'ui-app-react');
  if (isCompleteTemplate(monorepoFallback)) return monorepoFallback;
  err('Could not find a complete scaffolder template. Reinstall create-davepi-ui.');
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

/**
 * Prompt the user for OAuth configuration when --auth oauth is passed.
 *
 * @returns {Promise<{mode: string, providers: string[]}>}
 */
async function promptOAuthConfig() {
  const iq = await getInquirer();

  const { mode } = await iq.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Which authentication mode do you want?',
      choices: [
        { name: 'OAuth only (no email/password)', value: 'oauth-only' },
        { name: 'OAuth + email/password (combined)', value: 'combined' },
      ],
      default: 'combined',
    },
  ]);

  const { providers } = await iq.prompt([
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Select OAuth providers (space to select, enter to confirm):',
      choices: [
        { name: 'Google', value: 'google' },
        { name: 'GitHub', value: 'github' },
        { name: 'Microsoft', value: 'microsoft' },
        { name: 'Discord', value: 'discord' },
      ],
      validate: (input) => input.length > 0 || 'Select at least one provider',
    },
  ]);

  return { mode, providers };
}

/**
 * Write the auth.config.ts file with the selected configuration.
 * Generates the full file content deterministically (no placeholders).
 *
 * @param {string} targetDir - The target project directory
 * @param {{mode: string, providers: string[]}} config - OAuth configuration
 */
function writeAuthConfig(targetDir, config) {
  const authConfigPath = path.join(targetDir, 'src', 'auth.config.ts');

  const content = `// Authentication configuration for this application.
// This file is overwritten by create-davepi-ui when using --auth oauth

export type AuthMode = 'oauth-only' | 'combined' | 'email-only';
export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'discord';

export interface AuthConfig {
  mode: AuthMode;
  oauthProviders: OAuthProvider[];
}

/**
 * Authentication configuration for this application.
 *
 * - mode: '${config.mode}' - email-only | combined (email + OAuth) | oauth-only
 * - oauthProviders: Array of enabled OAuth providers
 *
 * This config is used by LoginScreen to conditionally render
 * email/password form and OAuth provider buttons.
 */
export const authConfig: AuthConfig = {
  mode: '${config.mode}',
  oauthProviders: ${JSON.stringify(config.providers)},
};
`;

  fs.writeFileSync(authConfigPath, content);
  out(`Configured OAuth: ${config.mode} mode with ${config.providers.join(', ')}`);
}

async function main() {
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

  let apiUrl, skipInstall, authFlag, oauthConfig;
  try {
    const a = flag(args, '--api-url', { requireValue: true });
    apiUrl = typeof a === 'string' ? a : DEFAULT_API_URL;
    skipInstall = flag(args, '--no-install') === true;
    const auth = flag(args, '--auth', { requireValue: true });
    authFlag = typeof auth === 'string' ? auth : null;

    if (authFlag && authFlag !== 'oauth') {
      err(`Invalid --auth value: "${authFlag}". Only "oauth" is supported.`);
      usage();
      process.exit(1);
    }

    // Prompt for OAuth configuration if --auth oauth is passed
    if (authFlag === 'oauth') {
      oauthConfig = await promptOAuthConfig();
    }
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

  // Write auth.config.ts with OAuth configuration or defaults
  if (oauthConfig) {
    writeAuthConfig(target, oauthConfig);
  } else {
    // Default to email-only mode when --auth is not specified
    writeAuthConfig(target, { mode: 'email-only', providers: [] });
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

main().catch((e) => {
  err(e.stack || e.message);
  process.exit(1);
});
