import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@davepi/ui-react';

/**
 * OAuth callback handler — mounted at /auth/callback.
 *
 * davepi-plugin-oauth redirects here after successful authentication,
 * passing tokens in the query string:
 *   /auth/callback?token=<accessToken>&refreshToken=<refreshToken>
 *
 * This component extracts those tokens, establishes the session via
 * setSession(), and redirects to the home page.
 */
export function OAuthCallback() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('token');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      setSession({ accessToken, refreshToken });
    }

    navigate('/', { replace: true });
  }, [navigate, setSession]);

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Completing sign-in…
    </div>
  );
}
