import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface SurveyMeta {
  already_submitted: boolean;
  name: string;
  service: string;
  date: string;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '1.5rem 0' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <svg width="36" height="36" viewBox="0 0 24 24">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={(hovered || value) >= star ? 'var(--tk-gold)' : 'none'}
              stroke="var(--tk-gold)"
              strokeWidth="1"
              style={{ transition: 'fill 0.15s ease' }}
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 128px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4rem 2rem',
  background: 'var(--tk-bg)',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  background: 'var(--tk-bg-raised)',
  border: '1px solid var(--tk-border)',
  padding: '3rem 2.5rem',
  textAlign: 'center',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  color: 'var(--tk-gold)',
  marginBottom: '1rem',
};

const headingStyle: React.CSSProperties = {
  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
  fontWeight: 300,
  fontStyle: 'italic',
  color: 'var(--tk-text-bright)',
  marginBottom: '1rem',
};

export default function Survey() {
  const { token } = useParams<{ token: string }>();
  const [meta, setMeta] = useState<SurveyMeta | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitted' | 'error' | 'not_found'>('loading');
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('not_found'); return; }
    fetch(`/api/surveys/${token}`)
      .then(async (r) => {
        if (r.status === 404) { setStatus('not_found'); return; }
        const data: SurveyMeta = await r.json();
        setMeta(data);
        setStatus(data.already_submitted ? 'submitted' : 'ready');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, body }),
      });
      if (!res.ok) throw new Error();
      setStatus('submitted');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <span className="loading loading-spinner loading-lg" style={{ color: 'var(--tk-gold)' }} />
        </div>
      </div>
    );
  }

  if (status === 'not_found' || status === 'error') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>Tonisha Kong Makeup</p>
          <h1 className="font-display" style={headingStyle}>Link Not Found</h1>
          <p style={{ color: 'var(--tk-text-dim)', lineHeight: 1.7 }}>
            This survey link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={labelStyle}>Thank You</p>
          <h1 className="font-display" style={headingStyle}>
            Your feedback means everything.
          </h1>
          <p style={{ color: 'var(--tk-text-dim)', lineHeight: 1.7 }}>
            Thank you, {meta?.name}. We appreciate you taking the time to share your experience.
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = meta?.date
    ? new Date(meta.date + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={labelStyle}>Tonisha Kong Makeup</p>
        <h1 className="font-display" style={headingStyle}>
          How did we do?
        </h1>
        <p style={{ color: 'var(--tk-text-dim)', lineHeight: 1.7, marginBottom: '0.25rem' }}>
          {meta?.service}
        </p>
        <p style={{ color: 'var(--tk-text-dim)', fontSize: '0.8rem', marginBottom: 0 }}>
          {formattedDate}
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <p style={{ color: 'var(--tk-text-dim)', fontSize: '0.8rem', marginBottom: 0 }}>
            Rate your experience
          </p>
          <StarInput value={rating} onChange={setRating} />

          <textarea
            className="input-luxury"
            placeholder="Share your thoughts (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            style={{
              resize: 'vertical',
              marginBottom: '2rem',
              textAlign: 'left',
              width: '100%',
              padding: '0.75rem 0',
            }}
          />

          <button
            type="submit"
            className="btn-gold"
            disabled={rating === 0 || submitting}
            style={{ width: '100%', opacity: rating === 0 ? 0.5 : 1, cursor: rating === 0 ? 'default' : 'pointer' }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
