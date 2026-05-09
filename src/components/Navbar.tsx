import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './ui';

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

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function ProfileIcon() {
  return (
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
    user?.role === 'artist'
      ? {
          to: '/artist-dashboard',
          label: 'Dashboard',
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
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          ),
        }
      : {
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
  ];

  const tabItemStyle = (active: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '3px',
    textDecoration: 'none',
    flex: 1,
    padding: '0.5rem 0',
    color: active ? 'var(--accent)' : 'var(--ink-3)',
    transition: 'color 0.15s',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const tabLabelStyle = {
    fontSize: '0.5rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    lineHeight: 1,
  };

  return (
    <>
      <div className="mobile-tab-bar">
        {tabs.map(({ to, label, icon }) => {
          const active = isActive(to);
          return (
            <Link key={to} to={to} style={tabItemStyle(active)}>
              {icon}
              <span style={tabLabelStyle}>{label}</span>
            </Link>
          );
        })}
        {user ? (
          <Link to="/profile" style={tabItemStyle(location.pathname.startsWith('/profile'))}>
            <ProfileIcon />
            <span style={tabLabelStyle}>Profile</span>
          </Link>
        ) : (
          <Link to="/login" style={tabItemStyle(location.pathname.startsWith('/login'))}>
            <ProfileIcon />
            <span style={tabLabelStyle}>Login</span>
          </Link>
        )}
      </div>
    </>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const navLinks = [
    { to: '/artists', label: 'Browse' },
    { to: '/about', label: 'How it works' },
    { to: '/industries', label: 'For pros' },
    { to: '/classes', label: 'Stories' },
  ];

  const linkStyle = {
    fontSize: '0.72rem',
    fontWeight: 400,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-2)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  };

  const authLinkStyle = {
    fontSize: '0.72rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-2)',
    textDecoration: 'none',
  };

  return (
    <nav className="editorial-nav">
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
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={22} />
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
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--ink)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--ink-2)')}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right: theme toggle + auth (≥1024px) */}
        <div
          style={{ display: 'none', gap: '1.5rem', alignItems: 'center' }}
          className="desktop-auth"
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'styleja' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent)',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.65')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            {theme === 'styleja' ? <SunIcon /> : <MoonIcon />}
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
                className="btn-accent"
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
                className="btn-accent"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.65rem' }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Tablet/small-laptop hamburger (768–1023px): theme toggle + hamburger */}
        <div
          ref={menuRef}
          style={{ display: 'none', gap: '0.5rem', alignItems: 'center', position: 'relative' }}
          className="desktop-hamburger"
        >
          <button
            onClick={toggleTheme}
            aria-label={theme === 'styleja' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent)',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'styleja' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink)',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>

          {menuOpen && (
            <div className="desktop-dropdown" role="menu">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="desktop-dropdown-item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="desktop-dropdown-divider" />
              {user ? (
                <>
                  {user.role === 'artist' && (
                    <Link
                      to="/artist-dashboard"
                      className="desktop-dropdown-item"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/my-bookings"
                    className="desktop-dropdown-item"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    to="/profile"
                    className="desktop-dropdown-item"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="desktop-dropdown-item desktop-dropdown-signout"
                    role="menuitem"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="desktop-dropdown-item"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="desktop-dropdown-item desktop-dropdown-signup"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile right: theme toggle only (≤767px) */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          className="mobile-controls"
        >
          <button
            onClick={toggleTheme}
            aria-label={theme === 'styleja' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent)',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'styleja' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      <BottomTabBar user={user} />

      <style>{`
        @media (min-width: 768px) and (max-width: 1023px) {
          .desktop-hamburger { display: flex !important; }
          .mobile-controls { display: none !important; }
        }
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .desktop-auth { display: flex !important; }
          .mobile-controls { display: none !important; }
        }

        .desktop-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 220px;
          background: var(--bg);
          border: 1px solid var(--line);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
          padding: 0.5rem 0;
          z-index: 60;
          animation: tk-dropdown-in 0.15s ease-out;
        }
        @keyframes tk-dropdown-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .desktop-dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.7rem 1.1rem;
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-2);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, color 0.15s;
        }
        .desktop-dropdown-item:hover {
          background: color-mix(in srgb, var(--ink) 6%, transparent);
          color: var(--ink);
        }
        .desktop-dropdown-divider {
          height: 1px;
          background: var(--line);
          margin: 0.4rem 0;
        }
        .desktop-dropdown-signout,
        .desktop-dropdown-signup {
          color: var(--accent);
        }

        .mobile-sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 70;
          animation: tk-fade-in 0.15s ease-out;
        }
        .mobile-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg);
          border-top: 1px solid var(--line);
          padding: 0.5rem 0 calc(72px + env(safe-area-inset-bottom, 0)) 0;
          z-index: 71;
          animation: tk-sheet-in 0.2s ease-out;
        }
        @keyframes tk-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tk-sheet-in {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .mobile-sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--line);
        }
        .mobile-sheet-title {
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .mobile-sheet-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--ink-2);
          padding: 0.3rem;
          display: flex;
          align-items: center;
        }
        .mobile-sheet-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 1rem 1.25rem;
          font-size: 0.78rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .mobile-sheet-item + .mobile-sheet-item {
          border-top: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
        }
        .mobile-sheet-signout {
          color: var(--accent);
        }
      `}</style>
    </nav>
  );
}
