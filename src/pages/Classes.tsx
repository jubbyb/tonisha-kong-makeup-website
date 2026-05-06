import React, { useEffect, useState } from 'react';
import BookingFlow from '../components/BookingFlow';

interface ClassItem {
  id: number;
  name: string;
  description: string;
  date: string;
  price: number;
  certificate: number;
  mentoring: number;
  host_artist_id: number | null;
  host_name: string | null;
  total_slots: number;
  slots_remaining: number | null;
  duration_min: number;
}

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json() as Promise<ClassItem[]>)
      .then((data) => {
        setClasses(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load classes.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
        }}
      >
        Loading Classes...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--color-error)',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        transition: 'background-color 0.35s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '5rem 2rem 3rem',
        }}
      >
        <p
          className="anim-slide-right"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '1rem',
          }}
        >
          Learn the Craft
        </p>
        <h1
          className="anim-fade-up delay-1 font-display"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '1rem',
          }}
        >
          Master Classes
        </h1>
        <p
          className="anim-fade-up delay-2"
          style={{
            fontSize: '0.9rem',
            color: 'var(--ink-2)',
            maxWidth: '500px',
            lineHeight: 1.7,
          }}
        >
          Hands-on training sessions for aspiring makeup artists and beauty enthusiasts.
        </p>
      </div>

      {/* Classes grid */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2rem 2rem 6rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1px',
          background: 'var(--line-2)',
          border: '1px solid var(--line-2)',
        }}
      >
        {classes.map((classItem, i) => {
          const hasCertificate = !!classItem.certificate;
          const hasMentoring = !!classItem.mentoring;

          return (
            <div
              key={classItem.id}
              className={`anim-fade-up delay-${Math.min(i + 1, 8)}`}
              style={{
                background: 'var(--bg)',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg)')
              }
            >
              {/* Name + price */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    className="font-display"
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 400,
                      color: 'var(--ink)',
                      lineHeight: 1.15,
                    }}
                  >
                    {classItem.name}
                  </h2>
                  {classItem.host_name && (
                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--ink-2)',
                        marginTop: '0.25rem',
                        letterSpacing: '0.06em',
                      }}
                    >
                      with {classItem.host_name}
                    </p>
                  )}
                </div>
                <span
                  className="font-display"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 300,
                    color: 'var(--accent)',
                    marginLeft: '1rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ${classItem.price}
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: '30px', height: '1px', background: 'var(--line)' }} />

              {/* Description */}
              <p
                style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  color: 'var(--ink-2)',
                }}
              >
                {classItem.description}
              </p>

              {/* Date */}
              <p
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  color: 'var(--ink-3)',
                }}
              >
                {new Date(classItem.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {' · '}
                {new Date(classItem.date).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              {/* Slots remaining */}
              {classItem.slots_remaining !== null && (
                <p
                  style={{
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color:
                      classItem.slots_remaining <= 0
                        ? 'var(--color-error, #c0392b)'
                        : classItem.slots_remaining <= 3
                          ? 'var(--color-warning, #d97706)'
                          : 'var(--accent)',
                  }}
                >
                  {classItem.slots_remaining <= 0
                    ? 'Fully Booked'
                    : classItem.slots_remaining <= 3
                      ? `Only ${classItem.slots_remaining} spot${classItem.slots_remaining === 1 ? '' : 's'} left`
                      : `${classItem.slots_remaining} spots remaining`}
                </p>
              )}

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Feature active={true} label="Hands-on Training" />
                <Feature active={hasCertificate} label="Certificate Included" />
                <Feature active={hasMentoring} label="1-on-1 Mentoring" />
              </div>

              {/* CTA */}
              <button
                className="btn-accent"
                style={{
                  marginTop: '0.75rem',
                  alignSelf: 'flex-start',
                  opacity:
                    classItem.slots_remaining !== null && classItem.slots_remaining <= 0 ? 0.45 : 1,
                  cursor:
                    classItem.slots_remaining !== null && classItem.slots_remaining <= 0
                      ? 'not-allowed'
                      : 'pointer',
                }}
                disabled={classItem.slots_remaining !== null && classItem.slots_remaining <= 0}
                onClick={() => {
                  setSelectedClass(classItem);
                  setShowModal(true);
                }}
              >
                {classItem.slots_remaining !== null && classItem.slots_remaining <= 0
                  ? 'Fully Booked'
                  : 'Book Class'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'oklch(5% 0 0 / 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line-2)',
              padding: '2.5rem',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            className="anim-fade-up"
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-3)',
                fontSize: '1.2rem',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}
            >
              ✕
            </button>
            <BookingFlow
              preselectedService={selectedClass?.name}
              preselectedArtistId={selectedClass?.host_artist_id ?? undefined}
              classDatetime={selectedClass?.host_artist_id ? selectedClass.date : undefined}
              classDuration={selectedClass?.host_artist_id ? selectedClass.duration_min : undefined}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

function Feature({ active, label }: { active: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div
        style={{
          width: '16px',
          height: '16px',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--ink-3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {active && (
          <svg
            width="8"
            height="6"
            viewBox="0 0 8 6"
            fill="none"
            style={{ color: 'var(--accent)' }}
          >
            <path
              d="M1 3L3 5L7 1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        style={{
          fontSize: '0.8rem',
          color: active ? 'var(--ink-2)' : 'var(--ink-3)',
          textDecoration: active ? 'none' : 'line-through',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default Classes;
