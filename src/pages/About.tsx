import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../constants/brand';

const pillars = [
  { year: 'The Idea', text: 'We noticed that booking beauty and style professionals was fragmented. Every discipline had its own apps, every artist their own DMs. We built one home for all of it.' },
  { year: 'The Platform', text: 'Styleja connects clients with independent artists across makeup, hair, nails, barber, styling, and tailoring — a single place to discover, book, and build a relationship.' },
  { year: 'The Artists', text: 'Every artist on Styleja runs their own profile — real pricing, real availability, real portfolio. No middlemen, no markups. Just craft.' },
  { year: 'The Vision', text: 'We believe self-expression should be accessible. Whether it\'s a wedding day or a Tuesday, the right artist is here.' },
];

const About: React.FC = () => {
  return (
    <div style={{ background: 'var(--tk-bg)', transition: 'background-color 0.35s ease' }}>
      {/* ── Split Hero ────────────────────────────────────────────────── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '90vh',
        }}
        className="about-hero"
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
          <p
            className="anim-slide-right delay-1"
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--tk-gold)',
              marginBottom: '1.5rem',
            }}
          >
            The Platform
          </p>

          <h1
            className="anim-fade-up delay-2 font-display"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
              fontWeight: 300,
              lineHeight: 1.05,
              color: 'var(--tk-text)',
              marginBottom: '2.5rem',
            }}
          >
            About
            <br />
            <span style={{ fontStyle: 'italic', color: 'var(--tk-gold)' }}>{BRAND.name}</span>
          </h1>

          <div className="divider-gold anim-fade-in delay-2" />

          <p
            className="anim-fade-up delay-3"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'var(--tk-text-body)',
              maxWidth: '500px',
              marginTop: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            Styleja is a multi-artist booking platform built for the beauty and style industries.
            We connect clients with independent professionals across six disciplines — all in one place.
          </p>

          <p
            className="anim-fade-up delay-4"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'var(--tk-text-body)',
              maxWidth: '500px',
              marginBottom: '2rem',
            }}
          >
            Our artists set their own availability, prices, and portfolios. You browse, choose, and book
            — no DMs required.
          </p>

          <p
            className="anim-fade-up delay-5"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'var(--tk-text-body)',
              maxWidth: '500px',
            }}
          >
            Based in {BRAND.location}, Styleja launched with a curated roster of talent and a commitment
            to making world-class artistry accessible to everyone.
          </p>
        </div>

        {/* Right — photo */}
        <div
          style={{ position: 'relative', overflow: 'hidden', background: 'var(--tk-bg-raised)' }}
          className="about-photo"
        >
          <img
            src="https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/f1a18aab-5b90-49a9-b8a3-c46ce92de646-BYDC18.jpg"
            alt="Styleja artist at work"
            className="anim-fade-in delay-1"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
          {/* Gold corner accent */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '80px',
              height: '80px',
              borderLeft: '1px solid var(--tk-gold)',
              borderBottom: '1px solid var(--tk-gold)',
            }}
          />
        </div>
      </section>

      {/* ── Philosophy ────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--tk-bg-raised)',
          borderTop: '1px solid var(--tk-border)',
          padding: '5rem 2rem',
          textAlign: 'center',
          transition: 'background-color 0.35s ease, border-color 0.35s ease',
        }}
      >
        <blockquote
          className="font-display"
          style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--tk-text-sub)',
            maxWidth: '800px',
            margin: '0 auto 2rem',
            lineHeight: 1.4,
          }}
        >
          "Style is personal. The right artist makes the difference."
        </blockquote>
        <div
          style={{
            width: '40px',
            height: '1px',
            background: 'var(--tk-gold)',
            margin: '0 auto',
          }}
        />
      </section>

      {/* ── Pillars ───────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '6rem 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '4rem' }}>
          <div className="divider-gold" />
          <h2
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--tk-text-dim)',
            }}
          >
            Why Styleja
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0',
          }}
        >
          {pillars.map((m, i) => (
            <div
              key={i}
              className={`anim-fade-up delay-${i + 1}`}
              style={{
                padding: '2.5rem',
                borderLeft: '1px solid var(--tk-border)',
              }}
            >
              <p
                className="font-display"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'var(--tk-gold)',
                  marginBottom: '1rem',
                }}
              >
                {m.year}
              </p>
              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  color: 'var(--tk-text-body)',
                }}
              >
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Artist ───────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid var(--tk-border)',
          padding: '5rem 2rem',
          maxWidth: '700px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--tk-gold)',
            marginBottom: '1.5rem',
          }}
        >
          Featured Artist
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.8,
            color: 'var(--tk-text-body)',
            marginBottom: '2rem',
          }}
        >
          Styleja was founded alongside Tonisha Kong — makeup artist, educator, and the creative
          force behind some of Jamaica's most celebrated looks. Her profile is where it all began.
        </p>
        <Link
          to="/artists/tonisha-kong"
          className="btn-gold"
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          View Tonisha's Profile
        </Link>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .about-hero {
            grid-template-columns: 1fr !important;
          }
          .about-photo {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default About;
