import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow } from '../components/ui';

const trades = [
  { name: 'Makeup', icon: '✦', desc: 'Bridal, editorial, everyday glam' },
  { name: 'Nails', icon: '◆', desc: 'Mani, pedi, gel, art, extensions' },
  { name: 'Hair', icon: '◇', desc: 'Cuts, colour, styling, extensions' },
  { name: 'Barber', icon: '◈', desc: 'Cuts, fades, beards, hot towel shaves' },
  { name: 'Stylist', icon: '◉', desc: 'Personal styling and wardrobe curation' },
  { name: 'Tailor', icon: '◐', desc: 'Alterations, custom fits, repairs' },
];

const pillars = [
  {
    label: 'The Idea',
    text: 'Booking beauty and style professionals was fragmented. Every trade had its own apps, every artist their own DMs. We built one home for all six disciplines.',
  },
  {
    label: 'The Platform',
    text: 'StyleJA connects clients with independent artists across Jamaica — real pricing, real availability, real portfolio. No middlemen, no markups.',
  },
  {
    label: 'The Artists',
    text: 'Artists keep 95% of every booking. Our 5% fee covers the booking infrastructure so pros can focus entirely on their craft.',
  },
  {
    label: 'The Vision',
    text: "Jamaica's style culture is world-class. StyleJA exists to make it discoverable — one booking at a time, island-wide.",
  },
];

const About: React.FC = () => {
  return (
    <div style={{ background: 'var(--bg)', transition: 'background-color 0.35s ease' }}>
      {/* ── Split Hero ─────────────────────────────────────────────────── */}
      <section
        className="about-hero"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '90vh',
        }}
      >
        {/* Left — text */}
        <div
          style={{
            padding: 'clamp(3rem, 8vw, 7rem) clamp(2rem, 5vw, 5rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Eyebrow
            className="anim-slide-right delay-1"
            style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}
          >
            About the platform
          </Eyebrow>

          <h1
            className="anim-fade-up delay-2 font-editorial"
            style={{
              fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
              fontWeight: 400,
              lineHeight: 1.05,
              color: 'var(--ink)',
              marginBottom: '2.5rem',
            }}
          >
            Jamaica&apos;s style
            <br />
            <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>marketplace</span>
          </h1>

          <div
            className="anim-fade-in delay-2"
            style={{ width: 48, height: 1, background: 'var(--accent)', marginBottom: '1.75rem' }}
          />

          <p
            className="anim-fade-up delay-3"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'var(--ink-2)',
              maxWidth: '480px',
              marginBottom: '1.5rem',
            }}
          >
            StyleJA is a multi-vendor marketplace connecting clients with Jamaica's best beauty and
            style professionals across six trades — all in one place.
          </p>

          <p
            className="anim-fade-up delay-4"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'var(--ink-2)',
              maxWidth: '480px',
              marginBottom: '2.5rem',
            }}
          >
            Browse real portfolios, see live availability, and book in minutes. Artists set their
            own prices and keep <span style={{ color: 'var(--ink)', fontWeight: 600 }}>95%</span> of
            every booking.
          </p>

          <div
            className="anim-fade-up delay-5"
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
          >
            <Link to="/artists" className="btn-accent" style={{ textDecoration: 'none' }}>
              Browse artists
            </Link>
            <Link
              to="/login?mode=signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 2.5rem',
                border: '1px solid var(--line-2)',
                color: 'var(--ink-2)',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'border-color 0.3s ease, color 0.3s ease',
              }}
            >
              Join StyleJA
            </Link>
          </div>
        </div>

        {/* Right — photo */}
        <div
          className="about-photo"
          style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-card)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80"
            alt="StyleJA artist at work"
            className="anim-fade-in delay-1"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 80,
              height: 80,
              borderLeft: '1px solid var(--accent)',
              borderBottom: '1px solid var(--accent)',
            }}
          />
        </div>
      </section>

      {/* ── Platform quote ─────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--line-2)',
          padding: '5rem 2rem',
          textAlign: 'center',
          transition: 'background-color 0.35s ease, border-color 0.35s ease',
        }}
      >
        <blockquote
          className="font-editorial"
          style={{
            fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink-3)',
            maxWidth: '820px',
            margin: '0 auto 2rem',
            lineHeight: 1.4,
          }}
        >
          "Connect with Jamaica's best style professionals — on your terms."
        </blockquote>
        <div style={{ width: 40, height: 1, background: 'var(--accent)', margin: '0 auto' }} />
      </section>

      {/* ── Six trades ──────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '6rem 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
          <Eyebrow>Six trades, one platform</Eyebrow>
          <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
        </div>

        <h2
          className="font-editorial"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 400,
            color: 'var(--ink)',
            marginBottom: '3.5rem',
          }}
        >
          Every style discipline, under one roof
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 0,
          }}
        >
          {trades.map((t, i) => (
            <div
              key={t.name}
              className={`anim-fade-up delay-${i + 1}`}
              style={{
                padding: '2.5rem',
                borderLeft: '1px solid var(--line-2)',
                borderBottom: '1px solid var(--line-2)',
              }}
            >
              <p
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--accent)',
                  marginBottom: '0.75rem',
                }}
              >
                {t.icon}
              </p>
              <p
                className="font-editorial"
                style={{ fontSize: '1.2rem', color: 'var(--ink)', marginBottom: '0.5rem' }}
              >
                {t.name}
              </p>
              <p className="eyebrow" style={{ color: 'var(--ink-3)' }}>
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fee model highlight ─────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--line-2)',
          borderBottom: '1px solid var(--line-2)',
          padding: '5rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '3rem',
            textAlign: 'center',
          }}
        >
          {[
            { num: '95%', label: 'Artists keep', sub: 'of every booking fee' },
            { num: '5%', label: 'Platform fee', sub: 'covers the full booking stack' },
            {
              num: '6',
              label: 'Style trades',
              sub: 'makeup · nails · hair · barber · stylist · tailor',
            },
          ].map((s) => (
            <div key={s.num}>
              <p
                className="font-editorial num"
                style={{
                  fontSize: 'clamp(3rem, 7vw, 5rem)',
                  color: 'var(--accent)',
                  lineHeight: 1,
                  fontStyle: 'italic',
                }}
              >
                {s.num}
              </p>
              <p
                className="font-editorial"
                style={{ fontSize: '1.1rem', color: 'var(--ink)', margin: '0.5rem 0 0.25rem' }}
              >
                {s.label}
              </p>
              <p className="eyebrow">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pillars ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '4rem' }}>
          <div style={{ width: 48, height: 1, background: 'var(--accent)' }} />
          <Eyebrow>Why StyleJA</Eyebrow>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 0,
          }}
        >
          {pillars.map((m, i) => (
            <div
              key={i}
              className={`anim-fade-up delay-${i + 1}`}
              style={{ padding: '2.5rem', borderLeft: '1px solid var(--line-2)' }}
            >
              <Eyebrow style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{m.label}</Eyebrow>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--ink-2)' }}>{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Pro ─────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid var(--line-2)',
          padding: '5rem 2rem',
        }}
      >
        <div
          className="about-featured"
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '5rem',
            alignItems: 'center',
          }}
        >
          {/* Photo */}
          <div
            className="about-featured-photo"
            style={{
              position: 'relative',
              aspectRatio: '4/5',
              overflow: 'hidden',
              background: 'var(--bg-card)',
            }}
          >
            <img
              src="https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/f1a18aab-5b90-49a9-b8a3-c46ce92de646-BYDC18.jpg"
              alt="Tonisha Kong"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 80,
                height: 80,
                borderRight: '1px solid var(--accent)',
                borderBottom: '1px solid var(--accent)',
              }}
            />
          </div>

          {/* Text */}
          <div>
            <Eyebrow style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>
              Featured Pro
            </Eyebrow>
            <h2
              className="font-editorial"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 400,
                color: 'var(--ink)',
                lineHeight: 1.1,
                marginBottom: '1.5rem',
              }}
            >
              Tonisha Kong
            </h2>
            <div
              style={{ width: 40, height: 1, background: 'var(--accent)', marginBottom: '1.5rem' }}
            />
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.85,
                color: 'var(--ink-2)',
                marginBottom: '1.25rem',
              }}
            >
              Makeup artist, educator, and the creative force behind some of Jamaica's most
              celebrated looks. StyleJA was built alongside Tonisha's vision of making world-class
              artistry accessible across the island.
            </p>
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.85,
                color: 'var(--ink-2)',
                marginBottom: '2.5rem',
              }}
            >
              Bridal, editorial, film — her profile is where it all began.
            </p>
            <Link
              to="/artists/tonisha-kong"
              className="btn-accent"
              style={{ textDecoration: 'none' }}
            >
              View Tonisha's profile
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--line-2)',
          padding: '5rem 2rem',
          textAlign: 'center',
        }}
      >
        <Eyebrow style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Join StyleJA</Eyebrow>
        <h2
          className="font-editorial"
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 400,
            color: 'var(--ink)',
            marginBottom: '1rem',
          }}
        >
          Ready to book your next look?
        </h2>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--ink-2)',
            maxWidth: 480,
            margin: '0 auto 2.5rem',
            lineHeight: 1.75,
          }}
        >
          Discover Jamaica's best style professionals, see their live availability, and book in
          minutes.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/artists" className="btn-accent" style={{ textDecoration: 'none' }}>
            Browse all artists
          </Link>
          <Link
            to="/login?mode=signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.75rem 2.5rem',
              border: '1px solid var(--line-2)',
              color: 'var(--ink-2)',
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Create account
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .about-hero { grid-template-columns: 1fr !important; }
          .about-photo { height: 400px; }
          .about-featured { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .about-featured-photo { aspect-ratio: 3/2 !important; }
        }
      `}</style>
    </div>
  );
};

export default About;
