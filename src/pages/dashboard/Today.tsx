import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { Booking } from './types';
import { STATUS_BADGE } from './types';

// ─── Today tab — schedule strip + KPI cards + earnings stub ──────────────────

export default function Today() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Booking[]>('/api/artist/bookings')
      .then((d) => {
        setBookings(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings
    .filter((b) => b.date === todayStr)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

  const pending = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const upcomingCount = bookings.filter(
    (b) => b.date >= todayStr && b.status !== 'cancelled',
  ).length;

  return (
    <div className="space-y-8">
      {/* ── eyebrow ── */}
      <div>
        <p className="eyebrow" style={{ color: 'var(--ink-3)' }}>
          {new Date().toLocaleDateString('default', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <h2 className="text-3xl font-display font-semibold" style={{ color: 'var(--ink)' }}>
          Today's Overview
        </h2>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: todayBookings.length, note: 'appointments' },
          { label: 'Pending', value: pending, note: 'need action' },
          { label: 'Upcoming', value: upcomingCount, note: 'inc. today' },
          { label: 'Completed', value: completed, note: 'all time' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 border"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--line)',
            }}
          >
            <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
              {kpi.label}
            </p>
            <p className="text-4xl font-display font-semibold" style={{ color: 'var(--ink)' }}>
              {kpi.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {kpi.note}
            </p>
          </div>
        ))}
      </div>

      {/* ── Earnings stub ── */}
      <div
        className="p-5 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
      >
        <p className="eyebrow mb-3" style={{ color: 'var(--ink-3)' }}>
          Earnings Chart
        </p>
        <div
          className="h-24 flex items-center justify-center border border-dashed text-sm"
          style={{ borderColor: 'var(--line-2)', color: 'var(--ink-3)' }}
        >
          Revenue chart — coming soon
        </div>
      </div>

      {/* ── Today's schedule ── */}
      <div>
        <p className="eyebrow mb-3" style={{ color: 'var(--ink-3)' }}>
          Today's Schedule
        </p>
        {todayBookings.length === 0 ? (
          <p
            className="text-sm py-8 text-center border"
            style={{ color: 'var(--ink-3)', borderColor: 'var(--line)' }}
          >
            No appointments today — enjoy the free time.
          </p>
        ) : (
          <ul className="space-y-2">
            {todayBookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-4 p-4 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
              >
                <div
                  className="text-sm font-mono w-24 shrink-0"
                  style={{ color: 'var(--ink-3)' }}
                >
                  {b.start_time ?? '—'}
                  {b.end_time ? ` – ${b.end_time}` : ''}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
                    {b.service}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                    {b.name} · {b.email}
                  </p>
                </div>
                <span
                  className={`badge capitalize shrink-0 ${STATUS_BADGE[b.status] ?? 'badge-ghost'}`}
                >
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Pending actions banner ── */}
      {pending > 0 && (
        <div
          className="flex items-center gap-3 p-4 border text-sm"
          style={{
            background: 'var(--warm)',
            borderColor: 'var(--accent)',
            color: 'var(--ink)',
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: 'var(--accent)' }}
          />
          You have {pending} pending booking{pending !== 1 ? 's' : ''} waiting for confirmation.
          Switch to the <strong className="mx-1">Calendar</strong> tab to review them.
        </div>
      )}

      {/* ── Upcoming confirmed bookings ── */}
      {confirmed > 0 && (
        <div>
          <p className="eyebrow mb-3" style={{ color: 'var(--ink-3)' }}>
            Upcoming Confirmed
          </p>
          <ul className="space-y-2">
            {bookings
              .filter((b) => b.status === 'confirmed' && b.date >= todayStr)
              .slice(0, 5)
              .map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-4 p-3 border text-sm"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
                >
                  <div
                    className="w-20 shrink-0 font-mono"
                    style={{ color: 'var(--ink-3)' }}
                  >
                    {new Date(b.date + 'T00:00').toLocaleDateString('default', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium" style={{ color: 'var(--ink)' }}>
                      {b.service}
                    </span>
                    <span className="ml-2" style={{ color: 'var(--ink-3)' }}>
                      · {b.name}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
