import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Testimonials ──────────────────────────────────────────────────────────────

interface Review {
  id: number;
  name: string;
  service: string;
  rating: number;
  body: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          style={{ flexShrink: 0, color: star <= rating ? 'var(--tk-gold)' : 'var(--tk-border)' }}
        >
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data: Review[]) => {
        setReviews(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || reviews.length === 0) return null;

  return (
    <section
      style={{
        padding: '6rem 0',
        background: 'var(--tk-bg)',
        transition: 'background-color 0.35s ease',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3.5rem' }}>
          <div
            style={{
              height: '1px',
              width: '3rem',
              background: 'var(--tk-gold)',
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--tk-text-dim)',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Client Stories
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {reviews.map((review, i) => (
            <div
              key={review.id}
              className={`lux-card anim-fade-up delay-${Math.min(i + 1, 8)}`}
              style={{
                padding: '2rem',
                borderTop: '2px solid var(--tk-gold)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <StarRating rating={review.rating} />
              <blockquote
                className="font-display"
                style={{
                  fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  lineHeight: 1.65,
                  color: 'var(--tk-text-sub)',
                  flex: 1,
                  margin: 0,
                }}
              >
                "{review.body}"
              </blockquote>
              <div
                style={{
                  borderTop: '1px solid var(--tk-border)',
                  paddingTop: '1rem',
                  marginTop: 'auto',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--tk-text-bright)',
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {review.name}
                </p>
                <p
                  style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--tk-gold)',
                    marginTop: '0.3rem',
                    marginBottom: 0,
                  }}
                >
                  {review.service}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const galleryImages = [
  {
    src: 'https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/e889690c-deae-484d-876f-fd818921bd96-20190806_143114-01.jpeg',
    span: 'row-span-2',
  },
  {
    src: 'https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/33148347-b587-47f1-bdc9-5474239b1892-IMG_1120.jpg',
    span: '',
  },
  {
    src: 'https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/dda95bc7-b855-4eb6-9323-e25900c43c45-80f9db98-da7e-470f-b28a-cb1cf01c40a5.jpg',
    span: '',
  },
   {
    src: 'https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/f7ae9e7e-48c3-4fc5-8449-5bb4e5e49198-IMG_1121.jpg',
    span: '',
  },
  {
    src: 'https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/f1a18aab-5b90-49a9-b8a3-c46ce92de646-BYDC18.jpg',
    span: 'row-span-2',
  },
 
  {
    src: 'https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/9152a979-871b-46ff-bbeb-9865313f5eeb-Andie-Jamaica-132%20(1).jpg',
    span: '',
  },
  {
    src: 'https://pub-49f3cdaa48b5476894f4890f6d54f0a2.r2.dev/uploads/7d1e6328-2667-4bc6-a475-64a4d0217ad6-IMG-20210324-WA0038.jpg',
    span: '',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--tk-bg)', transition: 'background-color 0.35s ease' }}>
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
              'linear-gradient(to top, var(--tk-hero-overlay) 0%, var(--tk-hero-overlay-half) 45%, transparent 70%)',
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
              color: 'var(--tk-gold)',
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
              color: 'var(--tk-text-bright)',
              marginBottom: '1.5rem',
            }}
          >
            Tonisha
            <br />
            <span style={{ fontStyle: 'italic', color: 'var(--tk-gold)' }}>Kong</span>
          </h1>

          {/* Tagline */}
          <p
            className="anim-fade-up delay-3"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 300,
              color: 'var(--tk-text-muted)',
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
              style={{ borderColor: 'var(--tk-border-soft)', color: 'var(--tk-text-muted)' }}
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
              background: 'linear-gradient(to bottom, transparent, var(--tk-gold))',
            }}
          />
          <span
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--tk-text-faint)',
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
        <div style={{ borderLeft: '1px solid var(--tk-gold)', paddingLeft: '2rem' }}>
          <blockquote
            className="font-display"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.3,
              color: 'var(--tk-text-sub)',
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
              color: 'var(--tk-gold)',
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
              color: 'var(--tk-text-dim)',
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

      <TestimonialsSection />

      {/* ── Services CTA ──────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--tk-bg-raised)',
          borderTop: '1px solid var(--tk-border)',
          borderBottom: '1px solid var(--tk-border)',
          padding: '5rem 2rem',
          textAlign: 'center',
          transition: 'background-color 0.35s ease, border-color 0.35s ease',
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
          Professional Services
        </p>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 300,
            color: 'var(--tk-text)',
            marginBottom: '1rem',
          }}
        >
          From Bridal to Editorial
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--tk-text-dim)',
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
