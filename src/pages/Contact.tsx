import React, { useState } from 'react';
import { BRAND } from '../constants/brand';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Email is required.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? ''
      : 'Please enter a valid email address.';
  };

  const validatePhone = (v: string) => {
    if (!v.trim()) return '';
    return /^[+\d][\d\s\-().]{6,19}$/.test(v.trim())
      ? ''
      : 'Please enter a valid phone number (digits, spaces, dashes, parentheses).';
  };

  const validateFields = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(phone);
    if (phoneErr) errs.phone = phoneErr;
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting
    const errs = validateFields();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      if (!res.ok) {
        const { error: err } = (await res.json()) as { error: string };
        throw new Error(err ?? 'Failed to send message');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setFieldErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--tk-bg)', minHeight: '100vh', transition: 'background-color 0.35s ease' }}>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '5rem 2rem 6rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6rem',
          alignItems: 'start',
        }}
        className="contact-grid"
      >
        {/* Left — info */}
        <div style={{ paddingTop: '1rem' }}>
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
            Get In Touch
          </p>
          <h1
            className="anim-fade-up delay-1 font-display"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 300,
              lineHeight: 1.05,
              color: 'var(--tk-text)',
              marginBottom: '2rem',
            }}
          >
            Let's Create
            <br />
            <span style={{ fontStyle: 'italic', color: 'var(--tk-gold)' }}>Together</span>
          </h1>

          <div className="divider-gold anim-fade-in delay-2" style={{ marginBottom: '2rem' }} />

          <p
            className="anim-fade-up delay-2"
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.8,
              color: 'var(--tk-text-dim)',
              marginBottom: '3rem',
              maxWidth: '400px',
            }}
          >
            Whether you're booking an artist, exploring our services, or have a general enquiry —
            reach out and we'll get back to you.
          </p>

          {/* Contact details */}
          <div
            className="anim-fade-up delay-3"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {[
              { label: 'Based in', value: BRAND.location },
              { label: 'Instagram', value: '@styleja' },
              { label: 'Platform', value: BRAND.name },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'var(--tk-text-faint)',
                    marginBottom: '0.3rem',
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--tk-text-muted)',
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="anim-fade-up delay-2">
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            {[
              { label: 'Full Name', key: 'name', type: 'text', value: name, setter: setName, required: true },
              { label: 'Email Address', key: 'email', type: 'email', value: email, setter: setEmail, required: true },
              { label: 'Phone Number', key: 'phone', type: 'tel', value: phone, setter: setPhone, required: false },
              { label: 'Subject', key: 'subject', type: 'text', value: subject, setter: setSubject, required: true },
            ].map(({ label, key, type, value, setter, required }) => (
              <div key={label}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.6rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--tk-text-faint)',
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
                  onBlur={() => {
                    let err = '';
                    if (key === 'email') err = validateEmail(value);
                    else if (key === 'phone') err = validatePhone(value);
                    setFieldErrors((prev) => ({ ...prev, [key]: err }));
                  }}
                  required={required}
                  placeholder={label}
                />
                {fieldErrors[key] && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-error, oklch(65% 0.2 25))', marginTop: '0.35rem' }}>
                    {fieldErrors[key]}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--tk-text-faint)',
                  marginBottom: '0.5rem',
                }}
              >
                Message
              </label>
              <textarea
                className="input-luxury"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Tell me about your event or vision..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>

            {success && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--tk-gold)',
                  letterSpacing: '0.1em',
                }}
              >
                Message received — I'll be in touch soon.
              </p>
            )}
            {error && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>{error}</p>
            )}
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Contact;
