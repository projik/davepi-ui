import { describe, it, expect } from 'vitest';
import { labelize, pluralize } from '../src/label.js';

describe('labelize', () => {
  it('handles camelCase', () => {
    expect(labelize('firstName')).toBe('First Name');
    expect(labelize('accountName')).toBe('Account Name');
  });

  it('handles snake_case', () => {
    expect(labelize('first_name')).toBe('First Name');
    expect(labelize('close_date')).toBe('Close Date');
  });

  it('handles kebab-case', () => {
    expect(labelize('first-name')).toBe('First Name');
  });

  it('uppercases known acronyms', () => {
    expect(labelize('apiKey')).toBe('API Key');
    expect(labelize('imageUrl')).toBe('Image URL');
    expect(labelize('jsonPayload')).toBe('JSON Payload');
    expect(labelize('apiKeyUrl')).toBe('API Key URL');
  });

  it('strips trailing Id when requested', () => {
    expect(labelize('accountId', { stripIdSuffix: true })).toBe('Account');
    expect(labelize('account_id', { stripIdSuffix: true })).toBe('Account');
    expect(labelize('userId', { stripIdSuffix: true })).toBe('User');
  });

  it('leaves single-segment strings alone', () => {
    expect(labelize('name')).toBe('Name');
    expect(labelize('id', { stripIdSuffix: true })).toBe('ID');
  });

  it('handles consecutive uppercase runs and acronym normalisation together', () => {
    // Splits to XML / Http / Request, then "Http" hits the acronym table.
    expect(labelize('XMLHttpRequest')).toBe('XML HTTP Request');
  });
});

describe('pluralize', () => {
  it('handles common endings', () => {
    expect(pluralize('account')).toBe('accounts');
    expect(pluralize('Account')).toBe('Accounts');
    expect(pluralize('box')).toBe('boxes');
    expect(pluralize('city')).toBe('cities');
    expect(pluralize('day')).toBe('days');
  });
});
