import React from 'react';
import { useLocation } from 'react-router-dom';
import BookingFlow from '../components/BookingFlow';

const Bookings: React.FC = () => {
  const location = useLocation();
  const preselectedService: string = (location.state as { service?: { name?: string } } | null)?.service?.name ?? '';

  return (
    <div style={{ background: 'var(--tk-bg)', minHeight: '100vh', transition: 'background-color 0.35s ease' }}>
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
          Reserve Your Session
        </p>
        <h1
          className="anim-fade-up delay-1 font-display"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: 'var(--tk-text)',
            marginBottom: '1rem',
          }}
        >
          Book an
          <br />
          <span style={{ fontStyle: 'italic', color: 'var(--tk-gold)' }}>Appointment</span>
        </h1>
        <p
          className="anim-fade-up delay-2"
          style={{
            fontSize: '0.9rem',
            color: 'var(--tk-text-dim)',
            maxWidth: '480px',
            lineHeight: 1.7,
            marginBottom: '4rem',
          }}
        >
          Select your artist, choose an available time, and we'll take care of the rest.
        </p>
      </div>

      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 2rem 6rem',
          display: 'grid',
          gridTemplateColumns: '1fr 520px',
          gap: '5rem',
          alignItems: 'start',
        }}
        className="bookings-grid"
      >
        {/* Left — decorative info */}
        <div className="anim-fade-up delay-2 bookings-sidebar" style={{ paddingTop: '0.5rem' }}>
          <div className="divider-gold" style={{ marginBottom: '2.5rem' }} />
          {[
            { label: 'Consultation', value: 'All bookings begin with a brief consultation to understand your vision and needs.' },
            { label: 'Preparation', value: 'Come to your appointment with a clean, moisturised face for best results.' },
            { label: 'Cancellation', value: 'Please give at least 24 hours notice if you need to reschedule.' },
          ].map(({ label, value }) => (
            <div key={label} style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--tk-gold)', marginBottom: '0.5rem' }}>
                {label}
              </p>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'var(--tk-text-dim)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Right — booking flow */}
        <div
          className="anim-fade-up delay-3"
          style={{
            border: '1px solid var(--tk-border)',
            padding: '2.5rem',
            background: 'var(--tk-bg-raised)',
          }}
        >
          <BookingFlow preselectedService={preselectedService} />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .bookings-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .bookings-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Bookings;
