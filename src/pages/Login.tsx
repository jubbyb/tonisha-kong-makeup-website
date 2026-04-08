import React, { useState } from 'react';
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

      const data = (await res.json()) as { token?: string; user?: { id: string; name: string; email: string; role: 'user' | 'artist'; artist_id?: string }; error?: string };

      if (!res.ok) throw new Error(data.error ?? 'Authentication failed');

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
