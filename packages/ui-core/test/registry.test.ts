import { describe, it, expect } from 'vitest';
import { SchemaRegistry } from '../src/describe/registry.js';
import { manifest } from './fixtures/manifest.js';

describe('SchemaRegistry', () => {
  const registry = new SchemaRegistry(manifest);

  it('lists short paths in sorted order', () => {
    expect(registry.paths()).toEqual(['account', 'contact', 'deal']);
  });

  it('resolves a resource by short path', () => {
    const entry = registry.get('account');
    expect(entry?.collection).toBe('account');
  });

  it('uses explicit label/pluralLabel/displayField when provided', () => {
    const display = registry.display('account');
    expect(display).toEqual({
      label: 'Account',
      pluralLabel: 'Accounts',
      displayField: 'accountName',
    });
  });

  it('falls back to labelize + pluralize when hints are absent', () => {
    const display = registry.display('contact');
    expect(display.label).toBe('Contact');
    expect(display.pluralLabel).toBe('Contacts');
    // First searchable String non-FK field wins (first_name).
    expect(display.displayField).toBe('first_name');
  });

  it('synthesises an inverse hasMany on account for contact.accountId', () => {
    const rels = registry.relations('account');
    const contactsEdge = rels.find((r) => r.target === 'contact');
    expect(contactsEdge).toBeDefined();
    expect(contactsEdge?.foreignKey).toBe('accountId');
    expect(contactsEdge?.kind).toBe('hasMany');
    expect(contactsEdge?.declared).toBe(false);
  });

  it('synthesises an inverse hasMany on account for deal via belongsTo + via field.reference', () => {
    const rels = registry.relations('account');
    const dealsEdge = rels.find((r) => r.target === 'deal');
    expect(dealsEdge).toBeDefined();
    expect(dealsEdge?.foreignKey).toBe('accountId');
  });

  it('exposes declared relations on deal', () => {
    const rels = registry.relations('deal');
    const account = rels.find((r) => r.name === 'account');
    expect(account?.declared).toBe(true);
    expect(account?.kind).toBe('belongsTo');
    expect(account?.foreignKey).toBe('accountId');
  });

  it('previews a record using displayField', () => {
    expect(registry.preview('account', { accountName: 'Acme' })).toBe('Acme');
    expect(registry.preview('account', { _id: 'abc123' })).toBe('abc123');
  });
});
