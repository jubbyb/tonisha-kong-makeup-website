import React, { useEffect, useState } from 'react';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json() as Promise<Service[]>)
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load services.');
        setLoading(false);
      });
  }, []);

  const handleBookNow = (service: Service) => {
    setSelectedService(service);
    setShowModal(true);
    setSuccess(false);
    setSubmitError(null);
    setName('');
    setEmail('');
    setPhone('');
    setDate('');
    setMessage('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          service: selectedService?.name,
          date,
          message,
        }),
      });

      if (!res.ok) {
        const { error: err } = (await res.json()) as { error: string };
        throw new Error(err ?? 'Booking failed');
      }

      setSuccess(true);
      setTimeout(() => setShowModal(false), 1800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit booking.');
    } finally {
      setSubmitting(false);
    }
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
            {service.image_url && (
              <div style={{ overflow: 'hidden', height: '220px' }}>
                <img
                  src={service.image_url}
                  alt={service.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')
                  }
                />
              </div>
            )}
            <div
              style={{
                padding: '2rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
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
              </div>

              <div style={{ width: '30px', height: '1px', background: 'var(--tk-border-soft)' }} />

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
              padding: '3rem',
              width: '100%',
              maxWidth: '520px',
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

            <p
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--tk-gold)',
                marginBottom: '0.5rem',
              }}
            >
              Reserve Your Session
            </p>
            <h3
              className="font-display"
              style={{
                fontSize: '1.8rem',
                fontWeight: 300,
                color: 'var(--tk-text)',
                marginBottom: '2.5rem',
              }}
            >
              {selectedService?.name}
            </h3>

            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {[
                { label: 'Full Name', type: 'text', value: name, setter: setName, required: true },
                { label: 'Email Address', type: 'email', value: email, setter: setEmail, required: true },
                { label: 'Phone Number', type: 'tel', value: phone, setter: setPhone, required: false },
              ].map(({ label, type, value, setter, required }) => (
                <div key={label}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.62rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--tk-text-dim)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    className="input-luxury"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    required={required}
                    placeholder={label}
                  />
                </div>
              ))}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--tk-text-dim)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Service
                </label>
                <input
                  type="text"
                  className="input-luxury"
                  value={selectedService?.name ?? ''}
                  disabled
                  readOnly
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--tk-text-dim)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Preferred Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="input-luxury"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--tk-text-dim)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Additional Notes
                </label>
                <textarea
                  className="input-luxury"
                  placeholder="Any additional details or requests..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="btn-gold"
                disabled={submitting}
                style={{ marginTop: '0.5rem' }}
              >
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>

              {success && (
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--tk-gold)',
                    letterSpacing: '0.1em',
                  }}
                >
                  Booking confirmed — we'll be in touch.
                </p>
              )}
              {submitError && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-error)' }}>
                  {submitError}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
