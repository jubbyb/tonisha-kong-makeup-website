import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/artists', label: 'Artists' },
    { to: '/services', label: 'Services' },
    { to: '/classes', label: 'Classes' },
    { to: '/contact', label: 'Contact' },
  ];

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
            color: 'oklch(71% 0.11 78)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          Tonisha Kong
        </Link>

        {/* Desktop links */}
        <div
          style={{
            display: 'none',
            gap: '2.5rem',
            alignItems: 'center',
          }}
          className="desktop-nav"
        >
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                fontSize: '0.72rem',
                fontWeight: 400,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'oklch(65% 0.01 60)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = 'oklch(93% 0.01 75)')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = 'oklch(65% 0.01 60)')
              }
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div
          style={{
            display: 'none',
            gap: '1.5rem',
            alignItems: 'center',
          }}
          className="desktop-auth"
        >
          {user ? (
            <>
              {user.role === 'artist' ? (
                <Link
                  to="/artist-dashboard"
                  style={{
                    fontSize: '0.72rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'oklch(65% 0.01 60)',
                    textDecoration: 'none',
                  }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/my-bookings"
                  style={{
                    fontSize: '0.72rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'oklch(65% 0.01 60)',
                    textDecoration: 'none',
                  }}
                >
                  My Bookings
                </Link>
              )}
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
              <Link
                to="/login"
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'oklch(65% 0.01 60)',
                  textDecoration: 'none',
                }}
              >
                Login
              </Link>
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

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'oklch(71% 0.11 78)',
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

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: 'oklch(9% 0.005 60)',
            borderTop: '1px solid oklch(18% 0.005 60)',
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
                color: 'oklch(65% 0.01 60)',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid oklch(18% 0.005 60)', paddingTop: '1rem', marginTop: '0.25rem' }}>
            {user ? (
              <>
                {user.role === 'artist' ? (
                  <Link
                    to="/artist-dashboard"
                    onClick={() => setMenuOpen(false)}
                    style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(65% 0.01 60)', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/my-bookings"
                    onClick={() => setMenuOpen(false)}
                    style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(65% 0.01 60)', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}
                  >
                    My Bookings
                  </Link>
                )}
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
                  style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(65% 0.01 60)', textDecoration: 'none' }}
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
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
