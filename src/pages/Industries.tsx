import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Industry {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  sort_order: number;
}

const INDUSTRY_ICONS: Record<string, string> = {
  makeup: '✦',
  hair: '✧',
  nails: '◆',
  barber: '◇',
  stylist: '▲',
  tailoring: '△',
};

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<Industry[]>)
      .then((data) => {
        setIndustries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <span className="loading loading-spinner loading-lg" style={{ color: 'var(--accent)' }} />
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
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 2rem 3rem' }}>
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
          What We Offer
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
          Industries
        </h1>
        <p
          className="anim-fade-up delay-2"
          style={{ fontSize: '0.95rem', color: 'var(--ink-2)', maxWidth: '520px', lineHeight: 1.7 }}
        >
          From bridal glam to bespoke tailoring — discover artists across every beauty and style
          discipline.
        </p>
      </div>

      {/* 3×2 tile grid */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 2rem 6rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          background: 'var(--line-2)',
          border: '1px solid var(--line-2)',
        }}
        className="industries-grid"
      >
        {industries.map((ind, i) => (
          <button
            key={ind.id}
            className={`editorial-card-base anim-fade-up delay-${Math.min(i + 1, 6)}`}
            onClick={() => navigate(`/industries/${ind.slug}`)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '2.5rem 2rem',
              textAlign: 'left',
              background: 'var(--bg)',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card)')
            }
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg)')}
          >
            <span style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>
              {INDUSTRY_ICONS[ind.slug] ?? '✦'}
            </span>
            <div>
              <h2
                className="font-display"
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 400,
                  color: 'var(--ink)',
                  lineHeight: 1.1,
                  marginBottom: '0.5rem',
                }}
              >
                {ind.name}
              </h2>
              {ind.tagline && (
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.6 }}>
                  {ind.tagline}
                </p>
              )}
            </div>
            <p
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginTop: 'auto',
              }}
            >
              Explore →
            </p>
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .industries-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .industries-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
