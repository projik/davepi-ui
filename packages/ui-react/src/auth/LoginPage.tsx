import { useState, type FormEvent, type ReactElement } from 'react';
import { useAuth } from './AuthProvider.js';

/**
 * Default login screen. Intentionally minimal — consumers wanting branded
 * login should drop in their own page that calls `useAuth().login`.
 *
 * @example
 * <Route path="/login" element={<LoginPage onSuccessRedirect="/" />} />
 */
export interface LoginPageProps {
  onSuccessRedirect?: string;
  title?: string;
  /** Show a "register" link below the form. */
  registerHref?: string;
}

export function LoginPage({
  onSuccessRedirect,
  title = 'Sign in',
  registerHref,
}: LoginPageProps): ReactElement {
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      if (onSuccessRedirect && typeof window !== 'undefined') {
        window.location.assign(onSuccessRedirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'authenticated') {
    return (
      <div className="davepi-ui-login">
        <p>You are already signed in.</p>
      </div>
    );
  }

  return (
    <div className="davepi-ui-login">
      <h1>{title}</h1>
      <form onSubmit={onSubmit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {registerHref ? <a href={registerHref}>Create an account</a> : null}
    </div>
  );
}
