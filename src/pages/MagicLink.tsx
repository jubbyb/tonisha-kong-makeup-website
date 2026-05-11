import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MagicLinkResponse {
  token: string;
  user: { id: string; name: string; email: string; role: 'user' | 'artist' };
  returnTo: string;
}

export default function MagicLink() {
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const returnTo = searchParams.get('returnTo') ?? '/my-bookings';
    if (!token) {
      setError('Missing sign-in token.');
      return;
    }
    const params = new URLSearchParams({ token, returnTo });
    fetch(`/api/auth/magic?${params.toString()}`)
      .then(async (res) => {
        const data = (await res.json()) as MagicLinkResponse | { error?: string };
        if (!res.ok) {
          throw new Error(('error' in data && data.error) || 'Sign-in link is invalid.');
        }
        const ok = data as MagicLinkResponse;
        setAuth(ok.token, ok.user);
        navigate(ok.returnTo || '/my-bookings', { replace: true });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not sign you in.');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-200 px-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center space-y-4">
            <h1 className="text-2xl font-bold">Sign-in link expired</h1>
            <p className="text-base-content/70">{error}</p>
            <p className="text-sm text-base-content/60">
              These links are single-use and expire after 48 hours. You can sign in with your email
              instead — we'll send you a fresh link via the password reset flow.
            </p>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="btn btn-primary w-full">
                Go to Sign In
              </Link>
              <Link to="/reset-password" className="btn btn-ghost w-full">
                Email me a new link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
}
