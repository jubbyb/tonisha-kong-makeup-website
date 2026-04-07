import React from 'react';
import { useNavigate } from 'react-router-dom';

const galleryImages = [
  {
    src: 'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__378130F60C3E4EF8B946227AE0549CCA_1697820629968.jpg',
    span: 'row-span-2',
  },
  {
    src: 'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__AndieJamaica41_1697820629969.jpeg',
    span: '',
  },
  {
    src: 'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__IMG2958_1697820629959.jpg',
    span: '',
  },
  {
    src: 'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__IMG2970_1697820629934.jpg',
    span: 'row-span-2',
  },
  {
    src: 'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__IMG2124_1697820629963.jpg',
    span: '',
  },
  {
    src: 'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__JIK7515_1697820629912.jpg',
    span: '',
  },
  {
    src: 'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__BYDC12_1697820629918.jpg',
    span: '',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'oklch(9% 0.005 60)' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          height: 'calc(100vh - 64px)',
          minHeight: '600px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Background photo */}
        <img
          src="https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-PersonalTonishaKong__IMG0118_1697819890726.jpeg"
          alt="Tonisha Kong"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
          className="anim-fade-in"
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, oklch(9% 0.005 60) 0%, oklch(9% 0.005 60 / 0.5) 45%, transparent 70%)',
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '0 2rem 4rem',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Overline */}
          <p
            className="anim-fade-up delay-1"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'oklch(71% 0.11 78)',
              marginBottom: '1rem',
            }}
          >
            Makeup Artist · Kingston, Jamaica
          </p>

          {/* Main title */}
          <h1
            className="anim-fade-up delay-2 font-display"
            style={{
              fontSize: 'clamp(3.5rem, 9vw, 8rem)',
              fontWeight: 300,
              lineHeight: 0.92,
              letterSpacing: '-0.01em',
              color: 'oklch(96% 0.01 80)',
              marginBottom: '1.5rem',
            }}
          >
            Tonisha
            <br />
            <span style={{ fontStyle: 'italic', color: 'oklch(71% 0.11 78)' }}>Kong</span>
          </h1>

          {/* Tagline */}
          <p
            className="anim-fade-up delay-3"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 300,
              color: 'oklch(65% 0.01 60)',
              maxWidth: '380px',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            Enhancing natural beauty through artistry — for weddings, editorial, and every occasion.
          </p>

          {/* CTA */}
          <div className="anim-fade-up delay-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-gold" onClick={() => navigate('/services')}>
              Book a Session
            </button>
            <button
              className="btn-gold"
              onClick={() => navigate('/about')}
              style={{ borderColor: 'oklch(30% 0.01 60)', color: 'oklch(65% 0.01 60)' }}
            >
              My Story
            </button>
          </div>
        </div>

        {/* Vertical scroll hint */}
        <div
          className="anim-fade-in delay-5"
          style={{
            position: 'absolute',
            right: '2rem',
            bottom: '3rem',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '60px',
              background: 'linear-gradient(to bottom, transparent, oklch(71% 0.11 78))',
            }}
          />
          <span
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'oklch(50% 0.01 60)',
              writingMode: 'vertical-rl',
            }}
          >
            Scroll
          </span>
        </div>
      </section>

      {/* ── Statement ─────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '6rem 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
        }}
      >
        <div style={{ borderLeft: '1px solid oklch(71% 0.11 78)', paddingLeft: '2rem' }}>
          <blockquote
            className="font-display"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.3,
              color: 'oklch(88% 0.015 75)',
              marginBottom: '1.5rem',
            }}
          >
            "My makeup style is all about enhancing natural beauty — not masking it."
          </blockquote>
          <p
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'oklch(71% 0.11 78)',
            }}
          >
            — Tonisha Kong
          </p>
        </div>
      </section>

      {/* ── Gallery Grid ──────────────────────────────────────────────── */}
      <section style={{ padding: '0 0 6rem' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 2rem',
            marginBottom: '3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <div className="divider-gold" />
          <h2
            className="font-display"
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'oklch(55% 0.01 60)',
            }}
          >
            Portfolio
          </h2>
        </div>

        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '260px',
            gap: '6px',
          }}
        >
          {galleryImages.map((img, i) => (
            <div
              key={i}
              className={`anim-fade-up delay-${Math.min(i + 1, 8)}`}
              style={{
                overflow: 'hidden',
                gridRow: img.span === 'row-span-2' ? 'span 2' : 'span 1',
                position: 'relative',
              }}
            >
              <img
                src={img.src}
                alt={`Portfolio ${i + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  transition: 'transform 0.6s ease',
                  display: 'block',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Services CTA ──────────────────────────────────────────────── */}
      <section
        style={{
          background: 'oklch(12% 0.005 60)',
          borderTop: '1px solid oklch(18% 0.005 60)',
          borderBottom: '1px solid oklch(18% 0.005 60)',
          padding: '5rem 2rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'oklch(71% 0.11 78)',
            marginBottom: '1.5rem',
          }}
        >
          Professional Services
        </p>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 300,
            color: 'oklch(93% 0.01 75)',
            marginBottom: '1rem',
          }}
        >
          From Bridal to Editorial
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'oklch(55% 0.01 60)',
            maxWidth: '500px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          Specializing in weddings, photoshoots, fashion, and master makeup classes.
        </p>
        <button className="btn-gold" onClick={() => navigate('/services')}>
          View Services
        </button>
      </section>
    </div>
  );
};

export default Home;
