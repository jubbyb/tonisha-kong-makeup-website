import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function decodeToken(token: string) {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return {
      id: String(payload.sub),
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'user' | 'artist',
    };
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const returnTo = searchParams.get('returnTo') ?? '/';
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const user = decodeToken(token);
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    setAuth(token, user);
    navigate(returnTo, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
}
