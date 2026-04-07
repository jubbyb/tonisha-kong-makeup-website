import React from 'react';

const milestones = [
  { year: 'Early Life', text: 'Self-taught pianist at age four, excelling in art — creativity was always the constant.' },
  { year: 'University', text: 'Studied Zoology, discovered a love for makeup while experimenting on friends and herself.' },
  { year: 'Manhattan', text: 'Attended makeup school in New York City, training under renowned artists including Rihanna\'s makeup artist.' },
  { year: 'Today', text: 'Running a thriving artistry practice in Jamaica — teaching, transforming, and empowering clients.' },
];

const About: React.FC = () => {
  return (
    <div style={{ background: 'oklch(9% 0.005 60)' }}>
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
              color: 'oklch(71% 0.11 78)',
              marginBottom: '1.5rem',
            }}
          >
            The Artist
          </p>

          <h1
            className="anim-fade-up delay-2 font-display"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
              fontWeight: 300,
              lineHeight: 1.05,
              color: 'oklch(93% 0.01 75)',
              marginBottom: '2.5rem',
            }}
          >
            About
            <br />
            <span style={{ fontStyle: 'italic', color: 'oklch(71% 0.11 78)' }}>Tonisha Kong</span>
          </h1>

          <div className="divider-gold anim-fade-in delay-2" />

          <p
            className="anim-fade-up delay-3"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'oklch(60% 0.01 60)',
              maxWidth: '500px',
              marginTop: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            Hi, I'm Tonisha Kong, a passionate makeup artist based in Jamaica. My creative journey
            began in childhood, surrounded by a supportive family who encouraged my artistic side.
          </p>

          <p
            className="anim-fade-up delay-4"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'oklch(60% 0.01 60)',
              maxWidth: '500px',
              marginBottom: '2rem',
            }}
          >
            While I initially pursued Zoology at university with plans to become a veterinarian,
            my love for creativity never faded. During university, I discovered my passion for
            makeup — experimenting with bold looks on myself and friends. What started as a hobby
            soon became a calling.
          </p>

          <p
            className="anim-fade-up delay-5"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.85,
              color: 'oklch(60% 0.01 60)',
              maxWidth: '500px',
            }}
          >
            My sister sent me to makeup school in Manhattan, where I had the privilege of training
            with renowned artists — including Rihanna's makeup artist. Today, my mission is to
            help every client feel beautiful without hiding who they are.
          </p>
        </div>

        {/* Right — photo */}
        <div
          style={{ position: 'relative', overflow: 'hidden', background: 'oklch(12% 0.005 60)' }}
          className="about-photo"
        >
          <img
            src="https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-PersonalTonishaKong__IMG0118_1697819890726.jpeg"
            alt="Tonisha Kong portrait"
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
              borderLeft: '1px solid oklch(71% 0.11 78)',
              borderBottom: '1px solid oklch(71% 0.11 78)',
            }}
          />
        </div>
      </section>

      {/* ── Philosophy ────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'oklch(12% 0.005 60)',
          borderTop: '1px solid oklch(18% 0.005 60)',
          padding: '5rem 2rem',
          textAlign: 'center',
        }}
      >
        <blockquote
          className="font-display"
          style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'oklch(88% 0.015 75)',
            maxWidth: '800px',
            margin: '0 auto 2rem',
            lineHeight: 1.4,
          }}
        >
          "Makeup is more than a mask — it's a tool for confidence and self-expression."
        </blockquote>
        <div
          style={{
            width: '40px',
            height: '1px',
            background: 'oklch(71% 0.11 78)',
            margin: '0 auto',
          }}
        />
      </section>

      {/* ── Journey Timeline ──────────────────────────────────────────── */}
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
              color: 'oklch(55% 0.01 60)',
            }}
          >
            The Journey
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0',
          }}
        >
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`anim-fade-up delay-${i + 1}`}
              style={{
                padding: '2.5rem',
                borderLeft: '1px solid oklch(18% 0.005 60)',
                borderBottom: i < 2 ? 'none' : undefined,
              }}
            >
              <p
                className="font-display"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'oklch(71% 0.11 78)',
                  marginBottom: '1rem',
                }}
              >
                {m.year}
              </p>
              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  color: 'oklch(60% 0.01 60)',
                }}
              >
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gratitude ─────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid oklch(18% 0.005 60)',
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
            color: 'oklch(71% 0.11 78)',
            marginBottom: '1.5rem',
          }}
        >
          With Gratitude
        </p>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.8,
            color: 'oklch(60% 0.01 60)',
          }}
        >
          Special thanks to my mom and big sister for their constant encouragement and love.
          I wouldn't be where I am today without them.
        </p>
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
