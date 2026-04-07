import React, { useEffect, useState } from 'react';

interface ClassItem {
  id: number;
  name: string;
  description: string;
  date: string;
  price: number;
  certificate: number;
  mentoring: number;
}

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          color: 'var(--tk-text-dim)',
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
    <div style={{ background: 'var(--tk-bg)', minHeight: '100vh', transition: 'background-color 0.35s ease' }}>
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
            color: 'var(--tk-gold)',
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
            color: 'var(--tk-text)',
            marginBottom: '1rem',
          }}
        >
          Master Classes
        </h1>
        <p
          className="anim-fade-up delay-2"
          style={{
            fontSize: '0.9rem',
            color: 'var(--tk-text-dim)',
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
          background: 'var(--tk-border)',
          border: '1px solid var(--tk-border)',
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
                background: 'var(--tk-bg)',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--tk-bg-raised)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--tk-bg)')
              }
            >
              {/* Name + price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2
                  className="font-display"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 400,
                    color: 'var(--tk-text)',
                    lineHeight: 1.15,
                    flex: 1,
                  }}
                >
                  {classItem.name}
                </h2>
                <span
                  className="font-display"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 300,
                    color: 'var(--tk-gold)',
                    marginLeft: '1rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ${classItem.price}
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: '30px', height: '1px', background: 'var(--tk-border-soft)' }} />

              {/* Description */}
              <p
                style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  color: 'var(--tk-text-dim)',
                }}
              >
                {classItem.description}
              </p>

              {/* Date */}
              <p
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  color: 'var(--tk-text-faint)',
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

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Feature active={true} label="Hands-on Training" />
                <Feature active={hasCertificate} label="Certificate Included" />
                <Feature active={hasMentoring} label="1-on-1 Mentoring" />
              </div>

              {/* CTA */}
              <button
                className="btn-gold"
                style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}
                onClick={() => {
                  window.location.href = '/contact';
                }}
              >
                Enquire
              </button>
            </div>
          );
        })}
      </div>
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
          border: `1px solid ${active ? 'var(--tk-gold)' : 'var(--tk-text-footer-dimmer)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {active && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" style={{ color: 'var(--tk-gold)' }}>
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
          color: active ? 'var(--tk-text-muted)' : 'var(--tk-text-footer-dimmer)',
          textDecoration: active ? 'none' : 'line-through',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default Classes;
