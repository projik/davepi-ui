import type { DescribeManifest } from './types.js';

/**
 * Fetch the `/_describe` manifest from a davepi backend.
 *
 * The backend may require auth (`DESCRIBE_REQUIRES_AUTH=true`); pass a
 * bearer token via `getToken`. Returns the parsed manifest or throws on
 * non-2xx responses.
 *
 * @example
 * const manifest = await fetchDescribe({
 *   baseUrl: 'http://localhost:4001',
 *   getToken: () => localStorage.getItem('davepi.accessToken') ?? '',
 * });
 */
export interface FetchDescribeOptions {
  baseUrl: string;
  getToken?: () => string | Promise<string | undefined> | undefined;
  fetch?: typeof fetch;
}

export async function fetchDescribe(opts: FetchDescribeOptions): Promise<DescribeManifest> {
  const baseUrl = opts.baseUrl.replace(/\/+$/, '');
  const fetchImpl = opts.fetch ?? (globalThis.fetch as typeof fetch);
  const token = opts.getToken ? await opts.getToken() : undefined;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetchImpl(`${baseUrl}/_describe`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`fetchDescribe ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as DescribeManifest;
}
