import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@davepi/ui-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authConfig, type OAuthProvider } from '@/auth.config';

const providerLabels: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
  discord: 'Discord',
};

const providerButtonClasses: Record<OAuthProvider, string> = {
  google: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  github: 'bg-gray-900 text-white hover:bg-gray-800',
  microsoft: 'bg-[#0078d4] text-white hover:bg-[#006cbd]',
  discord: 'bg-[#5865f2] text-white hover:bg-[#4752c4]',
};

export function LoginScreen() {
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const showEmailPassword = authConfig.mode === 'combined' || authConfig.mode === 'email-only';
  const showOAuth = authConfig.mode === 'combined' || authConfig.mode === 'oauth-only';
  const hasProviders = authConfig.oauthProviders.length > 0;

  // Require a decoded `user`, not just `status`, before redirecting away.
  // AuthProvider can reach status='authenticated' with user=null when the
  // access token fails to decode (e.g. a malformed OAuth token); AuthGuard
  // rejects that state and falls back to /login, so redirecting on status
  // alone produces an infinite /login↔/ loop.
  useEffect(() => {
    if (status === 'authenticated' && user) navigate('/', { replace: true });
  }, [navigate, status, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  function redirectToOAuth(provider: OAuthProvider) {
    window.location.href = `${apiUrl}/auth/${provider}`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to davepi</CardTitle>
        </CardHeader>
        <CardContent>
          {showEmailPassword && (
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}

          {showEmailPassword && showOAuth && hasProviders && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
          )}

          {showOAuth && hasProviders && (
            <div className="flex flex-col gap-3">
              {authConfig.oauthProviders.map((provider) => (
                <Button
                  key={provider}
                  type="button"
                  variant="outline"
                  className={providerButtonClasses[provider]}
                  onClick={() => redirectToOAuth(provider)}
                >
                  Sign in with {providerLabels[provider]}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
