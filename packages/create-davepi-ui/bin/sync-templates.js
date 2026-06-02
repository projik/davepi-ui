#!/usr/bin/env node
/**
 * Pre-publish hook: copy `packages/ui-app-react/` (sans build
 * artifacts) into this package's `templates/default/` so the
 * published tarball carries the template and consumers don't need
 * the davepi-ui monorepo layout to scaffold.
 *
 * Also writes `templates/pinned-versions.json` capturing each
 * `@davepi/ui-*` workspace package's current version, so the
 * scaffolder can rewrite `workspace:^` references in the template's
 * package.json to the matching `^<version>` semver at the moment the
 * tarball was built.
 *
 * The runtime CLI (`bin/index.js`) prefers `templates/default`
 * inside the package; in dev (running from the monorepo) it falls
 * back to `../ui-app-react` directly and reads versions from the
 * sibling package.json files.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const srcApp = path.join(repoRoot, 'packages', 'ui-app-react');
const dstTemplate = path.resolve(__dirname, '..', 'templates', 'default');
const dstPins = path.resolve(__dirname, '..', 'templates', 'pinned-versions.json');

if (!fs.existsSync(srcApp)) {
  process.stderr.write(
    `sync-templates: ${srcApp} not found. Run from inside the davepi-ui monorepo.\n`
  );
  process.exit(1);
}

fs.rmSync(path.resolve(__dirname, '..', 'templates'), { recursive: true, force: true });
fs.mkdirSync(dstTemplate, { recursive: true });

const SKIP = new Set([
  'node_modules',
  'dist',
  '.turbo',
  'storybook-static',
  '.astro',
  '.env',
  '.env.local',
  // Skip lock files — davepi-ui itself uses pnpm because it's a
  // monorepo, but the scaffolded admin is a plain Vite app that uses
  // npm. Keeps the package-manager surface aligned with the davepi
  // backend the user already runs via `npm install`. The scaffolded
  // `npm install` writes a fresh package-lock.json.
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
]);

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const a = path.join(src, entry.name);
    const b = path.join(dst, entry.name);
    if (entry.isDirectory()) copyTree(a, b);
    else fs.copyFileSync(a, b);
  }
}

copyTree(srcApp, dstTemplate);

// tsconfig.json in the template extends `../../tsconfig.base.json`,
// which doesn't exist in a scaffolded project. Inline the base so
// the scaffolded tsconfig is standalone.
const baseTs = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tsconfig.base.json'), 'utf8'));
const tplTsPath = path.join(dstTemplate, 'tsconfig.json');
if (fs.existsSync(tplTsPath)) {
  const tplTs = JSON.parse(fs.readFileSync(tplTsPath, 'utf8'));
  delete tplTs.extends;
  tplTs.compilerOptions = { ...baseTs.compilerOptions, ...(tplTs.compilerOptions || {}) };
  fs.writeFileSync(tplTsPath, JSON.stringify(tplTs, null, 2) + '\n');
}

// Capture the live version of every PUBLISHED `@davepi/ui-*` package
// so the scaffolder can pin them at consume time without a workspace
// protocol leaking into the user's package.json. `private: true`
// packages are skipped — they're not on the registry, so a pin
// against them would 404 at install time. The example app
// (`@davepi/ui-app-react`) is private for this reason; the template
// IS that package, so its scaffolded `package.json` doesn't reference
// it by name anyway.
const pins = {};
const packagesDir = path.join(repoRoot, 'packages');
for (const name of fs.readdirSync(packagesDir)) {
  const pj = path.join(packagesDir, name, 'package.json');
  if (!fs.existsSync(pj)) continue;
  try {
    const p = JSON.parse(fs.readFileSync(pj, 'utf8'));
    if (p.private === true) continue;
    if (p.name && p.name.startsWith('@davepi/ui-') && p.version) {
      pins[p.name] = `^${p.version}`;
    }
  } catch {}
}
fs.writeFileSync(dstPins, JSON.stringify(pins, null, 2) + '\n');

process.stdout.write(
  `sync-templates: copied ${srcApp} → ${dstTemplate} (pins: ${JSON.stringify(pins)})\n`
);
