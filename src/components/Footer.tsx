import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer
      style={{
        background: 'oklch(6% 0.005 60)',
        borderTop: '1px solid oklch(18% 0.005 60)',
        padding: '4rem 2rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '3rem',
          marginBottom: '3rem',
        }}
        className="footer-grid"
      >
        {/* Brand */}
        <div>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.4rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              color: 'oklch(71% 0.11 78)',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            Tonisha Kong
          </p>
          <p
            style={{
              fontSize: '0.85rem',
              lineHeight: 1.7,
              color: 'oklch(40% 0.01 60)',
              maxWidth: '320px',
            }}
          >
            Professional makeup artist based in Kingston, Jamaica. Specializing in bridal, editorial, and beauty education.
          </p>

          {/* Social icons */}
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <a
              href="https://www.instagram.com/tonishakong"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              style={{ color: 'oklch(40% 0.01 60)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(71% 0.11 78)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(40% 0.01 60)')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/p/Tonisha-Kong-Makeup-100064895590278/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              style={{ color: 'oklch(40% 0.01 60)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(71% 0.11 78)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(40% 0.01 60)')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@tonishakong"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              style={{ color: 'oklch(40% 0.01 60)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(71% 0.11 78)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(40% 0.01 60)')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 448 512" fill="currentColor">
                <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/>
              </svg>
            </a>
            <a
              href="https://wa.me/18761234567"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              style={{ color: 'oklch(40% 0.01 60)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(71% 0.11 78)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(40% 0.01 60)')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'oklch(40% 0.01 60)',
              marginBottom: '1.5rem',
            }}
          >
            Navigation
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { to: '/', label: 'Home' },
              { to: '/about', label: 'About' },
              { to: '/services', label: 'Services' },
              { to: '/classes', label: 'Classes' },
              { to: '/artists', label: 'Artists' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  fontSize: '0.82rem',
                  color: 'oklch(40% 0.01 60)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(71% 0.11 78)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(40% 0.01 60)')}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Contact / Theme */}
        <div>
          <p
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'oklch(40% 0.01 60)',
              marginBottom: '1.5rem',
            }}
          >
            Connect
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { to: '/contact', label: 'Contact Us' },
              { to: '/bookings', label: 'Book a Session' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  fontSize: '0.82rem',
                  color: 'oklch(40% 0.01 60)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(71% 0.11 78)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'oklch(40% 0.01 60)')}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          borderTop: '1px solid oklch(18% 0.005 60)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <p
          style={{
            fontSize: '0.72rem',
            color: 'oklch(30% 0.005 60)',
            letterSpacing: '0.05em',
          }}
        >
          © {new Date().getFullYear()} Tonisha Kong Makeup Ltd. All rights reserved.
        </p>

        <p
          style={{
            fontSize: '0.65rem',
            color: 'oklch(25% 0.005 60)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Kingston, Jamaica
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
