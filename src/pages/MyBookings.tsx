import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Eyebrow } from '../components/ui';

interface Booking {
  id: number;
  service: string;
  date: string;
  status: string;
  message: string | null;
  created_at: string;
  artist_name: string | null;
  artist_photo: string | null;
  artist_slug: string | null;
  whatsapp_number: string | null;
  email: string | null;
  start_time: string | null;
  end_time: string | null;
}

type Tab = 'upcoming' | 'past' | 'cancelled';

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--color-warning)',
  confirmed: 'var(--color-success)',
  cancelled: 'var(--color-error)',
  completed: 'var(--ink-3)',
};

const STATUS_BG: Record<string, string> = {
  pending: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
  confirmed: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
  cancelled: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
  completed: 'var(--bg-card)',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-JM', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');

  const fetchBookings = () => {
    apiFetch<Booking[]>('/api/bookings/mine')
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await apiFetch(`/api/bookings/mine/${id}/cancel`, { method: 'POST' });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(null);
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
          background: 'var(--bg)',
        }}
      >
        <span className="loading loading-spinner loading-lg" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          color: 'var(--color-error)',
          background: 'var(--bg)',
        }}
      >
        {error}
      </div>
    );
  }

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.date) >= now,
  );
  const past = bookings.filter(
    (b) => b.status === 'completed' || (b.status !== 'cancelled' && new Date(b.date) < now),
  );
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  const tabItems: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { key: 'past', label: 'Past', count: past.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  const visibleBookings: Record<Tab, Booking[]> = {
    upcoming,
    past,
    cancelled,
  };

  const BookingCard = ({ b }: { b: Booking }) => {
    const statusColor = STATUS_COLOR[b.status] ?? 'var(--ink-3)';
    const statusBg = STATUS_BG[b.status] ?? 'var(--bg-card)';
    const canCancel = b.status === 'pending' && new Date(b.date) >= now;

    const contactHref = b.whatsapp_number
      ? `https://wa.me/${b.whatsapp_number.replace(/\D/g, '')}`
      : b.email
        ? `mailto:${b.email}`
        : null;

    return (
      <article
        className="editorial-card-base"
        style={{
          padding: '2rem',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: statusColor,
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: service + artist */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>
              {formatDate(b.date)}
              {b.start_time && b.end_time && ` · ${b.start_time}–${b.end_time}`}
            </Eyebrow>

            <h3
              className="font-editorial"
              style={{
                fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: '0.4rem',
                lineHeight: 1.2,
              }}
            >
              {b.service}
            </h3>

            {b.artist_name && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--ink-3)',
                  fontStyle: 'italic',
                }}
              >
                with {b.artist_name}
              </p>
            )}

            {b.message && (
              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--ink-3)',
                  fontStyle: 'italic',
                  borderLeft: '2px solid var(--line-2)',
                  paddingLeft: '0.75rem',
                }}
              >
                "{b.message}"
              </p>
            )}
          </div>

          {/* Right: status + actions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.75rem',
              flexShrink: 0,
            }}
          >
            {/* Status badge */}
            <span
              className="eyebrow"
              style={{
                padding: '4px 12px',
                background: statusBg,
                color: statusColor,
                border: `1px solid ${statusColor}`,
                fontSize: '10px',
                letterSpacing: '0.14em',
              }}
            >
              {b.status}
            </span>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              {contactHref && (
                <a
                  href={contactHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '6px 14px',
                    border: '1px solid var(--line-2)',
                    color: 'var(--ink-2)',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                >
                  {b.whatsapp_number ? 'WhatsApp' : 'Email'} pro
                </a>
              )}
              {canCancel && (
                <button
                  onClick={() => handleCancel(b.id)}
                  disabled={cancelling === b.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 14px',
                    border: '1px solid var(--color-error)',
                    color: 'var(--color-error)',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    cursor: cancelling === b.id ? 'not-allowed' : 'pointer',
                    opacity: cancelling === b.id ? 0.5 : 1,
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {cancelling === b.id ? '...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '80vh' }}>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid var(--line-2)',
          padding: '4rem 2rem 3rem',
          maxWidth: 860,
          margin: '0 auto',
        }}
      >
        <Eyebrow style={{ color: 'var(--accent)', marginBottom: '1rem' }}>My account</Eyebrow>
        <h1
          className="font-editorial"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 400,
            color: 'var(--ink)',
            lineHeight: 1.1,
          }}
        >
          Your appointments
        </h1>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p
              className="font-editorial"
              style={{
                fontSize: '1.6rem',
                fontStyle: 'italic',
                color: 'var(--ink-3)',
                marginBottom: '1.5rem',
              }}
            >
              No bookings yet.
            </p>
            <p style={{ color: 'var(--ink-3)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Discover Jamaica's best style professionals and book your first appointment.
            </p>
            <a href="/artists" className="btn-accent" style={{ textDecoration: 'none' }}>
              Browse artists
            </a>
          </div>
        ) : (
          <>
            {/* ── Tab toggle ───────────────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2.5rem',
                borderBottom: '1px solid var(--line-2)',
                paddingBottom: '0',
              }}
            >
              {tabItems.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                    color: tab === key ? 'var(--ink)' : 'var(--ink-3)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: tab === key ? 600 : 400,
                    transition: 'color 0.2s, border-color 0.2s',
                    position: 'relative',
                    top: 1,
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className="eyebrow"
                      style={{
                        marginLeft: '0.4rem',
                        fontSize: '9px',
                        padding: '1px 5px',
                        background: tab === key ? 'var(--accent)' : 'var(--line-2)',
                        color: tab === key ? '#fff' : 'var(--ink-3)',
                        borderRadius: 99,
                        transition: 'background 0.2s, color 0.2s',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Booking list ─────────────────────────────────────────── */}
            {visibleBookings[tab].length === 0 ? (
              <p
                className="font-editorial"
                style={{
                  fontStyle: 'italic',
                  color: 'var(--ink-3)',
                  textAlign: 'center',
                  padding: '3rem 0',
                }}
              >
                No {tab} bookings.
              </p>
            ) : (
              <div>
                {visibleBookings[tab].map((b) => (
                  <BookingCard key={b.id} b={b} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
