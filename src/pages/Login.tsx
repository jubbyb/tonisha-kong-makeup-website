import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/ui';

type Mode = 'login' | 'signup';

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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json')
        ? ((await res.json()) as {
            token?: string;
            user?: {
              id: string;
              name: string;
              email: string;
              role: 'user' | 'artist';
              artist_id?: string;
            };
            error?: string;
          })
        : {};

      if (!res.ok)
        throw new Error(
          (data as { error?: string }).error ?? 'Invalid email or password. Please try again.',
        );

      setAuth(data.token!, data.user!);
      const isArtist = data.user?.role === 'artist';
      const userDest = returnTo === '/' ? '/my-bookings' : returnTo;
      navigate(isArtist ? '/artist-dashboard' : userDest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        transition: 'background-color 0.35s ease',
      }}
    >
      {/* Background texture lines */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 79px, color-mix(in srgb, var(--line) 60%, transparent) 80px)',
          opacity: 0.4,
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          zIndex: 1,
        }}
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Logo size={32} />
        </div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line-2)',
            padding: 'clamp(2rem, 5vw, 3rem)',
            transition: 'background-color 0.35s ease, border-color 0.35s ease',
          }}
        >
          {/* Headline */}
          <h1
            className="font-editorial"
            style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--ink)',
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}
          >
            {mode === 'signup' ? 'Join StyleJA' : 'Welcome back'}
          </h1>

          <p
            style={{
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: '0.85rem',
              marginBottom: '2rem',
            }}
          >
            {mode === 'signup' ? 'Create your account to start booking' : 'Sign in to your account'}
          </p>

          {/* ── Mode toggle pills ───────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              marginBottom: '2rem',
              border: '1px solid var(--line-2)',
              overflow: 'hidden',
            }}
          >
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--ink-3)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background 0.25s, color 0.25s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* ── Form ───────────────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {mode === 'signup' && (
              <div>
                <label
                  className="eyebrow"
                  style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-3)' }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  className="input-editorial"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label
                className="eyebrow"
                style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-3)' }}
              >
                Email
              </label>
              <input
                type="email"
                className="input-editorial"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailError(validateEmail(email))}
                required
                autoComplete="email"
              />
              {emailError && (
                <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                className="eyebrow"
                style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-3)' }}
              >
                Password
              </label>
              <input
                type="password"
                className="input-editorial"
                placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: '-0.75rem' }}>
                <Link
                  to="/reset-password"
                  style={{
                    color: 'var(--ink-3)',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--line-2)',
                    paddingBottom: '1px',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-error)',
                  fontSize: '0.85rem',
                  background: 'color-mix(in srgb, var(--color-error) 8%, transparent)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-accent"
              style={{ width: '100%', marginTop: '0.25rem', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* ── Divider ────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              margin: '1.75rem 0',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
            <span className="eyebrow" style={{ color: 'var(--ink-3)' }}>
              or
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
          </div>

          {/* ── Google OAuth ────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              border: '1px solid var(--line-2)',
              background: 'transparent',
              color: 'var(--ink-2)',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'border-color 0.25s, color 0.25s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* ── Mode switch footer ──────────────────────────────────────── */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--ink-3)',
              marginTop: '1.5rem',
            }}
          >
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* ── Back to home ─────────────────────────────────────────────── */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link
            to="/"
            className="eyebrow"
            style={{
              color: 'var(--ink-3)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--line-2)',
              paddingBottom: '1px',
            }}
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
