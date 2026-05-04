import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

interface Industry {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  artist_count: number;
  category_count: number;
}

interface Artist {
  id: number;
  slug: string | null;
  name: string;
  bio: string | null;
  photo_url: string | null;
  location: string | null;
  industries: { slug: string; name: string }[];
}

interface CatalogCategory {
  id: number;
  name: string;
  subcategories: {
    id: number;
    name: string;
    services: { id: number; name: string; price: number | null; duration_min: number }[];
  }[];
}

export default function IndustryHub() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [industry, setIndustry] = useState<Industry | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/industries/${slug}`).then(async (r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<Industry>;
      }),
      fetch(`/api/artists?industry=${slug}`).then((r) => r.json() as Promise<Artist[]>),
      fetch(`/api/service-catalog?industry=${slug}`).then((r) => r.json() as Promise<CatalogCategory[]>),
    ])
      .then(([ind, arts, cat]) => {
        if (ind) setIndustry(ind);
        setArtists(arts);
        setCatalog(cat);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="loading loading-spinner loading-lg" style={{ color: 'var(--tk-gold)' }} />
      </div>
    );
  }

  if (notFound || !industry) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--tk-text-dim)' }}>Industry not found.</p>
        <Link to="/industries" style={{ color: 'var(--tk-gold)', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>← Back to Industries</Link>
      </div>
    );
  }

  const previewServices = catalog.flatMap((cat) =>
    cat.subcategories.flatMap((sub) => sub.services.map((svc) => ({ ...svc, category: cat.name }))),
  ).slice(0, 6);

  return (
    <div style={{ background: 'var(--tk-bg)', minHeight: '100vh', transition: 'background-color 0.35s ease' }}>
      {/* Hero */}
      <section
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '5rem 2rem 4rem',
          borderBottom: '1px solid var(--tk-border)',
        }}
      >
        <Link
          to="/industries"
          style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tk-text-faint)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}
        >
          ← Industries
        </Link>
        <h1
          className="anim-fade-up delay-1 font-display"
          style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 300, lineHeight: 0.95, color: 'var(--tk-text)', marginBottom: '1.5rem' }}
        >
          {industry.name}
        </h1>
        {industry.tagline && (
          <p className="anim-fade-up delay-2" style={{ fontSize: '1rem', color: 'var(--tk-text-dim)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '2rem' }}>
            {industry.tagline}
          </p>
        )}
        <div className="anim-fade-up delay-3" style={{ display: 'flex', gap: '2rem' }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tk-text-faint)' }}>
            {industry.artist_count} artist{industry.artist_count !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tk-text-faint)' }}>
            {industry.category_count} service categor{industry.category_count !== 1 ? 'ies' : 'y'}
          </span>
        </div>
      </section>

      {/* Artists */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="divider-gold" />
            <h2 style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--tk-text-dim)' }}>
              Artists
            </h2>
          </div>
          <Link
            to={`/artists?industry=${slug}`}
            style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tk-gold)', textDecoration: 'none' }}
          >
            View all →
          </Link>
        </div>

        {artists.length === 0 ? (
          <p style={{ color: 'var(--tk-text-dim)', fontSize: '0.9rem' }}>No artists available for this industry yet.</p>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}
          >
            {artists.slice(0, 6).map((artist, i) => (
              <button
                key={artist.id}
                className={`lux-card anim-fade-up delay-${Math.min(i + 1, 6)}`}
                onClick={() => navigate(`/artists/${artist.slug ?? artist.id}`)}
                style={{ padding: 0, border: 'none', cursor: 'pointer', textAlign: 'left', background: 'var(--tk-bg-raised)', overflow: 'hidden' }}
              >
                <div style={{ height: '200px', background: 'var(--tk-bg-deep)', overflow: 'hidden' }}>
                  {artist.photo_url ? (
                    <img src={artist.photo_url} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem', color: 'var(--tk-border)' }}>
                      {artist.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--tk-text)', marginBottom: '0.4rem' }}>
                    {artist.name}
                  </h3>
                  {artist.location && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--tk-text-faint)', marginBottom: '0.75rem' }}>{artist.location}</p>
                  )}
                  {artist.bio && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--tk-text-dim)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {artist.bio}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Service preview */}
      {previewServices.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div className="divider-gold" />
              <h2 style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--tk-text-dim)' }}>
                Services
              </h2>
            </div>
            <Link
              to={`/services?industry=${slug}`}
              style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--tk-gold)', textDecoration: 'none' }}
            >
              Browse all →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--tk-border)', border: '1px solid var(--tk-border)' }}>
            {previewServices.map((svc, i) => (
              <div
                key={svc.id}
                className={`lux-card anim-fade-up delay-${Math.min(i + 1, 6)}`}
                style={{ padding: '1.75rem', background: 'var(--tk-bg)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--tk-gold)', margin: 0 }}>
                  {svc.category}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 400, color: 'var(--tk-text)' }}>
                    {svc.name}
                  </h3>
                  {svc.price != null && (
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', color: 'var(--tk-gold)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                      ${svc.price}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--tk-text-dim)', margin: 0 }}>{svc.duration_min} min</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
