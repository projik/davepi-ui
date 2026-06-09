import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import {
  AuthProvider,
  AuthGuard,
  useAuth,
  type AuthContextValue,
  type AuthProviderProps,
} from '../src/auth/index.js';

/**
 * Regression coverage for #5: davepi-plugin-oauth was incompatible with the
 * AuthProvider because there was no way to hand it tokens obtained outside the
 * password flow. `setSession` closes that gap — OAuth tokens now flow through
 * the same path as a login, so `status` flips to `authenticated`, the refresh
 * token lands under the canonical key, and the data hooks unblock.
 */

function makeJwt(payload: Record<string, unknown>): string {
  const enc = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc(payload)}.sig`;
}

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  };
}

const statusText = () => screen.getByTestId('status').textContent;
const guardText = () => screen.getByTestId('guard').textContent;

// Capture the live context so tests can drive imperative methods.
let captured: AuthContextValue;
function Probe() {
  captured = useAuth();
  return <div data-testid="status">{captured.status}</div>;
}

function renderProvider(overrides: Partial<AuthProviderProps> = {}) {
  const storage = overrides.storage ?? memoryStorage();
  const fetchImpl =
    overrides.fetch ??
    (vi.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch);
  render(
    <AuthProvider baseUrl="http://api.test" storage={storage} fetch={fetchImpl}>
      <Probe />
      <AuthGuard fallback={<div data-testid="guard">denied</div>}>
        <div data-testid="guard">allowed</div>
      </AuthGuard>
    </AuthProvider>
  );
  return { storage, fetchImpl };
}

describe('AuthProvider', () => {
  afterEach(() => cleanup());

  it('starts unauthenticated when no refresh token is persisted', async () => {
    renderProvider();
    await waitFor(() => expect(statusText()).toBe('unauthenticated'));
    expect(guardText()).toBe('denied');
  });

  it('setSession adopts external (OAuth) tokens: authenticates, decodes user, persists refresh token', async () => {
    const { storage, fetchImpl } = renderProvider();
    await waitFor(() => expect(statusText()).toBe('unauthenticated'));

    const accessToken = makeJwt({ user_id: 'u_1', email: 'oauth@test.dev', roles: ['member'] });
    act(() => {
      captured.setSession({ accessToken, refreshToken: 'oauth-refresh-1' });
    });

    await waitFor(() => expect(statusText()).toBe('authenticated'));
    // Issue 2: AuthGuard (and every status-gated data hook) now unblocks.
    expect(guardText()).toBe('allowed');
    expect(captured.accessToken).toBe(accessToken);
    expect(captured.user).toMatchObject({
      user_id: 'u_1',
      email: 'oauth@test.dev',
      roles: ['member'],
    });
    // Issue 1: refresh token lands under the canonical key, not a side channel.
    expect(storage.map.get('davepi.refreshToken')).toBe('oauth-refresh-1');
    // setSession is synchronous — no /auth/refresh round-trip on adopt.
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('survives reload: a persisted refresh token (as setSession stored it) refreshes instead of redirecting to login', async () => {
    const storage = memoryStorage({ 'davepi.refreshToken': 'oauth-refresh-1' });
    const rotated = makeJwt({ user_id: 'u_1', email: 'oauth@test.dev', roles: ['member'] });
    // Assert on the recorded call afterwards — throwing inside the stub would be
    // swallowed by performRefresh's try/catch and surface only as a timeout.
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ accessToken: rotated, refreshToken: 'oauth-refresh-2' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    ) as unknown as typeof fetch;

    renderProvider({ storage, fetch: fetchImpl });

    await waitFor(() => expect(statusText()).toBe('authenticated'));
    expect(captured.accessToken).toBe(rotated);
    // Rotated refresh token is stamped over the prior one.
    expect(storage.map.get('davepi.refreshToken')).toBe('oauth-refresh-2');

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toBe('http://api.test/auth/refresh');
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({ refreshToken: 'oauth-refresh-1' });
  });
});
