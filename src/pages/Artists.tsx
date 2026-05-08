import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Pill, Logo, SmartImg, Rating, Btn } from '../components/ui';
import { MapView } from '../components/MapView';
import type { MapArtist } from '../components/MapView';

interface Industry {
  id: number;
  slug: string;
  name: string;
}

interface Parish {
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
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
}

const SORT_OPTIONS = ['Most loved', 'Soonest', 'Price: low', 'Distance'];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function PinIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HeartIcon() {
  return (
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
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ListIcon() {
  return (
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function MapIcon() {
  return (
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
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

/** A compact horizontal artist card used in the map bottom sheet on mobile */
function ArtistCompactCard({
  artist,
  highlighted,
  onClick,
}: {
  artist: Artist;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: '8px',
        border: `1px solid ${highlighted ? 'var(--accent)' : 'var(--line)'}`,
        background: highlighted
          ? 'color-mix(in srgb, var(--accent) 8%, var(--bg-card))'
          : 'var(--bg-card)',
        cursor: 'pointer',
        flexShrink: 0,
        width: '240px',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '6px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <SmartImg
          src={artist.photo_url || ''}
          alt={artist.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: '1rem',
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {artist.name}
        </div>
        {artist.location && (
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--ink-2)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              marginTop: '2px',
            }}
          >
            <PinIcon /> {artist.location}
          </div>
        )}
        {artist.rating && (
          <div style={{ marginTop: '4px' }}>
            <Rating value={artist.rating} count={artist.review_count} size={10} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState('Most loved');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  const activeIndustry = searchParams.get('industry') ?? '';
  const activeParish = searchParams.get('parish') ?? '';
  const viewMode = searchParams.get('view') === 'map' ? 'map' : 'list';
  const isDesktop = useIsDesktop();

  // ── Fetch industries ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<Industry[]>)
      .then(setIndustries)
      .catch(() => {});
  }, []);

  // ── Fetch parishes ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/parishes')
      .then((r) => r.json() as Promise<Parish[]>)
      .then(setParishes)
      .catch(() => {});
  }, []);

  // ── Fetch artists ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeIndustry) params.set('industry', activeIndustry);
    if (activeParish) params.set('parish', activeParish);
    const qs = params.toString();
    fetch(`/api/artists${qs ? `?${qs}` : ''}`)
      .then((r) => r.json() as Promise<Artist[]>)
      .then((data) => {
        setArtists(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load artists.');
        setLoading(false);
      });
  }, [activeIndustry, activeParish]);

  // ── Param helpers ────────────────────────────────────────────────────────
  const setIndustry = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('industry', slug);
    else next.delete('industry');
    setSearchParams(next);
  };

  const setParish = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('parish', slug);
    else next.delete('parish');
    setSearchParams(next);
  };

  const setView = (mode: 'list' | 'map') => {
    const next = new URLSearchParams(searchParams);
    if (mode === 'map') next.set('view', 'map');
    else next.delete('view');
    setSearchParams(next);
    setHighlightedId(null);
  };

  // ── Map artist click ─────────────────────────────────────────────────────
  const handleArtistMapClick = (artist: MapArtist) => {
    setHighlightedId(artist.id);
    // Scroll the card into view in the list panel
    const card = cardRefs.current[artist.id];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const activeIndustryName = industries.find((i) => i.slug === activeIndustry)?.name;

  // ── Artist card grid (shared between list and split-screen) ──────────────
  const artistGrid = (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'map' ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: viewMode === 'map' ? '1rem' : '1.5rem',
        }}
      >
        {artists.map((artist) => {
          const nameParts = artist.name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          const category = artist.industries[0]?.name ?? '';
          const isHighlighted = highlightedId === artist.id;

          return (
            <div
              key={artist.id}
              ref={(el) => {
                cardRefs.current[artist.id] = el;
              }}
              style={{
                cursor: 'pointer',
                borderRadius: viewMode === 'map' ? '8px' : undefined,
                outline: isHighlighted ? '2px solid var(--accent)' : undefined,
                outlineOffset: '2px',
                transition: 'outline 0.2s',
              }}
              onClick={() => navigate(`/artists/${artist.slug ?? artist.id}`)}
            >
              {/* Cover image */}
              <div
                style={{
                  position: 'relative',
                  aspectRatio: viewMode === 'map' ? '16/9' : '4/5',
                  overflow: 'hidden',
                  borderRadius: '6px',
                  marginBottom: '0.875rem',
                }}
              >
                <SmartImg
                  src={artist.photo_url || ''}
                  alt={artist.name}
                  style={{ position: 'absolute', inset: 0 }}
                />

                {/* Category badge */}
                {category && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#fff',
                      background: 'rgba(0,0,0,0.45)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    {category}
                  </div>
                )}

                {/* Save heart */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <HeartIcon />
                </div>

                {/* Availability dot */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#000',
                    fontSize: '0.6875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '999px',
                      background: '#22a06b',
                      flexShrink: 0,
                    }}
                  />
                  Available this week
                </div>
              </div>

              {/* Name + rating */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'Instrument Serif, serif',
                      fontSize: '1.5rem',
                      lineHeight: 1.1,
                      letterSpacing: '-0.01em',
                      color: 'var(--ink)',
                    }}
                  >
                    {firstName} <span style={{ fontStyle: 'italic' }}>{lastName}</span>
                  </div>
                  {(artist.specialties || artist.bio) && (
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--ink-2)',
                        marginTop: '3px',
                      }}
                    >
                      {artist.specialties ?? (artist.bio ?? '').slice(0, 55)}
                    </div>
                  )}
                </div>
                {artist.rating && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Rating value={artist.rating} count={artist.review_count} size={12} />
                  </div>
                )}
              </div>

              {/* Location + price */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--line)',
                  fontSize: '0.75rem',
                  color: 'var(--ink-2)',
                }}
              >
                {artist.location ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <PinIcon /> {artist.location}
                  </span>
                ) : (
                  <span />
                )}
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>View →</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
        <Btn variant="ghost">Load more pros</Btn>
      </div>
    </>
  );

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        transition: 'background-color 0.35s ease',
      }}
    >
      {/* ── Top nav ─────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--line)', padding: '1.25rem 2rem' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <Logo size={22} />
          {/* Inline search */}
          <div
            style={{
              flex: 1,
              maxWidth: '720px',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
              borderRadius: '999px',
              padding: '0.375rem 0.375rem 0.375rem 1.125rem',
              gap: '0.5rem',
            }}
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
              style={{ color: 'var(--ink-3)', flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="Search makeup, nails, hair…"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--ink)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              }}
            />
            <Btn variant="solid" size="sm">
              Search
            </Btn>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: 'var(--ink-2)',
            }}
          >
            <HeartIcon />
          </div>
        </div>
      </div>

      {/* ── Category pills + Filters trigger ─────────────────────────── */}
      <div
        style={{
          borderBottom: '1px solid var(--line)',
          padding: '0.875rem 1rem',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {/* Industry pills (wrap on narrow screens, never overflow) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            <Pill active={!activeIndustry} onClick={() => setIndustry('')}>
              All ({artists.length || '—'})
            </Pill>
            {industries.map((ind) => (
              <Pill
                key={ind.slug}
                active={activeIndustry === ind.slug}
                onClick={() => setIndustry(ind.slug)}
              >
                {ind.name}
              </Pill>
            ))}
          </div>

          {/* Right cluster: view toggle + Filters trigger */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: '999px',
                padding: '3px',
              }}
            >
              <button
                onClick={() => setView('list')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: viewMode === 'list' ? 'var(--ink)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--bg)' : 'var(--ink-2)',
                  transition: 'background 0.18s, color 0.18s',
                }}
              >
                <ListIcon /> List
              </button>
              <button
                onClick={() => setView('map')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: viewMode === 'map' ? 'var(--ink)' : 'transparent',
                  color: viewMode === 'map' ? 'var(--bg)' : 'var(--ink-2)',
                  transition: 'background 0.18s, color 0.18s',
                }}
              >
                <MapIcon /> Map
              </button>
            </div>

            <Pill onClick={() => setFilterDialogOpen(true)} active={!!activeParish}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '4px', verticalAlign: 'middle' }}
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              Filters{activeParish ? ' · 1' : ''}
            </Pill>
          </div>
        </div>
      </div>

      {/* ── Results header ──────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: viewMode === 'map' ? 'none' : '1280px',
          margin: '0 auto',
          padding: '2rem 2rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            {!loading && <span className="num">{artists.length}</span>}{' '}
            {activeIndustryName ? (
              <span style={{ fontStyle: 'italic' }}>{activeIndustryName}</span>
            ) : (
              <span style={{ fontStyle: 'italic' }}>beauty</span>
            )}{' '}
            pros near Kingston
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', marginTop: '0.5rem' }}>
            Showing within 10 km · available this week · sorted by {sort.toLowerCase()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map((s) => (
            <Pill key={s} active={sort === s} onClick={() => setSort(s)}>
              {s}
            </Pill>
          ))}
        </div>
      </div>

      {/* ── Results body ────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="loading loading-spinner loading-lg" style={{ color: 'var(--accent)' }} />
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent)', textAlign: 'center', padding: '4rem' }}>{error}</div>
      ) : artists.length === 0 ? (
        <div
          style={{
            color: 'var(--ink-2)',
            textAlign: 'center',
            padding: '4rem',
            fontSize: '0.9rem',
          }}
        >
          No artists available{activeIndustry ? ` for ${activeIndustry}` : ''} at this time.
        </div>
      ) : viewMode === 'list' ? (
        /* ── LIST view ─────────────────────────────────────────────── */
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 6rem' }}>
          {artistGrid}
        </div>
      ) : /* ── MAP view ──────────────────────────────────────────────── */
      isDesktop ? (
        /* Desktop split: list left (40%) + map right (60%) */
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0,
          }}
        >
          {/* Left: scrollable card list */}
          <div
            ref={listRef}
            style={{
              width: '40%',
              overflowY: 'auto',
              height: 'calc(100vh - var(--navbar-h, 64px) - var(--filter-h, 130px))',
              padding: '0 1.25rem 4rem 2rem',
              paddingTop: '0',
            }}
          >
            {artistGrid}
          </div>
          {/* Right: sticky map */}
          <div
            style={{
              width: '60%',
              position: 'sticky',
              top: 0,
              height: 'calc(100vh - var(--navbar-h, 64px) - var(--filter-h, 130px))',
            }}
          >
            <MapView
              artists={artists}
              onArtistClick={handleArtistMapClick}
              highlightedId={highlightedId}
            />
          </div>
        </div>
      ) : (
        /* Mobile: full-screen map + bottom sheet */
        <div>
          {/* Full map */}
          <div style={{ height: '60vh', position: 'relative' }}>
            <MapView
              artists={artists}
              onArtistClick={handleArtistMapClick}
              highlightedId={highlightedId}
            />
          </div>

          {/* Bottom sheet: horizontally scrollable compact cards */}
          <div
            style={{
              height: '40vh',
              background: 'var(--bg)',
              borderTop: '1px solid var(--line)',
              padding: '1rem',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
              }}
            >
              {artists.map((artist) => (
                <ArtistCompactCard
                  key={artist.id}
                  artist={artist}
                  highlighted={highlightedId === artist.id}
                  onClick={() => navigate(`/artists/${artist.slug ?? artist.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Filters dialog (parish selection) ─────────────────────────── */}
      {filterDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter artists"
          onClick={() => setFilterDialogOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-elev)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: '1.25rem',
                  color: 'var(--ink)',
                }}
              >
                Filter by parish
              </div>
              <button
                onClick={() => setFilterDialogOpen(false)}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-2)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  padding: '0.25rem 0.5rem',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: '1rem 1.25rem',
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <Pill
                active={!activeParish}
                onClick={() => {
                  setParish('');
                  setFilterDialogOpen(false);
                }}
              >
                All parishes
              </Pill>
              {parishes.map((p) => (
                <Pill
                  key={p.slug}
                  active={activeParish === p.slug}
                  onClick={() => {
                    setParish(p.slug);
                    setFilterDialogOpen(false);
                  }}
                >
                  {p.name}
                </Pill>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                borderTop: '1px solid var(--line)',
              }}
            >
              <button
                onClick={() => {
                  setParish('');
                  setFilterDialogOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-2)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Clear
              </button>
              <Btn variant="solid" size="sm" onClick={() => setFilterDialogOpen(false)}>
                Done
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
