import { useEffect, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  { id: 'clients', label: 'Clients', eyebrow: 'CRM' },
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
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as TabId) || 'today';
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const setTab = (tab: TabId) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const node = tabRefs.current[activeTab];
    if (node) {
      node.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      {/* ── Tab navigation ── */}
      <nav
        className="sticky top-0 z-20 border-b"
        style={{
          background: 'var(--bg)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ul className="flex items-end gap-1 overflow-x-auto flex-nowrap scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className="shrink-0">
                  <button
                    ref={(el) => {
                      tabRefs.current[tab.id] = el;
                    }}
                    onClick={() => setTab(tab.id)}
                    className="relative flex flex-col items-center px-4 py-3 transition-colors focus-visible:outline-none whitespace-nowrap"
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
