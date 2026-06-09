import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createDavepiClient, type DavepiClient, DavepiError } from '../client.js';

/**
 * Authentication context for davepi-ui.
 *
 * Stores the access token in memory (the tab) and the refresh token in
 * localStorage so the user stays logged in across refreshes. The provider
 * configures the `DavepiClient` with a 401 interceptor that hits
 * `POST /auth/refresh`, retries the failing request, and logs the user out
 * if refresh itself fails.
 *
 * Decodes the JWT for roles + identity so components can drive ACL gating
 * without a separate `/me` round-trip. Refresh tokens rotate; the new pair
 * comes back on every refresh response and is stamped over the prior one.
 *
 * `login`/`register` are the credential-based entry points, but the provider
 * is token-source agnostic: any flow that obtains a davepi access +
 * refresh token out of band — most notably an OAuth redirect that lands the
 * pair in query params — can hand them over with {@link AuthContextValue.setSession}.
 * The tokens then flow through the exact same path as a password login, so
 * `status` flips to `'authenticated'`, the refresh token is persisted under
 * the canonical key, and every data hook unblocks. No second storage key,
 * no parallel refresh loop, no OAuth-specific hooks required.
 *
 * @example
 * <AuthProvider baseUrl="http://localhost:4001">
 *   <App />
 * </AuthProvider>
 *
 * @example
 * // OAuth callback page (?token=…&refreshToken=…)
 * const { setSession } = useAuth();
 * useEffect(() => {
 *   const p = new URLSearchParams(window.location.search);
 *   const accessToken = p.get('token');
 *   const refreshToken = p.get('refreshToken');
 *   if (accessToken && refreshToken) {
 *     setSession({ accessToken, refreshToken });
 *     navigate('/', { replace: true });
 *   }
 * }, []);
 */

const REFRESH_STORAGE_KEY = 'davepi.refreshToken';

export interface AuthUser {
  user_id: string;
  email: string;
  roles: string[];
  [key: string]: unknown;
}

export interface AuthContextValue {
  client: DavepiClient;
  baseUrl: string;
  user: AuthUser | null;
  accessToken: string | null;
  status: 'unknown' | 'authenticated' | 'unauthenticated';
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  /**
   * Adopt an access + refresh token pair obtained outside the password
   * flow — e.g. the `?token=…&refreshToken=…` an OAuth provider lands on the
   * callback URL. Runs through the same path as `login`: decodes the JWT,
   * flips `status` to `'authenticated'`, persists the refresh token under the
   * canonical key (so reloads and the 401 interceptor refresh normally), and
   * unblocks every data hook. Synchronous — no network round-trip.
   */
  setSession(tokens: SessionTokens): void;
}

/** A davepi access + refresh token pair, as returned by login or OAuth. */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export interface AuthProviderProps {
  baseUrl: string;
  children: ReactNode;
  /** Override storage mechanism (defaults to localStorage). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  /** Override fetch impl (tests). */
  fetch?: typeof fetch;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
}

export function AuthProvider({
  baseUrl,
  children,
  storage,
  fetch: fetchImpl,
}: AuthProviderProps): ReactElement {
  const accessRef = useRef<string | null>(null);
  const refreshingRef = useRef<Promise<string | undefined> | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('unknown');

  const store = useMemo<AuthProviderProps['storage']>(
    () => storage ?? safeLocalStorage(),
    [storage]
  );

  const applyTokens = useCallback(
    (tokens: SessionTokens | null) => {
      if (tokens) {
        accessRef.current = tokens.accessToken;
        setAccessToken(tokens.accessToken);
        setUser(decodeJwt(tokens.accessToken));
        setStatus('authenticated');
        store?.setItem(REFRESH_STORAGE_KEY, tokens.refreshToken);
      } else {
        accessRef.current = null;
        setAccessToken(null);
        setUser(null);
        setStatus('unauthenticated');
        store?.removeItem(REFRESH_STORAGE_KEY);
      }
    },
    [store]
  );

  const performRefresh = useCallback(async (): Promise<string | undefined> => {
    if (refreshingRef.current) return refreshingRef.current;
    const refreshToken = store?.getItem(REFRESH_STORAGE_KEY);
    if (!refreshToken) {
      applyTokens(null);
      return undefined;
    }
    const promise = (async () => {
      try {
        const res = await (fetchImpl ?? globalThis.fetch)(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
        const next = (await res.json()) as LoginResponse;
        applyTokens({ accessToken: next.accessToken, refreshToken: next.refreshToken });
        return next.accessToken;
      } catch {
        applyTokens(null);
        return undefined;
      } finally {
        refreshingRef.current = null;
      }
    })();
    refreshingRef.current = promise;
    return promise;
  }, [applyTokens, baseUrl, fetchImpl, store]);

  const client = useMemo(
    () =>
      createDavepiClient({
        baseUrl,
        getToken: () => accessRef.current ?? undefined,
        onUnauthorized: () => performRefresh(),
        fetch: fetchImpl,
      }),
    [baseUrl, fetchImpl, performRefresh]
  );

  // On mount, try to refresh using the persisted refresh token so a page
  // reload doesn't log the user out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshToken = store?.getItem(REFRESH_STORAGE_KEY);
      if (!refreshToken) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      await performRefresh();
      // performRefresh has already settled status to authenticated/unauthenticated.
      // Only fall back to unauthenticated if it somehow left us in 'unknown'.
      // Use the functional form: reading `status` from this closure would be
      // stale ('unknown' from first render) and would clobber a successful
      // refresh back to unauthenticated — logging the user out on every reload.
      if (!cancelled) setStatus((prev) => (prev === 'unknown' ? 'unauthenticated' : prev));
    })();
    return () => {
      cancelled = true;
    };
    // intentionally one-shot on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await client.request<LoginResponse>({
        method: 'POST',
        path: '/login',
        body: { email, password },
        skipRefresh: true,
      });
      applyTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    },
    [applyTokens, client]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await client.request<LoginResponse>({
        method: 'POST',
        path: '/register',
        body: input,
        skipRefresh: true,
      });
      applyTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    },
    [applyTokens, client]
  );

  const setSession = useCallback(
    (tokens: SessionTokens) => {
      applyTokens(tokens);
    },
    [applyTokens]
  );

  const logout = useCallback(async () => {
    const refreshToken = store?.getItem(REFRESH_STORAGE_KEY);
    if (refreshToken) {
      try {
        await client.request({
          method: 'POST',
          path: '/auth/logout',
          body: { refreshToken },
          skipRefresh: true,
        });
      } catch (err) {
        if (!(err instanceof DavepiError)) throw err;
      }
    }
    applyTokens(null);
  }, [applyTokens, client, store]);

  const value: AuthContextValue = useMemo(
    () => ({ client, baseUrl, accessToken, user, status, login, logout, register, setSession }),
    [accessToken, baseUrl, client, login, logout, register, setSession, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

function decodeJwt(token: string): AuthUser | null {
  const segments = token.split('.');
  if (segments.length < 2) return null;
  const payload = segments[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = atobSafe(padded);
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

function atobSafe(input: string): string {
  if (typeof atob === 'function') return atob(input);
  // Node 20+ has a global atob; this is a defensive fallback.
  return Buffer.from(input, 'base64').toString('binary');
}

function safeLocalStorage(): AuthProviderProps['storage'] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
