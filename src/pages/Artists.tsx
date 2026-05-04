import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildWhatsAppUrl, defaultBookingMessage } from '../lib/whatsapp';

interface Industry {
  id: number;
  slug: string;
  name: string;
}

interface Artist {
  id: number;
  slug: string | null;
  name: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
  location: string | null;
  whatsapp_number: string | null;
  industries: { slug: string; name: string }[];
}

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeIndustry = searchParams.get('industry') ?? '';

  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<Industry[]>)
      .then(setIndustries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeIndustry ? `/api/artists?industry=${activeIndustry}` : '/api/artists';
    fetch(url)
      .then((r) => r.json() as Promise<Artist[]>)
      .then((data) => { setArtists(data); setLoading(false); })
      .catch(() => { setError('Failed to load artists.'); setLoading(false); });
  }, [activeIndustry]);

  const setIndustry = (slug: string) => {
    if (slug) setSearchParams({ industry: slug });
    else setSearchParams({});
  };

  return (
    <div style={{ background: 'var(--tk-bg)', minHeight: '100vh', transition: 'background-color 0.35s ease' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 2rem 2rem' }}>
        <p
          className="anim-slide-right"
          style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--tk-gold)', marginBottom: '1rem' }}
        >
          Our Roster
        </p>
        <h1
          className="anim-fade-up delay-1 font-display"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 300, lineHeight: 1.05, color: 'var(--tk-text)', marginBottom: '2rem' }}
        >
          Artists
        </h1>

        {/* Industry filter pills */}
        {industries.length > 0 && (
          <div
            className="anim-fade-up delay-2"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '3rem' }}
          >
            <button
              onClick={() => setIndustry('')}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                border: `1px solid ${!activeIndustry ? 'var(--tk-gold)' : 'var(--tk-border)'}`,
                background: !activeIndustry ? 'var(--tk-gold)' : 'transparent',
                color: !activeIndustry ? 'var(--tk-bg)' : 'var(--tk-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              All
            </button>
            {industries.map((ind) => (
              <button
                key={ind.slug}
                onClick={() => setIndustry(ind.slug)}
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  border: `1px solid ${activeIndustry === ind.slug ? 'var(--tk-gold)' : 'var(--tk-border)'}`,
                  background: activeIndustry === ind.slug ? 'var(--tk-gold)' : 'transparent',
                  color: activeIndustry === ind.slug ? 'var(--tk-bg)' : 'var(--tk-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {ind.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 6rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <span className="loading loading-spinner loading-lg" style={{ color: 'var(--tk-gold)' }} />
          </div>
        ) : error ? (
          <div style={{ color: 'var(--color-error)', textAlign: 'center', padding: '4rem' }}>{error}</div>
        ) : artists.length === 0 ? (
          <div style={{ color: 'var(--tk-text-dim)', textAlign: 'center', padding: '4rem', fontSize: '0.9rem' }}>
            No artists available{activeIndustry ? ` for ${activeIndustry}` : ''} at this time.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {artists.map((artist, i) => (
              <div
                key={artist.id}
                className={`lux-card anim-fade-up delay-${Math.min(i + 1, 8)}`}
                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() => navigate(`/artists/${artist.slug ?? artist.id}`)}
              >
                <div style={{ height: '220px', background: 'var(--tk-bg-deep)', overflow: 'hidden', flexShrink: 0 }}>
                  {artist.photo_url ? (
                    <img
                      src={artist.photo_url}
                      alt={artist.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', transition: 'transform 0.5s ease' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem', color: 'var(--tk-border)' }}>
                      {artist.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                  {/* Industry chips */}
                  {artist.industries.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {artist.industries.map((ind) => (
                        <span
                          key={ind.slug}
                          style={{
                            fontSize: '0.55rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            border: '1px solid var(--tk-gold)',
                            color: 'var(--tk-gold)',
                            padding: '0.2rem 0.5rem',
                          }}
                        >
                          {ind.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: 400, color: 'var(--tk-text)', lineHeight: 1.1 }}>
                    {artist.name}
                  </h2>

                  {artist.location && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--tk-text-faint)' }}>{artist.location}</p>
                  )}

                  {artist.bio && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--tk-text-dim)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {artist.bio}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tk-gold)' }}>
                      View &amp; Book →
                    </span>
                    {buildWhatsAppUrl(artist.whatsapp_number, defaultBookingMessage(artist.name)) && (
                      <a
                        href={buildWhatsAppUrl(artist.whatsapp_number, defaultBookingMessage(artist.name))!}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '0.6rem',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--tk-text-faint)',
                          textDecoration: 'none',
                          border: '1px solid var(--tk-border)',
                          padding: '0.25rem 0.6rem',
                          transition: 'color 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#25d366';
                          (e.currentTarget as HTMLElement).style.borderColor = '#25d366';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--tk-text-faint)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--tk-border)';
                        }}
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
