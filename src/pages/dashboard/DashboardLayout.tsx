import type { ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { TabId } from './types';

// ─── Tab definitions ──────────────────────────────────────────────────────────

interface TabDef {
  id: TabId;
  label: string;
  eyebrow: string;
}

const TABS: TabDef[] = [
  { id: 'today', label: 'Today', eyebrow: 'Overview' },
  { id: 'calendar', label: 'Bookings', eyebrow: 'Calendar' },
  { id: 'services', label: 'Services', eyebrow: 'Catalog' },
  { id: 'hours', label: 'Hours', eyebrow: 'Availability' },
  { id: 'portfolio', label: 'Portfolio', eyebrow: 'Gallery' },
  { id: 'testimonials', label: 'Testimonials', eyebrow: 'Reviews' },
  { id: 'profile', label: 'Profile', eyebrow: 'Settings' },
];

// ─── DashboardLayout ──────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as TabId) || 'today';

  const setTab = (tab: TabId) => {
    setSearchParams({ tab });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: 'var(--bg-elev)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-14">
          {/* wordmark */}
          <span
            className="font-display font-semibold text-lg tracking-tight shrink-0"
            style={{ color: 'var(--ink)' }}
          >
            StyleJA
          </span>

          <span
            className="text-xs shrink-0"
            style={{ color: 'var(--line-2)' }}
          >
            /
          </span>

          <span
            className="eyebrow shrink-0"
            style={{ color: 'var(--ink-3)' }}
          >
            Dashboard
          </span>

          {/* spacer */}
          <div className="flex-1" />

          {/* avatar pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 border cursor-default select-none"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--line)',
            }}
          >
            <div
              className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'var(--accent)',
                color: '#fff',
              }}
            >
              {initials}
            </div>
            <span
              className="text-sm max-w-[120px] truncate hidden sm:block"
              style={{ color: 'var(--ink-2)' }}
            >
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs ml-1 hover:underline"
              style={{ color: 'var(--ink-3)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab navigation ── */}
      <nav
        className="border-b overflow-x-auto"
        style={{
          background: 'var(--bg)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ul className="flex items-end gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setTab(tab.id)}
                    className="relative flex flex-col items-center px-4 py-3 transition-colors focus-visible:outline-none"
                    style={{
                      color: isActive ? 'var(--ink)' : 'var(--ink-3)',
                    }}
                  >
                    <span
                      className="eyebrow mb-0.5 hidden sm:block"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--ink-3)' }}
                    >
                      {tab.eyebrow}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: isActive ? 'var(--ink)' : 'var(--ink-2)' }}
                    >
                      {tab.label}
                    </span>
                    {/* active underline */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
