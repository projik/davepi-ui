/**
 * davepi HTTP client used by the React hooks.
 *
 * Mirrors the contract of `client/davepi-runtime.ts` in the davepi backend
 * but inlined here so this package does not depend on davepi being a
 * peer dep. Once davepi publishes its runtime as a standalone npm package
 * we can swap to consuming it directly.
 */

export class DavepiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'DavepiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ListParams {
  filter?: Record<string, unknown>;
  page?: number;
  sort?: string;
  q?: string;
  include?: string[];
  includeDeleted?: boolean;
}

export interface ListResponse<T> {
  results: T[];
  totalResults: number;
  page: number;
  perPage: number;
  totalPages?: number;
  nextPage?: number;
  prevPage?: number;
}

export interface DavepiClientOptions {
  baseUrl: string;
  getToken?: () => string | Promise<string | undefined> | undefined;
  /**
   * Hook called when a request returns 401. Should attempt a refresh and
   * return the new bearer token, or undefined to signal logout. Receives
   * the original request descriptor so the caller can decide whether to
   * skip refresh (e.g. don't refresh the refresh request itself).
   */
  onUnauthorized?: () => Promise<string | undefined>;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export interface DavepiClient {
  baseUrl: string;
  request<T>(req: RequestDescriptor): Promise<T>;
  list<T>(path: string, params?: ListParams): Promise<ListResponse<T>>;
  get<T>(path: string, id: string, include?: string[]): Promise<T>;
  create<T>(path: string, body: unknown): Promise<T>;
  update<T>(path: string, id: string, body: unknown): Promise<T>;
  remove(path: string, id: string): Promise<{ acknowledged: boolean }>;
  fetchJson<T>(input: string, init?: RequestInit): Promise<T>;
}

interface RequestDescriptor {
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Set true to skip auto-401 refresh (used by the refresh call itself). */
  skipRefresh?: boolean;
}

export function createDavepiClient(opts: DavepiClientOptions): DavepiClient {
  const baseUrl = opts.baseUrl.replace(/\/+$/, '');
  const fetchImpl = opts.fetch ?? (globalThis.fetch as typeof fetch);
  const defaultHeaders = { ...(opts.headers ?? {}) };

  async function rawRequest<T>(req: RequestDescriptor, overrideToken?: string): Promise<T> {
    const token = overrideToken ?? (opts.getToken ? await opts.getToken() : undefined);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...defaultHeaders,
      ...(req.headers ?? {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const qs = req.query ? buildQuery(req.query) : '';
    const url = baseUrl + req.path + (qs ? `?${qs}` : '');
    const res = await fetchImpl(url, {
      method: req.method,
      headers,
      body: req.body == null ? undefined : JSON.stringify(req.body),
    });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const parsed = text ? safeJson(text) : null;
    if (!res.ok) {
      const error = extractError(parsed, res.statusText);
      throw new DavepiError(res.status, error.code, error.message, error.details);
    }
    return parsed as T;
  }

  async function request<T>(req: RequestDescriptor): Promise<T> {
    try {
      return await rawRequest<T>(req);
    } catch (err) {
      if (
        err instanceof DavepiError &&
        err.status === 401 &&
        !req.skipRefresh &&
        opts.onUnauthorized
      ) {
        const refreshed = await opts.onUnauthorized();
        if (refreshed) return rawRequest<T>(req, refreshed);
      }
      throw err;
    }
  }

  return {
    baseUrl,
    request,
    list: <T>(path: string, params: ListParams = {}) => {
      const q: Record<string, unknown> = { ...(params.filter ?? {}) };
      if (params.page != null) q.__page = params.page;
      if (params.sort) q.__sort = params.sort;
      if (params.q) q.__q = params.q;
      if (params.include?.length) q.__include = params.include;
      if (params.includeDeleted) q.__includeDeleted = 'true';
      return request<ListResponse<T>>({ method: 'GET', path, query: q });
    },
    get: <T>(path: string, id: string, include?: string[]) => {
      const q: Record<string, unknown> = {};
      if (include?.length) q.__include = include;
      return request<T>({ method: 'GET', path: `${path}/${id}`, query: q });
    },
    create: <T>(path: string, body: unknown) =>
      request<T>({ method: 'POST', path, body }),
    update: <T>(path: string, id: string, body: unknown) =>
      request<T>({ method: 'PUT', path: `${path}/${id}`, body }),
    remove: (path: string, id: string) =>
      request<{ acknowledged: boolean }>({ method: 'DELETE', path: `${path}/${id}` }),
    fetchJson: async <T>(input: string, init?: RequestInit) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...defaultHeaders,
        ...((init?.headers as Record<string, string>) ?? {}),
      };
      const token = opts.getToken ? await opts.getToken() : undefined;
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = input.startsWith('http') ? input : baseUrl + input;
      const res = await fetchImpl(url, { ...init, headers });
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      const parsed = text ? safeJson(text) : null;
      if (!res.ok) {
        const error = extractError(parsed, res.statusText);
        throw new DavepiError(res.status, error.code, error.message, error.details);
      }
      return parsed as T;
    },
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractError(
  parsed: unknown,
  fallbackMessage: string
): { code: string; message: string; details?: unknown } {
  if (parsed && typeof parsed === 'object' && 'error' in (parsed as object)) {
    const err = (parsed as { error: { code?: string; message?: string; details?: unknown } }).error;
    return {
      code: err?.code ?? 'UNKNOWN',
      message: err?.message ?? fallbackMessage,
      details: err?.details,
    };
  }
  return {
    code: 'UNKNOWN',
    message: typeof parsed === 'string' && parsed ? parsed : fallbackMessage,
  };
}

function buildQuery(q: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.length) params.set(k, v.join(','));
    } else if (typeof v === 'object') {
      params.set(k, JSON.stringify(v));
    } else {
      params.set(k, String(v));
    }
  }
  return params.toString();
}
