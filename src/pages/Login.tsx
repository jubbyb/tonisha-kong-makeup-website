import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'signup' | 'artist';

export default function Login() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/';
  const initialMode = (searchParams.get('mode') as Mode) ?? 'login';

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const messages: Record<string, string> = {
        oauth_cancelled: 'Google sign-in was cancelled.',
        oauth_token_exchange: 'Could not connect to Google. Please try again.',
        oauth_userinfo: 'Could not retrieve your Google profile. Please try again.',
        email_not_verified: 'Your Google account email is not verified.',
      };
      setError(messages[oauthError] ?? 'An error occurred during Google sign-in.');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Email is required.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? ''
      : 'Please enter a valid email address.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint = '/api/auth/login';
      let body: Record<string, string> = { email, password };

      if (mode === 'signup') {
        endpoint = '/api/auth/signup';
        body = { name, email, password };
      } else if (mode === 'artist') {
        endpoint = '/api/auth/artist-login';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? ((await res.json()) as { token?: string; user?: { id: string; name: string; email: string; role: 'user' | 'artist'; artist_id?: string }; error?: string })
        : {};

      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Invalid email or password. Please try again.');

      setAuth(data.token!, data.user!);
      navigate(mode === 'artist' ? '/artist-dashboard' : returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center mb-2">
            {mode === 'signup' ? 'Create Account' : mode === 'artist' ? 'Artist Sign In' : 'Sign In'}
          </h1>

          {/* Mode tabs */}
          <div role="tablist" className="tabs tabs-bordered mb-4">
            <button role="tab" className={`tab ${mode === 'login' ? 'tab-active' : ''}`} onClick={() => setMode('login')}>Client</button>
            <button role="tab" className={`tab ${mode === 'signup' ? 'tab-active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
            <button role="tab" className={`tab ${mode === 'artist' ? 'tab-active' : ''}`} onClick={() => setMode('artist')}>Artist</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-20">Name</span>
                <input type="text" className="grow" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </label>
            )}
            <div>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-20">Email</span>
                <input
                  type="email"
                  className="grow"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailError(validateEmail(email))}
                  required
                  autoComplete="email"
                />
              </label>
              {emailError && <p className="text-error text-sm mt-2">{emailError}</p>}
            </div>
            <label className="input input-bordered flex items-center gap-2">
              <span className="label w-20">Password</span>
              <input type="password" className="grow" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </label>

            {error && <div className="alert alert-error py-2 text-sm">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {mode !== 'artist' && (
            <>
              <div className="divider text-xs text-base-content/40">or</div>
              <button
                type="button"
                className="btn btn-outline w-full gap-2"
                onClick={handleGoogleLogin}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {mode === 'login' && (
            <p className="text-center text-sm mt-2 text-base-content/60">
              No account?{' '}
              <button className="link link-primary" onClick={() => setMode('signup')}>Sign up free</button>
            </p>
          )}

          {mode !== 'login' && (
            <p className="text-center text-sm mt-2 text-base-content/60">
              Already have an account?{' '}
              <button className="link link-primary" onClick={() => setMode('login')}>Sign in</button>
            </p>
          )}

          {mode === 'artist' && (
            <p className="text-center text-xs mt-2 text-base-content/40">
              Artist accounts are created by the admin.{' '}
              <Link to="/contact" className="link">Contact us</Link> to get set up.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
