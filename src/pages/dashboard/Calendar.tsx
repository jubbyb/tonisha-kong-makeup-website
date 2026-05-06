import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { Booking } from './types';
import { STATUS_BADGE } from './types';

// ─── Calendar tab — Day / Week / Month / List views ───────────────────────────

type CalView = 'day' | 'week' | 'month' | 'list';

const GRID_START = 8;
const GRID_END = 21;
const HOUR_HEIGHT = 64; // px per hour
const HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i);

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'var(--accent)',
  pending: 'oklch(75% 0.15 80)',
  cancelled: 'var(--ink-3)',
  completed: 'oklch(55% 0.08 250)',
};

// ── date helpers ──────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // Mon=0
  return addDays(d, -day);
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatHour(h: number): string {
  return h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`;
}
function formatTime(t: string): string {
  const [hStr, m] = t.split(':');
  const h = parseInt(hStr);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 || 12;
  return `${h12}:${m}${suffix}`;
}
function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function bookingTop(startTime: string): number {
  return ((timeToMin(startTime) - GRID_START * 60) / 60) * HOUR_HEIGHT;
}
function bookingHeight(start: string, end: string): number {
  return Math.max(((timeToMin(end) - timeToMin(start)) / 60) * HOUR_HEIGHT, 24);
}
function shift(d: Date, view: CalView, delta: number): Date {
  if (view === 'day') return addDays(d, delta);
  if (view === 'week') return addDays(d, delta * 7);
  if (view === 'month') return addMonths(d, delta);
  return d;
}
function periodLabel(d: Date, view: CalView): string {
  if (view === 'day') {
    return d.toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (view === 'week') {
    const mon = startOfWeek(d);
    const sun = addDays(mon, 6);
    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()} – ${sun.getDate()} ${mon.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`;
    }
    return `${mon.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
}

// ── sub-components defined outside Calendar to avoid remount on each render ──

function TimeAxis() {
  return (
    <div style={{ position: 'relative', height: (GRID_END - GRID_START) * HOUR_HEIGHT }}>
      {HOURS.map((h) => (
        <div
          key={h}
          style={{
            position: 'absolute',
            top: (h - GRID_START) * HOUR_HEIGHT - 9,
            right: 0,
            fontSize: '0.6rem',
            letterSpacing: '0.05em',
            color: 'var(--ink-3)',
            paddingRight: '6px',
            lineHeight: 1,
          }}
        >
          {formatHour(h)}
        </div>
      ))}
    </div>
  );
}

function HourLines() {
  return (
    <>
      {HOURS.map((h) => (
        <div
          key={h}
          style={{
            position: 'absolute',
            top: (h - GRID_START) * HOUR_HEIGHT,
            left: 0,
            right: 0,
            borderTop: '1px solid var(--line)',
            opacity: 0.45,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

interface BookingBlockProps {
  b: Booking;
  style?: React.CSSProperties;
  onClick: (b: Booking) => void;
}
function BookingBlock({ b, style, onClick }: BookingBlockProps) {
  const color = STATUS_COLOR[b.status] ?? 'var(--ink-3)';
  return (
    <div
      onClick={() => onClick(b)}
      style={{
        background: color,
        opacity: b.status === 'cancelled' ? 0.45 : 0.92,
        borderRadius: '3px',
        padding: '3px 6px',
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {b.name}
      </div>
      {b.start_time && (
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>
          {formatTime(b.start_time)}
          {b.end_time ? ` – ${formatTime(b.end_time)}` : ''}
        </div>
      )}
      <div
        style={{
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.7)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {b.service}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Calendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Booking | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    if (window.innerWidth < 640) setView('day');
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    apiFetch<Booking[]>('/api/artist/bookings')
      .then((d) => {
        setBookings(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await apiFetch(`/api/artist/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    setSelected((s) => (s?.id === id ? { ...s, status } : s));
  };

  const openPanel = (b: Booking) => {
    setSelected(b);
    setPanelOpen(true);
  };
  const closePanel = () => setPanelOpen(false);

  // ── Day view ──────────────────────────────────────────────────────────────
  const renderDay = () => {
    const dateStr = toDateStr(currentDate);
    const timed = bookings.filter((b) => b.date === dateStr && b.start_time);
    const untimed = bookings.filter((b) => b.date === dateStr && !b.start_time);

    return (
      <div>
        {untimed.length > 0 && (
          <div style={{ marginBottom: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {untimed.map((b) => (
              <button
                key={b.id}
                onClick={() => openPanel(b)}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  background: STATUS_COLOR[b.status] ?? 'var(--ink-3)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                {b.name} · {b.service}
              </button>
            ))}
          </div>
        )}
        <div
          style={{
            overflowY: 'auto',
            maxHeight: '70vh',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr' }}>
            <div
              style={{
                position: 'relative',
                borderRight: '1px solid var(--line)',
                background: 'var(--bg-card)',
              }}
            >
              <TimeAxis />
            </div>
            <div
              style={{
                position: 'relative',
                height: (GRID_END - GRID_START) * HOUR_HEIGHT,
                background: 'var(--bg)',
              }}
            >
              <HourLines />
              {timed.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--ink-3)',
                  }}
                >
                  No bookings scheduled
                </div>
              )}
              {timed.map((b) => (
                <BookingBlock
                  key={b.id}
                  b={b}
                  onClick={openPanel}
                  style={{
                    position: 'absolute',
                    top: bookingTop(b.start_time!),
                    left: '4px',
                    right: '4px',
                    height: b.end_time ? bookingHeight(b.start_time!, b.end_time) : 40,
                    zIndex: 1,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Week view ─────────────────────────────────────────────────────────────
  const renderWeek = () => {
    const mon = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    const today = new Date();

    return (
      <div style={{ overflowX: 'auto', border: '1px solid var(--line)' }}>
        <div style={{ minWidth: '640px' }}>
          {/* Day headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '48px repeat(7, 1fr)',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div style={{ background: 'var(--bg-card)' }} />
            {days.map((d, i) => {
              const isToday = isSameDay(d, today);
              return (
                <div
                  key={i}
                  style={{
                    padding: '8px 4px',
                    textAlign: 'center',
                    background: isToday ? 'color-mix(in oklch, var(--accent) 8%, transparent)' : 'var(--bg-card)',
                    borderLeft: '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: isToday ? 'var(--accent)' : 'var(--ink-3)',
                    }}
                  >
                    {d.toLocaleDateString('default', { weekday: 'short' })}
                  </div>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'var(--accent)' : 'var(--ink)',
                      lineHeight: 1.2,
                    }}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 60px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)' }}>
              {/* Time axis column */}
              <div
                style={{
                  position: 'relative',
                  borderRight: '1px solid var(--line)',
                  background: 'var(--bg-card)',
                  height: (GRID_END - GRID_START) * HOUR_HEIGHT,
                }}
              >
                <TimeAxis />
              </div>

              {/* Day columns */}
              {days.map((d, i) => {
                const dateStr = toDateStr(d);
                const dayBookings = bookings.filter((b) => b.date === dateStr && b.start_time);
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      height: (GRID_END - GRID_START) * HOUR_HEIGHT,
                      borderLeft: '1px solid var(--line)',
                      background: isToday
                        ? 'color-mix(in oklch, var(--accent) 4%, transparent)'
                        : 'var(--bg)',
                    }}
                  >
                    <HourLines />
                    {dayBookings.map((b) => (
                      <BookingBlock
                        key={b.id}
                        b={b}
                        onClick={openPanel}
                        style={{
                          position: 'absolute',
                          top: bookingTop(b.start_time!),
                          left: '2px',
                          right: '2px',
                          height: b.end_time ? bookingHeight(b.start_time!, b.end_time) : 36,
                          zIndex: 1,
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Month view ────────────────────────────────────────────────────────────
  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const gridStart = startOfWeek(firstDay);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const today = new Date();
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div style={{ border: '1px solid var(--line)' }}>
        {/* Day labels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-card)',
          }}
        >
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              style={{
                padding: '8px 0',
                textAlign: 'center',
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === month;
            const isToday = isSameDay(d, today);
            const dateStr = toDateStr(d);
            const dayBookings = bookings.filter((b) => b.date === dateStr);
            const shown = dayBookings.slice(0, 3);
            const more = dayBookings.length - shown.length;

            return (
              <div
                key={i}
                onClick={() => {
                  setCurrentDate(d);
                  setView('day');
                }}
                style={{
                  minHeight: '90px',
                  padding: '4px 6px',
                  borderTop: i >= 7 ? '1px solid var(--line)' : undefined,
                  borderLeft: i % 7 !== 0 ? '1px solid var(--line)' : undefined,
                  background: isToday
                    ? 'color-mix(in oklch, var(--accent) 6%, transparent)'
                    : 'var(--bg)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isToday) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                }}
                onMouseLeave={(e) => {
                  if (!isToday) (e.currentTarget as HTMLElement).style.background = 'var(--bg)';
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? 'var(--accent)' : inMonth ? 'var(--ink)' : 'var(--ink-3)',
                    marginBottom: '4px',
                    lineHeight: 1,
                  }}
                >
                  {d.getDate()}
                </div>
                {shown.map((b) => (
                  <div
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openPanel(b);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      marginBottom: '2px',
                      fontSize: '0.65rem',
                      lineHeight: 1.2,
                      color: '#fff',
                      background: STATUS_COLOR[b.status] ?? 'var(--ink-3)',
                      opacity: b.status === 'cancelled' ? 0.5 : 0.9,
                      borderRadius: '2px',
                      padding: '1px 4px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                    }}
                  >
                    {b.start_time && (
                      <span style={{ opacity: 0.8, flexShrink: 0 }}>{formatTime(b.start_time)}</span>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                  </div>
                ))}
                {more > 0 && (
                  <div style={{ fontSize: '0.6rem', color: 'var(--ink-3)', paddingLeft: '2px' }}>
                    +{more} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── List view (existing table) ────────────────────────────────────────────
  const renderList = () => {
    const filtered =
      filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

    return (
      <div className="space-y-4">
        <div className="flex gap-1 flex-wrap">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((s) => (
            <button
              key={s}
              className="btn btn-xs capitalize"
              style={
                filter === s
                  ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                  : { background: 'transparent', borderColor: 'var(--line)', color: 'var(--ink-2)' }
              }
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            className="text-center text-sm py-12 border"
            style={{ color: 'var(--ink-3)', borderColor: 'var(--line)' }}
          >
            No bookings found.
          </div>
        ) : (
          <div className="overflow-x-auto border" style={{ borderColor: 'var(--line)' }}>
            <table className="table table-zebra w-full">
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  {['Client', 'Service', 'Date / Time', 'Message', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="eyebrow" style={{ color: 'var(--ink-3)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openPanel(b)}
                  >
                    <td>
                      <div className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
                        {b.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--ink-3)' }}>
                        {b.email}
                      </div>
                      {b.phone && (
                        <div className="text-xs" style={{ color: 'var(--ink-3)' }}>
                          {b.phone}
                        </div>
                      )}
                    </td>
                    <td className="text-sm">{b.service}</td>
                    <td className="whitespace-nowrap text-sm">
                      <div>
                        {new Date(b.date + 'T00:00').toLocaleDateString('default', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      {b.start_time && b.end_time && (
                        <div style={{ color: 'var(--ink-3)' }}>
                          {b.start_time} – {b.end_time}
                        </div>
                      )}
                    </td>
                    <td className="max-w-xs text-sm truncate" style={{ color: 'var(--ink-2)' }}>
                      {b.message ?? '—'}
                    </td>
                    <td>
                      <span className={`badge capitalize ${STATUS_BADGE[b.status] ?? 'badge-ghost'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 flex-wrap">
                        {b.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => updateStatus(b.id, 'confirmed')}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => updateStatus(b.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <>
                            <button
                              className="btn btn-info btn-xs"
                              onClick={() => updateStatus(b.id, 'completed')}
                            >
                              Complete
                            </button>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => updateStatus(b.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  const views: CalView[] = isMobile
    ? ['day', 'month', 'list']
    : ['day', 'week', 'month', 'list'];

  return (
    <div className="space-y-5">
      {/* ── header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Nav + period label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setCurrentDate((d) => shift(d, view, -1))}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              borderRadius: 2,
              fontSize: '1.1rem',
            }}
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentDate((d) => shift(d, view, 1))}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              borderRadius: 2,
              fontSize: '1.1rem',
            }}
          >
            ›
          </button>
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 500,
              color: 'var(--ink)',
              minWidth: '140px',
            }}
          >
            {view === 'list' ? 'All Bookings' : periodLabel(currentDate, view)}
          </span>
          {view !== 'list' && (
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--ink-3)',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              Today
            </button>
          )}
        </div>

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            border: '1px solid var(--line)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '4px 14px',
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                textTransform: 'capitalize',
                border: 'none',
                borderLeft: v !== views[0] ? '1px solid var(--line)' : 'none',
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? '#fff' : 'var(--ink-2)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── view content ── */}
      {view === 'day' && renderDay()}
      {view === 'week' && renderWeek()}
      {view === 'month' && renderMonth()}
      {view === 'list' && renderList()}

      {/* ── backdrop ── */}
      {panelOpen && (
        <div
          onClick={closePanel}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.35)',
          }}
        />
      )}

      {/* ── detail panel ── */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '360px',
          maxWidth: '100vw',
          zIndex: 50,
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--line)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {selected && (
          <>
            {/* Panel header */}
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <p className="eyebrow" style={{ color: 'var(--ink-3)', marginBottom: '0.3rem' }}>
                  Appointment
                </p>
                <h3
                  className="font-display"
                  style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.1 }}
                >
                  {selected.name}
                </h3>
              </div>
              <button
                onClick={closePanel}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-3)',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                  padding: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}
              >
                ✕
              </button>
            </div>

            {/* Status */}
            <div style={{ padding: '1rem 1.5rem 0' }}>
              <span className={`badge capitalize ${STATUS_BADGE[selected.status] ?? 'badge-ghost'}`}>
                {selected.status}
              </span>
            </div>

            {/* Details */}
            <div
              style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem',
                flex: 1,
              }}
            >
              <div>
                <p className="eyebrow" style={{ color: 'var(--ink-3)', marginBottom: '0.3rem' }}>
                  Contact
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{selected.email}</p>
                {selected.phone && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)' }}>{selected.phone}</p>
                )}
              </div>

              <div>
                <p className="eyebrow" style={{ color: 'var(--ink-3)', marginBottom: '0.3rem' }}>
                  Service
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 500 }}>
                  {selected.service}
                </p>
              </div>

              <div>
                <p className="eyebrow" style={{ color: 'var(--ink-3)', marginBottom: '0.3rem' }}>
                  When
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                  {new Date(selected.date + 'T00:00').toLocaleDateString('default', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {selected.start_time && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)' }}>
                    {formatTime(selected.start_time)}
                    {selected.end_time ? ` – ${formatTime(selected.end_time)}` : ''}
                  </p>
                )}
              </div>

              {selected.message && (
                <div>
                  <p className="eyebrow" style={{ color: 'var(--ink-3)', marginBottom: '0.3rem' }}>
                    Note
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.65 }}>
                    {selected.message}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div
              style={{
                padding: '1.5rem',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {selected.status === 'pending' && (
                <>
                  <button
                    className="btn btn-success btn-sm w-full"
                    onClick={() => updateStatus(selected.id, 'confirmed')}
                  >
                    Confirm Booking
                  </button>
                  <button
                    className="btn btn-error btn-outline btn-sm w-full"
                    onClick={() => updateStatus(selected.id, 'cancelled')}
                  >
                    Cancel
                  </button>
                </>
              )}
              {selected.status === 'confirmed' && (
                <>
                  <button
                    className="btn btn-info btn-sm w-full"
                    onClick={() => updateStatus(selected.id, 'completed')}
                  >
                    Mark Complete
                  </button>
                  <button
                    className="btn btn-error btn-outline btn-sm w-full"
                    onClick={() => updateStatus(selected.id, 'cancelled')}
                  >
                    Cancel
                  </button>
                </>
              )}
              {(selected.status === 'cancelled' || selected.status === 'completed') && (
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-3)', textAlign: 'center' }}>
                  No actions available
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
