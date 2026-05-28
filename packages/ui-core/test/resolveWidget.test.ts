import { describe, it, expect } from 'vitest';
import { SchemaRegistry } from '../src/describe/registry.js';
import { resolveWidget } from '../src/resolveWidget.js';
import { manifest } from './fixtures/manifest.js';

describe('resolveWidget', () => {
  const registry = new SchemaRegistry(manifest);

  function fieldOf(resource: string, name: string) {
    const f = registry.get(resource)?.fields.find((x) => x.name === name);
    if (!f) throw new Error(`fixture missing ${resource}.${name}`);
    return f;
  }

  it('maps String to TextInput by default', () => {
    const spec = resolveWidget(fieldOf('account', 'accountName'), {
      resourcePath: 'account',
      registry,
    });
    expect(spec.kind).toBe('TextInput');
  });

  it('uses TextArea for description-style names', () => {
    const spec = resolveWidget(fieldOf('account', 'description'), {
      resourcePath: 'account',
      registry,
    });
    expect(spec.kind).toBe('TextArea');
  });

  it('uses EmailInput for *email field names', () => {
    const spec = resolveWidget(fieldOf('contact', 'email'), {
      resourcePath: 'contact',
      registry,
    });
    expect(spec.kind).toBe('EmailInput');
  });

  it('uses RelationPicker for *Id with target registered', () => {
    const spec = resolveWidget(fieldOf('contact', 'accountId'), {
      resourcePath: 'contact',
      registry,
    });
    expect(spec.kind).toBe('RelationPicker');
    expect(spec.target).toBe('account');
    expect(spec.searchField).toBe('accountName');
  });

  it('uses RelationPicker when field.reference is set', () => {
    const spec = resolveWidget(fieldOf('deal', 'accountId'), {
      resourcePath: 'deal',
      registry,
    });
    expect(spec.kind).toBe('RelationPicker');
    expect(spec.target).toBe('account');
  });

  it('uses EnumSelect when field.enum is present', () => {
    const spec = resolveWidget(fieldOf('deal', 'stage'), {
      resourcePath: 'deal',
      registry,
    });
    expect(spec.kind).toBe('EnumSelect');
    expect(spec.options).toEqual(['lead', 'qualified', 'won', 'lost']);
  });

  it('respects backend widget hint over name-based defaults', () => {
    const spec = resolveWidget(fieldOf('deal', 'amount'), {
      resourcePath: 'deal',
      registry,
    });
    expect(spec.kind).toBe('CurrencyInput');
    expect(spec.currency).toBe('USD');
  });

  it('TagInput for [String] without relation target', () => {
    const spec = resolveWidget(fieldOf('deal', 'tags'), {
      resourcePath: 'deal',
      registry,
    });
    expect(spec.kind).toBe('TagInput');
  });

  it('resource override beats app override beats default', () => {
    const field = fieldOf('account', 'description');
    const ctx = {
      resourcePath: 'account',
      registry,
      appOverrides: { 'account.description': 'TextInput' as const },
      resourceOverrides: { description: 'RichTextEditor' as const },
    };
    expect(resolveWidget(field, ctx).kind).toBe('RichTextEditor');
  });
});
