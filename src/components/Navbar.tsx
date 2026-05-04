import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BRAND } from '../constants/brand';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/industries', label: 'Industries' },
    { to: '/artists', label: 'Artists' },
    { to: '/services', label: 'Services' },
    { to: '/classes', label: 'Classes' },
    { to: '/contact', label: 'Contact' },
  ];

  const linkStyle = {
    fontSize: '0.72rem',
    fontWeight: 400,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--tk-text-muted)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  };

  const authLinkStyle = {
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: 'var(--tk-text-muted)',
    textDecoration: 'none',
  };

  return (
    <nav className="lux-nav">
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.35rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            color: 'var(--tk-gold)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          {BRAND.name}
        </Link>

        {/* Desktop links */}
        <div
          style={{ display: 'none', gap: '2.5rem', alignItems: 'center' }}
          className="desktop-nav"
        >
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={linkStyle}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = 'var(--tk-text)')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = 'var(--tk-text-muted)')
              }
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right: theme toggle + auth */}
        <div
          style={{ display: 'none', gap: '1.5rem', alignItems: 'center' }}
          className="desktop-auth"
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'luxury' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tk-gold)',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.65')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            {theme === 'luxury' ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <>
              {user.role === 'artist' && (
                <Link to="/artist-dashboard" style={authLinkStyle}>Dashboard</Link>
              )}
              <Link to="/my-bookings" style={authLinkStyle}>My Bookings</Link>
              <Link to="/profile" style={authLinkStyle}>Profile</Link>
              <button
                onClick={handleLogout}
                className="btn-gold"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.65rem' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={authLinkStyle}>Login</Link>
              <Link
                to="/login?mode=signup"
                className="btn-gold"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.65rem' }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile right: theme toggle + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="mobile-controls">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'luxury' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tk-gold)',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'luxury' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tk-gold)',
              padding: '0.5rem',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {menuOpen ? (
                <>
                  <line x1="3" y1="3" x2="19" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="19" y1="3" x2="3" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: 'var(--tk-bg)',
            borderTop: '1px solid var(--tk-border)',
            padding: '1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-muted)',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--tk-border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
            {user ? (
              <>
                {user.role === 'artist' && (
                  <Link
                    to="/artist-dashboard"
                    onClick={() => setMenuOpen(false)}
                    style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--tk-text-muted)', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/my-bookings"
                  onClick={() => setMenuOpen(false)}
                  style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--tk-text-muted)', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}
                >
                  My Bookings
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--tk-text-muted)', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-gold"
                  style={{ padding: '0.5rem 1.5rem', fontSize: '0.65rem' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--tk-text-muted)', textDecoration: 'none' }}
                >
                  Login
                </Link>
                <Link
                  to="/login?mode=signup"
                  onClick={() => setMenuOpen(false)}
                  className="btn-gold"
                  style={{ padding: '0.5rem 1.5rem', fontSize: '0.65rem' }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-auth { display: flex !important; }
          .mobile-controls { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
