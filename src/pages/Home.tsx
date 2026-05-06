import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../constants/brand';

// ── Types ──────────────────────────────────────────────────────────────────

interface Review {
  id: number;
  name: string;
  service: string;
  rating: number;
  body: string;
}

interface Industry {
  id: number;
  slug: string;
  name: string;
  artist_count?: number;
}

interface Artist {
  id: number;
  slug: string | null;
  name: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
  location: string | null;
  industries: { slug: string; name: string }[];
}

// ── Category image map ─────────────────────────────────────────────────────

const CATEGORY_IMAGES: Record<string, string> = {
  makeup: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
  nails: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
  hair: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  barber: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
  stylist: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
  tailor: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
  beauty: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
  styling: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
};

function getCategoryImage(slug: string, name: string): string {
  const key = slug.toLowerCase();
  if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  const nameKey = name.toLowerCase();
  for (const k of Object.keys(CATEGORY_IMAGES)) {
    if (nameKey.includes(k) || k.includes(nameKey)) return CATEGORY_IMAGES[k];
  }
  return 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80';
}

// ── Testimonials ───────────────────────────────────────────────────────────

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
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3.5rem' }}
        >
          <div
            style={{ height: '1px', width: '3rem', background: 'var(--tk-gold)', flexShrink: 0 }}
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

// ── Main component ─────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [serviceQuery, setServiceQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<Industry[]>)
      .then(setIndustries)
      .catch(() => {});
    fetch('/api/artists')
      .then((r) => r.json() as Promise<Artist[]>)
      .then((data) => setFeaturedArtists(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (serviceQuery) params.set('q', serviceQuery);
    if (locationQuery) params.set('location', locationQuery);
    navigate(`/artists${params.toString() ? '?' + params.toString() : ''}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ background: 'var(--tk-bg)', transition: 'background-color 0.35s ease' }}>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 2rem 0', maxWidth: '1280px', margin: '0 auto' }}>
        <div
          className="home-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '3rem',
            alignItems: 'end',
            minHeight: '520px',
          }}
        >
          {/* Left — headline */}
          <div>
            <p
              className="anim-fade-up"
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
                marginBottom: '1.75rem',
              }}
            >
              —— Booking hub · est. 2026
            </p>
            <h1
              className="anim-fade-up delay-1 font-editorial"
              style={{
                fontSize: 'clamp(4rem, 9vw, 8.5rem)',
                fontWeight: 400,
                lineHeight: 0.92,
                letterSpacing: '-0.025em',
                color: 'var(--tk-text)',
                marginBottom: 0,
              }}
            >
              Find the
              <br />
              <span style={{ fontStyle: 'italic', color: 'var(--tk-gold)' }}>hands</span> behind
              <br />
              your <span style={{ fontStyle: 'italic' }}>look.</span>
            </h1>
            <p
              className="anim-fade-up delay-2"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                color: 'var(--tk-text-dim)',
                maxWidth: '480px',
                marginTop: '2.25rem',
              }}
            >
              {BRAND.tagline}
            </p>
          </div>

          {/* Right — portrait stack */}
          <div
            className="home-hero-portrait anim-fade-in delay-3"
            style={{ position: 'relative', height: '520px' }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '62%',
                height: '75%',
                overflow: 'hidden',
                borderRadius: '4px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80"
                alt="Makeup artist at work"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '60px',
                left: 0,
                width: '42%',
                height: '52%',
                overflow: 'hidden',
                borderRadius: '4px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80"
                alt="Nail art detail"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <p
              style={{
                position: 'absolute',
                bottom: 0,
                right: '10%',
                fontSize: '0.65rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
              }}
            >
              Beauty, hair &amp; nails · Kingston
            </p>
          </div>
        </div>

        {/* Search bar — desktop */}
        <div
          className="search-bar-desktop anim-fade-up delay-3"
          style={{
            marginTop: '3rem',
            background: 'var(--tk-bg-raised)',
            borderRadius: '999px',
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr auto',
            alignItems: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            border: '1px solid var(--tk-border)',
          }}
        >
          <div style={{ padding: '0.625rem 1.5rem', borderRight: '1px solid var(--tk-border)' }}>
            <p
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
                margin: '0 0 4px',
              }}
            >
              Service
            </p>
            <input
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Makeup, nails, hair…"
              style={{
                fontSize: '0.9375rem',
                color: 'var(--tk-text)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
          <div style={{ padding: '0.625rem 1.5rem', borderRight: '1px solid var(--tk-border)' }}>
            <p
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
                margin: '0 0 4px',
              }}
            >
              Where
            </p>
            <input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Kingston, Mo Bay…"
              style={{
                fontSize: '0.9375rem',
                color: 'var(--tk-text)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
          <div style={{ padding: '0.625rem 1.5rem' }}>
            <p
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
                margin: '0 0 4px',
              }}
            >
              When
            </p>
            <span style={{ fontSize: '0.9375rem', color: 'var(--tk-text-faint)' }}>Any time</span>
          </div>
          <button
            onClick={handleSearch}
            style={{
              marginRight: '8px',
              padding: '0.875rem 1.5rem',
              borderRadius: '999px',
              background: 'var(--tk-gold)',
              color: 'var(--tk-gold-on-gold)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
            }}
          >
            Search
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        {/* Stats strip */}
        <div
          className="anim-fade-up delay-4"
          style={{
            marginTop: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.6875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--tk-text-faint)',
            paddingBottom: '0.5rem',
          }}
        >
          <span>Verified pros across Jamaica</span>
          <span>·</span>
          <span>14 parishes</span>
          <span>·</span>
          <span>Book in under a minute</span>
          <span>·</span>
          <span>4.9 ★ average rating</span>
        </div>

        {/* Search bar — mobile pill */}
        <div
          className="search-bar-mobile anim-fade-up delay-3"
          style={{
            display: 'none',
            marginTop: '1.5rem',
            padding: '6px 6px 6px 16px',
            borderRadius: '999px',
            background: 'var(--tk-bg-raised)',
            border: '1px solid var(--tk-border)',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
          onClick={handleSearch}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--tk-text-faint)', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span
            style={{
              flex: 1,
              fontSize: '0.875rem',
              color: 'var(--tk-text-faint)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Service · Kingston · Anytime
          </span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '99px',
              background: 'var(--tk-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

        {/* Featured artist card — mobile only */}
        {featuredArtists.length > 0 && (
          <div className="mobile-featured-card" style={{ display: 'none', marginTop: '1.5rem' }}>
            <p
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
                marginBottom: '0.625rem',
              }}
            >
              —— Featured this week
            </p>
            <div
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                height: '240px',
                cursor: 'pointer',
              }}
              onClick={() =>
                navigate(
                  featuredArtists[0].slug ? `/artists/${featuredArtists[0].slug}` : '/artists',
                )
              }
            >
              <img
                src={
                  featuredArtists[0].photo_url ??
                  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80'
                }
                alt={featuredArtists[0].name}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.75) 100%)',
                }}
              />
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, color: '#fff' }}>
                <div
                  className="font-editorial"
                  style={{ fontSize: '1.625rem', lineHeight: 1, letterSpacing: '-0.01em' }}
                >
                  {featuredArtists[0].name.split(' ')[0]}{' '}
                  <span style={{ fontStyle: 'italic' }}>
                    {featuredArtists[0].name.split(' ').slice(1).join(' ')}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    opacity: 0.85,
                    marginTop: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {featuredArtists[0].specialties ??
                    featuredArtists[0].industries[0]?.name ??
                    'Artist'}{' '}
                  · {featuredArtists[0].location ?? 'Jamaica'}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Categories ─────────────────────────────────────────────────── */}
      {industries.length > 0 && (
        <section style={{ padding: '8rem 2rem 0', maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '2.5rem',
            }}
          >
            <h2
              className="font-editorial"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--tk-text)',
                margin: 0,
              }}
            >
              What are you{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--tk-gold)' }}>looking</span> for?
            </h2>
            <p
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
                margin: 0,
              }}
            >
              Six trades · one island
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, auto)',
              gap: '1rem',
            }}
          >
            {industries.slice(0, 6).map((ind, i) => (
              <div
                key={ind.id}
                className="category-card anim-fade-up"
                style={{ aspectRatio: '4/3', animationDelay: `${0.1 * i}s` }}
                onClick={() => navigate(`/artists?industry=${ind.slug}`)}
              >
                <img
                  src={getCategoryImage(ind.slug, ind.name)}
                  alt={ind.name}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    padding: '1.5rem',
                    pointerEvents: 'none',
                  }}
                >
                  <div>
                    <div
                      className="font-editorial"
                      style={{
                        fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                        lineHeight: 1,
                        letterSpacing: '-0.015em',
                        fontStyle: i % 2 ? 'italic' : 'normal',
                        color: '#fff',
                      }}
                    >
                      {ind.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.8)',
                        marginTop: '0.5rem',
                      }}
                    >
                      {ind.artist_count ?? '—'} pros · all parishes
                    </div>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.9, flexShrink: 0 }}
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 1,
                    fontSize: '0.625rem',
                    color: 'rgba(255,255,255,0.65)',
                    letterSpacing: '0.12em',
                  }}
                >
                  0{i + 1} / 0{Math.min(industries.length, 6)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Pros ──────────────────────────────────────────────── */}
      {featuredArtists.length > 0 && (
        <section style={{ padding: '7.5rem 2rem 0', maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <p
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--tk-text-faint)',
                margin: 0,
              }}
            >
              —— On the books this week
            </p>
            <span
              onClick={() => navigate('/artists')}
              style={{
                fontSize: '0.8125rem',
                color: 'var(--tk-text-dim)',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                cursor: 'pointer',
              }}
            >
              See all →
            </span>
          </div>
          <h2
            className="font-editorial"
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 4rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--tk-text)',
              margin: '0.75rem 0 3rem',
              maxWidth: '860px',
            }}
          >
            The pros our community
            <br />
            <span style={{ fontStyle: 'italic' }}>can't stop talking about.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {featuredArtists.map((artist, i) => {
              const nameParts = artist.name.split(' ');
              const firstName = nameParts[0];
              const lastName = nameParts.slice(1).join(' ');
              const category = artist.industries[0]?.name ?? '';
              return (
                <div
                  key={artist.id}
                  className="editorial-card anim-fade-up"
                  style={{ animationDelay: `${0.1 * i}s` }}
                  onClick={() => navigate(`/artists/${artist.slug ?? artist.id}`)}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4/5',
                      overflow: 'hidden',
                      marginBottom: '1rem',
                      borderRadius: '4px',
                    }}
                  >
                    {artist.photo_url ? (
                      <img
                        src={artist.photo_url}
                        alt={artist.name}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'var(--tk-bg-raised)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          className="font-editorial"
                          style={{
                            fontSize: '4rem',
                            color: 'var(--tk-border)',
                            fontStyle: 'italic',
                          }}
                        >
                          {artist.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {category && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          fontSize: '0.625rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#fff',
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(8px)',
                          padding: '5px 10px',
                          borderRadius: '999px',
                        }}
                      >
                        {category}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div
                        className="font-editorial"
                        style={{
                          fontSize: '1.625rem',
                          lineHeight: 1.1,
                          letterSpacing: '-0.01em',
                          color: 'var(--tk-text)',
                        }}
                      >
                        {firstName} <span style={{ fontStyle: 'italic' }}>{lastName}</span>
                      </div>
                      {(artist.specialties || artist.bio) && (
                        <div
                          style={{
                            fontSize: '0.8125rem',
                            color: 'var(--tk-text-dim)',
                            marginTop: '4px',
                          }}
                        >
                          {artist.specialties ?? (artist.bio ?? '').slice(0, 60)}
                        </div>
                      )}
                    </div>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--tk-text-dim)', flexShrink: 0 }}
                    >
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '0.875rem',
                      paddingTop: '0.875rem',
                      borderTop: '1px solid var(--tk-border)',
                      fontSize: '0.75rem',
                      color: 'var(--tk-text-dim)',
                    }}
                  >
                    {artist.location && <span>{artist.location}</span>}
                    <span style={{ color: 'var(--tk-gold)', fontWeight: 500 }}>View profile</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Split panel ────────────────────────────────────────────────── */}
      <section style={{ padding: '8rem 2rem 0', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* For customers */}
          <div
            style={{
              padding: '3.5rem 3rem',
              background: 'var(--tk-bg-deep)',
              borderRadius: '4px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--tk-border)',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--tk-text-faint)',
                  margin: '0 0 1.25rem',
                }}
              >
                —— For everyone
              </p>
              <h3
                className="font-editorial"
                style={{
                  fontSize: 'clamp(1.75rem, 3vw, 3rem)',
                  fontWeight: 400,
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  color: 'var(--tk-text)',
                  margin: '0 0 2rem',
                  maxWidth: '420px',
                }}
              >
                Book the whole look in one place.
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                {[
                  'One profile per pro — work, prices, calendar',
                  'Real reviews from real bookings',
                  'Cancel or reschedule up to 24h before',
                ].map((point) => (
                  <li
                    key={point}
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--tk-text-dim)',
                      display: 'flex',
                      gap: '0.875rem',
                      alignItems: 'baseline',
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '1px',
                        background: 'var(--tk-text-faint)',
                        flex: 'none',
                        marginTop: '10px',
                        display: 'inline-block',
                      }}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="btn-gold"
              onClick={() => navigate('/artists')}
              style={{ alignSelf: 'flex-start', marginTop: '2rem' }}
            >
              Find a pro
            </button>
          </div>

          {/* For pros */}
          <div
            style={{
              padding: '3.5rem 3rem',
              background: 'var(--tk-bg-raised)',
              borderRadius: '4px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid var(--tk-border)',
              borderColor: 'var(--tk-gold-subtle)',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--tk-gold)',
                  margin: '0 0 1.25rem',
                }}
              >
                —— For pros
              </p>
              <h3
                className="font-editorial"
                style={{
                  fontSize: 'clamp(1.75rem, 3vw, 3rem)',
                  fontWeight: 400,
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  color: 'var(--tk-text)',
                  margin: '0 0 2rem',
                  maxWidth: '420px',
                }}
              >
                Run your books like a studio.
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                {[
                  'Set hours, services, deposits — your rules',
                  'Take payments in JMD or USD',
                  'Keep 95% — we charge 5% per booking',
                ].map((point) => (
                  <li
                    key={point}
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--tk-text-dim)',
                      display: 'flex',
                      gap: '0.875rem',
                      alignItems: 'baseline',
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '1px',
                        background: 'var(--tk-text-faint)',
                        flex: 'none',
                        marginTop: '10px',
                        display: 'inline-block',
                      }}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="btn-gold"
              onClick={() => navigate('/login')}
              style={{ alignSelf: 'flex-start', marginTop: '2rem' }}
            >
              List your work
            </button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ── Editorial footer mark ──────────────────────────────────────── */}
      <section style={{ padding: '6rem 2rem 4rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ borderTop: '1px solid var(--tk-border)', paddingTop: '2.5rem' }}>
          <div
            className="font-editorial"
            style={{
              fontSize: 'clamp(5rem, 15vw, 13rem)',
              lineHeight: 0.85,
              letterSpacing: '-0.04em',
              color: 'var(--tk-text)',
              fontStyle: 'italic',
              opacity: 0.12,
              userSelect: 'none',
            }}
          >
            styleja.
          </div>
        </div>
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.6875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--tk-text-faint)',
          }}
        >
          <span>
            © {new Date().getFullYear()} {BRAND.name}
          </span>
          <span>Kingston · Montego Bay · Ocho Rios</span>
          <span>Jamaica</span>
        </div>
      </section>
    </div>
  );
};

export default Home;
