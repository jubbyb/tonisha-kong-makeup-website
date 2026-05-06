import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function BottomTabBar({ user }: { user: { role: string } | null }) {
  const location = useLocation();
  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const tabs = [
    {
      to: '/',
      label: 'Explore',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      to: '/artists',
      label: 'Artists',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      to: '/my-bookings',
      label: 'Bookings',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      to: '/contact',
      label: 'Contact',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: user ? '/profile' : '/login',
      label: user ? 'Profile' : 'Login',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mobile-tab-bar">
      {tabs.map(({ to, label, icon }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              flex: 1,
              padding: '0.5rem 0',
              color: active ? 'var(--tk-gold)' : 'var(--tk-text-faint)',
              transition: 'color 0.15s',
            }}
          >
            {icon}
            <span
              style={{
                fontSize: '0.5rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/');
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
            fontFamily: "'Instrument Serif', serif",
            fontSize: '1.375rem',
            lineHeight: 1,
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'baseline',
            color: 'var(--tk-text)',
          }}
        >
          <span style={{ fontStyle: 'italic' }}>Style</span>
          <span style={{ color: 'var(--tk-gold)', fontStyle: 'italic' }}>ja</span>
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '99px',
              background: 'var(--tk-gold)',
              marginLeft: '2px',
              alignSelf: 'flex-end',
              marginBottom: '3px',
              display: 'inline-block',
            }}
          />
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
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--tk-text)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--tk-text-muted)')}
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
                <Link to="/artist-dashboard" style={authLinkStyle}>
                  Dashboard
                </Link>
              )}
              <Link to="/my-bookings" style={authLinkStyle}>
                My Bookings
              </Link>
              <Link to="/profile" style={authLinkStyle}>
                Profile
              </Link>
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
              <Link to="/login" style={authLinkStyle}>
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

        {/* Mobile right: theme toggle only (hamburger replaced by bottom tab bar) */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          className="mobile-controls"
        >
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
        </div>
      </div>

      <BottomTabBar user={user} />

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
