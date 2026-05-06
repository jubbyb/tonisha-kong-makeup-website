import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BookingFlow from '../components/BookingFlow';

interface CatalogService {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  duration_min: number;
  category: string;
  subcategory: string;
}

interface CatalogResponse {
  id: number;
  name: string;
  subcategories: {
    id: number;
    name: string;
    services: {
      id: number;
      name: string;
      description: string | null;
      price: number | null;
      duration_min: number;
    }[];
  }[];
}

interface Industry {
  id: number;
  slug: string;
  name: string;
}

const Services: React.FC = () => {
  const [allServices, setAllServices] = useState<CatalogService[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);

  const activeIndustry = searchParams.get('industry') ?? '';

  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<Industry[]>)
      .then(setIndustries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeIndustry
      ? `/api/service-catalog?industry=${activeIndustry}`
      : '/api/service-catalog';
    fetch(url)
      .then((res) => res.json() as Promise<CatalogResponse[]>)
      .then((catalog) => {
        const flat: CatalogService[] = [];
        for (const cat of catalog) {
          if (cat.name === 'Lessons & Education') continue;
          for (const sub of cat.subcategories) {
            for (const svc of sub.services) {
              flat.push({ ...svc, category: cat.name, subcategory: sub.name });
            }
          }
        }
        setAllServices(flat);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load services.');
        setLoading(false);
      });
  }, [activeIndustry]);

  const setIndustry = (slug: string) => {
    if (slug) setSearchParams({ industry: slug });
    else setSearchParams({});
  };

  const handleBookNow = (service: CatalogService) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  // Group services by category
  const grouped = allServices.reduce<Record<string, CatalogService[]>>((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped);

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        transition: 'background-color 0.35s ease',
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 2rem 2rem' }}>
        <p
          className="anim-slide-right"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '1rem',
          }}
        >
          What We Offer
        </p>
        <h1
          className="anim-fade-up delay-1 font-display"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: 'var(--ink)',
            marginBottom: '2rem',
          }}
        >
          Services
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
                border: `1px solid ${!activeIndustry ? 'var(--accent)' : 'var(--line-2)'}`,
                background: !activeIndustry ? 'var(--accent)' : 'transparent',
                color: !activeIndustry ? 'var(--bg)' : 'var(--ink-2)',
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
                  border: `1px solid ${activeIndustry === ind.slug ? 'var(--accent)' : 'var(--line-2)'}`,
                  background: activeIndustry === ind.slug ? 'var(--accent)' : 'transparent',
                  color: activeIndustry === ind.slug ? 'var(--bg)' : 'var(--ink-2)',
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

      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
          }}
        >
          Loading Services...
        </div>
      ) : error ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </div>
      ) : groupKeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--ink-2)' }}>
          No services available{activeIndustry ? ` for ${activeIndustry}` : ''}.
        </div>
      ) : (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 6rem' }}>
          {groupKeys.map((category) => (
            <div key={category} style={{ marginBottom: '4rem' }}>
              {/* Category heading */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div className="divider-gold" />
                <h2
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {category}
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1px',
                  background: 'var(--line-2)',
                  border: '1px solid var(--line-2)',
                }}
              >
                {grouped[category].map((service, i) => (
                  <div
                    key={service.id}
                    className={`anim-fade-up delay-${Math.min(i + 1, 8)} editorial-card-base`}
                    style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}
                  >
                    <div
                      style={{
                        padding: '2rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.6rem',
                          letterSpacing: '0.25em',
                          textTransform: 'uppercase',
                          color: 'var(--accent)',
                          margin: 0,
                        }}
                      >
                        {service.subcategory}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <h3
                          className="font-display"
                          style={{
                            fontSize: '1.4rem',
                            fontWeight: 400,
                            color: 'var(--ink)',
                            lineHeight: 1.2,
                          }}
                        >
                          {service.name}
                        </h3>
                        {service.price != null && (
                          <span
                            style={{
                              fontFamily: "'Instrument Serif', 'Cormorant Garamond', serif",
                              fontSize: '1.2rem',
                              fontWeight: 300,
                              color: 'var(--accent)',
                              whiteSpace: 'nowrap',
                              marginLeft: '1rem',
                            }}
                          >
                            ${service.price}
                          </span>
                        )}
                      </div>

                      <div style={{ width: '30px', height: '1px', background: 'var(--line)' }} />

                      {service.description && (
                        <p
                          style={{
                            fontSize: '0.88rem',
                            lineHeight: 1.7,
                            color: 'var(--ink-2)',
                            flex: 1,
                          }}
                        >
                          {service.description}
                        </p>
                      )}

                      <p style={{ fontSize: '0.75rem', color: 'var(--ink-2)', margin: 0 }}>
                        {service.duration_min} min
                      </p>

                      <button
                        className="btn-accent"
                        onClick={() => handleBookNow(service)}
                        style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'oklch(5% 0 0 / 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line-2)',
              padding: '2.5rem',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            className="anim-fade-up"
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-3)',
                fontSize: '1.2rem',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink-3)')}
            >
              ✕
            </button>

            <BookingFlow preselectedService={selectedService?.name} onClose={handleCloseModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
