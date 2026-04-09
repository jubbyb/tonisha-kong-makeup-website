import React, { useEffect, useState } from 'react';
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

const Services: React.FC = () => {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);

  useEffect(() => {
    fetch('/api/service-catalog')
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
        setServices(flat);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load services.');
        setLoading(false);
      });
  }, []);

  const handleBookNow = (service: CatalogService) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--tk-text-dim)',
        }}
      >
        Loading Services...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--color-error)',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--tk-bg)', minHeight: '100vh', transition: 'background-color 0.35s ease' }}>
      {/* Header */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '5rem 2rem 3rem',
        }}
      >
        <p
          className="anim-slide-right"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--tk-gold)',
            marginBottom: '1rem',
          }}
        >
          What I Offer
        </p>
        <h1
          className="anim-fade-up delay-1 font-display"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: 'var(--tk-text)',
          }}
        >
          Services
        </h1>
      </div>

      {/* Services grid */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 2rem 6rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1px',
          background: 'var(--tk-border)',
          border: '1px solid var(--tk-border)',
        }}
      >
        {services.map((service, i) => (
          <div
            key={service.id}
            className={`anim-fade-up delay-${Math.min(i + 1, 8)} lux-card`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--tk-bg)',
            }}
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
                  color: 'var(--tk-gold)',
                  margin: 0,
                }}
              >
                {service.category}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <h2
                  className="font-display"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 400,
                    color: 'var(--tk-text)',
                    lineHeight: 1.2,
                  }}
                >
                  {service.name}
                </h2>
                {service.price != null && (
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '1.2rem',
                      fontWeight: 300,
                      color: 'var(--tk-gold)',
                      whiteSpace: 'nowrap',
                      marginLeft: '1rem',
                    }}
                  >
                    ${service.price}
                  </span>
                )}
              </div>

              <div style={{ width: '30px', height: '1px', background: 'var(--tk-border-soft)' }} />

              {service.description && (
                <p
                  style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    color: 'var(--tk-text-dim)',
                    flex: 1,
                  }}
                >
                  {service.description}
                </p>
              )}

              <p style={{ fontSize: '0.75rem', color: 'var(--tk-text-dim)', margin: 0 }}>
                {service.duration_min} min
              </p>

              <button
                className="btn-gold"
                onClick={() => handleBookNow(service)}
                style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

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
              background: 'var(--tk-bg-raised)',
              border: '1px solid var(--tk-border)',
              padding: '2.5rem',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            className="anim-fade-up"
          >
            {/* Close */}
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--tk-text-faint)',
                fontSize: '1.2rem',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--tk-text)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--tk-text-faint)')}
            >
              ✕
            </button>

            <BookingFlow
              preselectedService={selectedService?.name}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
