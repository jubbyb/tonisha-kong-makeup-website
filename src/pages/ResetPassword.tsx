import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Reset failed');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {token ? (
            <>
              <h1 className="text-2xl font-bold text-center mb-4">Set New Password</h1>
              {done ? (
                <div className="text-center space-y-4">
                  <p className="text-success">Your password has been updated.</p>
                  <Link to="/login" className="btn btn-primary w-full">
                    Sign In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="label w-28">New Password</span>
                    <input
                      type="password"
                      className="grow"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="label w-28">Confirm</span>
                    <input
                      type="password"
                      className="grow"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                  {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
                  <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                    {loading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">Forgot Password?</h1>
              <p className="text-center text-sm text-base-content/60 mb-4">
                Enter your email and we'll send you a reset link.
              </p>
              {done ? (
                <div className="text-center space-y-4">
                  <p className="text-base-content/80">
                    If that email is registered, you'll receive a reset link shortly.
                  </p>
                  <Link to="/login" className="btn btn-ghost w-full">
                    Back to Sign In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRequest} className="space-y-4">
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="label w-20">Email</span>
                    <input
                      type="email"
                      className="grow"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </label>
                  {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
                  <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                    {loading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                  <div className="text-center">
                    <Link to="/login" className="text-sm link link-primary">
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
