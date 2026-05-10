import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  background: 'var(--bg-elev)',
  border: '1px solid var(--line-2)',
  color: 'var(--ink)',
  fontSize: '0.85rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--ink-2)',
  marginBottom: '0.4rem',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    apiFetch<UserProfile>('/api/user/profile')
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone ?? '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await apiFetch<UserProfile>('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      setProfile(updated);
      setName(updated.name);
      setPhone(updated.phone ?? '');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <h1
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '0.5rem',
        }}
      >
        My Profile
      </h1>
      <p style={{ fontSize: '0.82rem', color: 'var(--ink-2)', marginBottom: '2.5rem' }}>
        Update your contact details. These are pre-filled when you book an appointment.
      </p>

      {/* ── quick nav ── */}
      <div
        style={{
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <Link to="/my-bookings" style={profileLinkStyle}>
          My Bookings
        </Link>
        {user?.role === 'artist' && (
          <Link to="/artist-dashboard" style={profileLinkStyle}>
            Dashboard
          </Link>
        )}
      </div>

      <form
        onSubmit={handleSave}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <div>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line-2)')}
          />
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={profile?.email ?? ''}
            readOnly
            style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-2)', marginTop: '0.35rem' }}>
            Email address cannot be changed.
          </p>
        </div>

        <div>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +1 555 123 4567"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line-2)')}
          />
        </div>

        {error && <p style={{ fontSize: '0.78rem', color: 'oklch(55% 0.2 25)' }}>{error}</p>}

        {saved && <p style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>Profile saved.</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="btn-accent"
          style={{ padding: '0.65rem 2rem', fontSize: '0.65rem', alignSelf: 'flex-start' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* ── sign out ── */}
      <div
        style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--line)',
        }}
      >
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            padding: '0.65rem 0',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            background: 'none',
            border: '1px solid var(--accent)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

const profileLinkStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-2)',
  textDecoration: 'none',
  padding: '0.35rem 0',
};
