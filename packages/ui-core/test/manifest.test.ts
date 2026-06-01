import { describe, expect, it } from 'vitest';
import { componentManifest, getComponent, recipes } from '../src/manifest.js';

/**
 * Contract test for the agent-facing component manifest + recipes.
 *
 * Treat the snapshot as the public API for AI agents that consume
 * `@davepi/ui-mcp`. Any PR that changes a component name, prop schema,
 * example, recipe id, or agent note must update this snapshot
 * deliberately — drive-by edits that silently break agent code are
 * caught here.
 *
 * Update with `pnpm test -u` after intentional changes.
 */
describe('component manifest', () => {
  it('snapshot of public surface', () => {
    expect(componentManifest).toMatchSnapshot();
  });

  it('every entry has a name + category + package + at least one example', () => {
    for (const entry of componentManifest) {
      expect(entry.name).toMatch(/^[A-Z][A-Za-z0-9]+$/);
      expect(entry.category).toMatch(/^[a-z]+$/);
      expect(entry.package).toMatch(/^@davepi\//);
      expect(entry.examples.length).toBeGreaterThan(0);
    }
  });

  it('getComponent resolves by exact name', () => {
    const first = componentManifest[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(getComponent(first.name)).toEqual(first);
    expect(getComponent('not-a-real-component')).toBeUndefined();
  });
});

describe('recipes', () => {
  it('snapshot of curated recipes', () => {
    expect(recipes).toMatchSnapshot();
  });

  it('every recipe has a unique id', () => {
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
