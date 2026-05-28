/**
 * Convert a database-style field or resource name into a human-friendly label.
 *
 * Splits on camelCase / snake_case / kebab-case boundaries, title-cases each
 * segment, and special-cases known acronyms (Id, Url, Api, Sms, etc.) plus
 * the trailing `Id` suffix common on foreign-key fields (`accountId` →
 * "Account"). Override the output by passing an explicit `label` on the
 * field/resource definition.
 *
 * @example
 * labelize('firstName') // "First Name"
 * labelize('account_name') // "Account Name"
 * labelize('accountId', { stripIdSuffix: true }) // "Account"
 * labelize('apiKeyUrl') // "API Key URL"
 */

const ACRONYMS = new Set([
  'Id',
  'Url',
  'Uri',
  'Api',
  'Sms',
  'Mms',
  'Http',
  'Https',
  'Json',
  'Xml',
  'Html',
  'Css',
  'Pdf',
  'Csv',
  'Ssn',
  'Eu',
  'Us',
  'Uk',
  'Iso',
  'Dob',
  'Vat',
  'Gst',
  'Sku',
  'Upc',
  'Ein',
  'Itin',
]);

const ACRONYM_UPPER: Record<string, string> = Object.fromEntries(
  Array.from(ACRONYMS).map((a) => [a.toLowerCase(), a.toUpperCase()])
);

export interface LabelizeOptions {
  /** Strip a trailing "Id" segment after splitting. Useful for FK fields. */
  stripIdSuffix?: boolean;
}

/**
 * Split a CamelCase / snake_case / kebab-case identifier into segments.
 * Preserves consecutive uppercase runs as single segments so "URL" stays
 * intact rather than splitting to "U", "R", "L".
 */
function splitSegments(input: string): string[] {
  if (!input) return [];
  return (
    input
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );
}

function titleCaseSegment(seg: string): string {
  const lower = seg.toLowerCase();
  if (ACRONYM_UPPER[lower]) return ACRONYM_UPPER[lower];
  return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase();
}

export function labelize(input: string, opts: LabelizeOptions = {}): string {
  let segments = splitSegments(input);
  if (opts.stripIdSuffix && segments.length > 1) {
    const last = segments[segments.length - 1];
    if (last && last.toLowerCase() === 'id') segments = segments.slice(0, -1);
  }
  return segments.map(titleCaseSegment).join(' ');
}

/**
 * Naive plural form. Override with explicit `pluralLabel` on the resource.
 * Handles common English endings only — non-English locales should provide
 * `pluralLabel` directly.
 */
export function pluralize(input: string): string {
  if (!input) return input;
  if (/(s|x|z|ch|sh)$/i.test(input)) return `${input}es`;
  if (/[^aeiou]y$/i.test(input)) return `${input.slice(0, -1)}ies`;
  return `${input}s`;
}
