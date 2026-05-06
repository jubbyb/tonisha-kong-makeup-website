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

const SORT_OPTIONS = ['Most loved', 'Soonest', 'Price: low', 'Distance'];

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState('Most loved');
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

  const activeIndustryName = industries.find((i) => i.slug === activeIndustry)?.name;

  return (
    <div style={{ background: 'var(--tk-bg)', minHeight: '100vh', transition: 'background-color 0.35s ease' }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--tk-border)', padding: '1.25rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Inline search */}
          <div style={{ flex: 1, maxWidth: '680px', display: 'flex', alignItems: 'center', background: 'var(--tk-bg-raised)', border: '1px solid var(--tk-border)', borderRadius: '999px', padding: '0.375rem 0.375rem 0.375rem 1.125rem', gap: '0.5rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tk-text-faint)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search makeup, nails, hair…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--tk-text)', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
            />
            <button style={{ padding: '0.4375rem 1rem', borderRadius: '999px', background: 'var(--tk-text)', color: 'var(--tk-bg)', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500 }}>
              Search
            </button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <HeartIcon />
          </div>
        </div>
      </div>

      {/* ── Category pills ──────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--tk-border)', padding: '1.25rem 2rem', overflow: 'auto' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className={`pill-btn${!activeIndustry ? ' active' : ''}`} onClick={() => setIndustry('')}>
            All ({artists.length || '—'})
          </button>
          {industries.map((ind) => (
            <button key={ind.slug} className={`pill-btn${activeIndustry === ind.slug ? ' active' : ''}`} onClick={() => setIndustry(ind.slug)}>
              {ind.name}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="pill-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
            Filters
          </button>
        </div>
      </div>

      {/* ── Results header ──────────────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 2rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-editorial" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--tk-text)', margin: 0 }}>
            {!loading && <span className="num">{artists.length}</span>}{' '}
            {activeIndustryName ? <span style={{ fontStyle: 'italic' }}>{activeIndustryName}</span> : <span style={{ fontStyle: 'italic' }}>beauty</span>} pros near Kingston
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--tk-text-dim)', marginTop: '0.5rem' }}>
            Sorted by {sort.toLowerCase()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map((s) => (
            <button key={s} className={`pill-btn${sort === s ? ' active' : ''}`} onClick={() => setSort(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results grid ────────────────────────────────────────────── */}
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
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {artists.map((artist, i) => {
                const nameParts = artist.name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ');
                const category = artist.industries[0]?.name ?? '';
                const whatsappUrl = buildWhatsAppUrl(artist.whatsapp_number, defaultBookingMessage(artist.name));

                return (
                  <div key={artist.id} className={`editorial-card anim-fade-up delay-${Math.min(i + 1, 8)}`}
                    onClick={() => navigate(`/artists/${artist.slug ?? artist.id}`)}>

                    {/* Cover image */}
                    <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', borderRadius: '4px', marginBottom: '0.875rem', background: 'var(--tk-bg-raised)' }}>
                      {artist.photo_url ? (
                        <img src={artist.photo_url} alt={artist.name}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}/>
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="font-editorial" style={{ fontSize: '4rem', color: 'var(--tk-border)', fontStyle: 'italic' }}>{artist.name.charAt(0)}</span>
                        </div>
                      )}

                      {/* Category badge */}
                      {category && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '999px' }}>
                          {category}
                        </div>
                      )}

                      {/* Save heart */}
                      <div style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '999px', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}
                        onClick={(e) => e.stopPropagation()}>
                        <HeartIcon />
                      </div>

                      {/* Availability dot */}
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.95)', color: '#000', fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#22a06b', flexShrink: 0 }} />
                        Available to book
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
                      <div>
                        <div className="font-editorial" style={{ fontSize: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--tk-text)' }}>
                          {firstName} <span style={{ fontStyle: 'italic' }}>{lastName}</span>
                        </div>
                        {(artist.specialties || artist.bio) && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--tk-text-dim)', marginTop: '3px' }}>
                            {artist.specialties ?? (artist.bio ?? '').slice(0, 55)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--tk-border)', fontSize: '0.75rem', color: 'var(--tk-text-dim)' }}>
                      {artist.location ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <PinIcon /> {artist.location}
                        </span>
                      ) : <span />}
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {whatsappUrl && (
                          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--tk-text-faint)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--tk-border)', padding: '0.2rem 0.5rem', borderRadius: '999px', transition: 'color 0.2s, border-color 0.2s' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#25d366'; (e.currentTarget as HTMLElement).style.borderColor = '#25d366'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--tk-text-faint)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--tk-border)'; }}>
                            WhatsApp
                          </a>
                        )}
                        <span style={{ color: 'var(--tk-gold)', fontWeight: 500 }}>View →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
              <button className="pill-btn" style={{ padding: '0.75rem 2rem' }}>
                Load more pros
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.5rem' }}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
