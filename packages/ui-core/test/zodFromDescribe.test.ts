import { describe, it, expect } from 'vitest';
import { zodFromDescribe } from '../src/zodFromDescribe.js';
import { manifest } from './fixtures/manifest.js';

describe('zodFromDescribe', () => {
  it('builds a write-shape zod schema excluding server-stamped fields', () => {
    const Schema = zodFromDescribe(manifest.schemas['v1/account']!);
    const keys = Object.keys(Schema.shape);
    expect(keys).not.toContain('userId');
    expect(keys).toContain('accountName');
    expect(keys).toContain('description');
  });

  it('requires required fields', () => {
    const Schema = zodFromDescribe(manifest.schemas['v1/account']!);
    const result = Schema.safeParse({ description: 'no name' });
    expect(result.success).toBe(false);
  });

  it('accepts a fully populated record', () => {
    const Schema = zodFromDescribe(manifest.schemas['v1/account']!);
    const result = Schema.safeParse({
      accountName: 'Acme',
      description: 'a customer',
      website: 'https://acme.test',
    });
    expect(result.success).toBe(true);
  });

  it('validates enums', () => {
    const Schema = zodFromDescribe(manifest.schemas['v1/deal']!);
    expect(Schema.safeParse({ accountId: 'a1', name: 'x', stage: 'bogus' }).success).toBe(false);
    expect(Schema.safeParse({ accountId: 'a1', name: 'x', stage: 'won' }).success).toBe(true);
  });

  it('coerces numbers and dates', () => {
    const Schema = zodFromDescribe(manifest.schemas['v1/deal']!);
    const parsed = Schema.parse({
      accountId: 'a1',
      name: 'x',
      amount: '12.5',
      closeDate: '2026-01-01',
    });
    expect(parsed.amount).toBe(12.5);
    expect(parsed.closeDate).toBeInstanceOf(Date);
  });

  it('treats empty string and null as undefined for optional Date fields', () => {
    const Schema = zodFromDescribe(manifest.schemas['v1/deal']!);
    const fromEmpty = Schema.safeParse({ accountId: 'a1', name: 'x', closeDate: '' });
    expect(fromEmpty.success).toBe(true);
    expect(fromEmpty.data?.closeDate).toBeUndefined();

    const fromNull = Schema.safeParse({ accountId: 'a1', name: 'x', closeDate: null });
    expect(fromNull.success).toBe(true);
    expect(fromNull.data?.closeDate).toBeUndefined();
  });
});
