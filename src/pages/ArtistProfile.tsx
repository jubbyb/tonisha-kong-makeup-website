import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { cfImage } from '../lib/cfImage';
import CalendarView from '../components/CalendarView';
import { buildWhatsAppUrl, defaultBookingMessage } from '../lib/whatsapp';

interface Artist {
  id: number;
  slug: string | null;
  name: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
  about: string | null;
  location: string | null;
  experience: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  whatsapp_number: string | null;
  industries: { slug: string; name: string }[];
}

interface Slot {
  date: string;
  start: string;
  end: string;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  catalog_price: number | null;
  duration_min: number;
}

interface PortfolioItem {
  id: number;
  image_url: string;
  caption: string | null;
}

interface Testimonial {
  id: number;
  client_name: string;
  quote: string;
  date: string | null;
}

const COVER_FALLBACKS: Record<string, string> = {
  makeup: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1400&q=80',
  nails: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&q=80',
  hair: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=80',
  barber: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1400&q=80',
  stylist: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&q=80',
  tailor: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1400&q=80',
};

const TABS = ['Portfolio', 'Services', 'About', 'Reviews'] as const;
type Tab = (typeof TABS)[number];

export default function ArtistProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Portfolio');

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/artists/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Artist>) : Promise.reject()))
      .then((a) => {
        setArtist(a);
        return Promise.all([
          fetch(`/api/artists/${a.id}/services`).then((r) => r.json() as Promise<Service[]>),
          fetch(`/api/artists/${a.id}/portfolio`).then((r) => r.json() as Promise<PortfolioItem[]>),
          fetch(`/api/artists/${a.id}/testimonials`).then(
            (r) => r.json() as Promise<Testimonial[]>,
          ),
        ]);
      })
      .then(([s, p, t]) => {
        setServices(s);
        setPortfolio(p);
        setTestimonials(t);
      })
      .catch(() => setArtist(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const fetchSlots = useCallback(() => {
    if (!artist) return;
    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const to = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    fetch(`/api/artists/${artist.id}/slots?from=${from}&to=${to}`)
      .then((r) => r.json() as Promise<Slot[]>)
      .then(setSlots);
  }, [artist, calYear, calMonth]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const slotsByDate: Record<string, Slot[]> = {};
  for (const slot of slots) {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  }
  const availableDates = Object.keys(slotsByDate);
  const slotsForDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  const openBooking = (slot: Slot) => {
    if (!user) {
      navigate(`/login?returnTo=/artists/${slug}`);
      return;
    }
    setBookingSlot(slot);
    setSelectedService(services[0]?.name ?? '');
    setBookingMessage('');
    setBookingError(null);
    setBookingSuccess(false);
  };

  const handleBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bookingSlot || !artist) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      await apiFetch('/api/bookings/new', {
        method: 'POST',
        body: JSON.stringify({
          artist_id: artist.id,
          date: bookingSlot.date,
          start_time: bookingSlot.start,
          end_time: bookingSlot.end,
          service: selectedService,
          message: bookingMessage,
        }),
      });
      setBookingSuccess(true);
      fetchSlots();
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      >
        <span className="loading loading-spinner loading-lg" style={{ color: 'var(--accent)' }} />
      </div>
    );
  if (!artist)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--color-error)',
        }}
      >
        Artist not found.
      </div>
    );

  const nameParts = artist.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  const primaryIndustry = artist.industries[0];
  const coverImg = primaryIndustry
    ? (COVER_FALLBACKS[primaryIndustry.slug] ?? COVER_FALLBACKS.makeup)
    : COVER_FALLBACKS.makeup;
  const whatsappUrl = buildWhatsAppUrl(artist.whatsapp_number, defaultBookingMessage(artist.name));
  const startingPrice = services.find((s) => s.price != null)?.price;

  const handleBookCTA = (serviceName?: string) => {
    if (!user) {
      navigate(`/login?returnTo=/artists/${slug}`);
      return;
    }
    if (availableDates.length > 0) setSelectedDate(availableDates[0]);
    if (serviceName) {
      setSelectedService(serviceName);
    }
    setActiveTab('Portfolio');
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        transition: 'background-color 0.35s ease',
      }}
    >
      {/* ── Cover ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '340px', overflow: 'hidden' }}>
        <img
          src={artist.photo_url ? cfImage(artist.photo_url, 1600) : coverImg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, var(--bg) 100%)',
          }}
        />

        {/* Floating action buttons — mobile only */}
        <div
          className="mobile-cover-actions"
          style={{
            display: 'none',
            position: 'absolute',
            top: '50px',
            left: 0,
            right: 0,
            padding: '0 16px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 36,
              height: 36,
              borderRadius: '99px',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              aria-label="Save artist"
              style={{
                width: 36,
                height: 36,
                borderRadius: '99px',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: artist.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              aria-label="Share profile"
              style={{
                width: 36,
                height: 36,
                borderRadius: '99px',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 2rem',
          position: 'relative',
          marginTop: '-80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '4px solid var(--bg)',
              flexShrink: 0,
              background: 'var(--bg-card)',
            }}
          >
            {artist.photo_url ? (
              <img
                src={cfImage(artist.photo_url, 400)}
                alt={artist.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  className="font-editorial"
                  style={{ fontSize: '4rem', color: 'var(--line-2)', fontStyle: 'italic' }}
                >
                  {artist.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, paddingBottom: '0.5rem', minWidth: '200px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <h1
                className="font-editorial"
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  margin: 0,
                  lineHeight: 1,
                  color: 'var(--ink)',
                }}
              >
                {firstName} <span style={{ fontStyle: 'italic' }}>{lastName}</span>
              </h1>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="var(--accent)"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  strokeWidth="0"
                />
              </svg>
            </div>
            {artist.specialties && (
              <p style={{ fontSize: '1rem', color: 'var(--ink-2)', margin: '0 0 0.75rem' }}>
                {artist.specialties}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.8125rem',
                color: 'var(--ink-2)',
                flexWrap: 'wrap',
              }}
            >
              {artist.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {artist.location}
                </span>
              )}
              {artist.experience && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {artist.experience}
                </span>
              )}
            </div>
          </div>

          {/* Book CTA + WhatsApp contact */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.625rem',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <button
              onClick={() => handleBookCTA()}
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9375rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Book a session
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
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.8125rem 1.5rem',
                  borderRadius: '999px',
                  background: 'transparent',
                  color: '#25d366',
                  border: '1px solid #25d366',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#25d366';
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#25d366';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
                </svg>
                WhatsApp
              </a>
            ) : (
              <button
                disabled
                aria-disabled="true"
                title="No WhatsApp number on file"
                style={{
                  padding: '0.8125rem 1.5rem',
                  borderRadius: '999px',
                  background: 'transparent',
                  color: 'var(--ink-3)',
                  border: '1px solid var(--line-2)',
                  cursor: 'not-allowed',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  opacity: 0.55,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
                </svg>
                WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs — desktop underline style ─────────────────────────────── */}
      <div
        className="artist-tabs-desktop"
        style={{ borderBottom: '1px solid var(--line-2)', marginTop: '2rem' }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            gap: '2rem',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.875rem 0',
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--ink)' : 'var(--ink-2)',
                fontWeight: activeTab === tab ? 500 : 400,
                fontFamily: "'Inter', sans-serif",
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs — mobile pill style ────────────────────────────────────── */}
      <div
        className="artist-tabs-mobile"
        style={{ display: 'none', padding: '1rem 1rem 0', gap: '6px' }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: 6,
            padding: 4,
            border: '1px solid var(--line-2)',
            borderRadius: '999px',
            fontSize: '0.8125rem',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 0',
                textAlign: 'center',
                borderRadius: '999px',
                border: 'none',
                background: activeTab === tab ? 'var(--ink)' : 'transparent',
                color: activeTab === tab ? 'var(--bg)' : 'var(--ink-2)',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8rem',
                fontWeight: activeTab === tab ? 500 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sticky mobile booking CTA ───────────────────────────────────── */}
      <div
        className="sticky-book-bar"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '68px',
          left: '12px',
          right: '12px',
          zIndex: 40,
          padding: '10px 10px 10px 20px',
          background: 'var(--ink)',
          color: 'var(--bg)',
          borderRadius: '999px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', opacity: 0.65, letterSpacing: '0.05em' }}>
            {startingPrice != null ? `From $${startingPrice}` : 'Book now'}
          </div>
          <div className="font-editorial" style={{ fontSize: '18px', lineHeight: 1.1 }}>
            Book a session
          </div>
        </div>
        <button
          onClick={() => handleBookCTA()}
          style={{
            width: 44,
            height: 44,
            borderRadius: '99px',
            background: 'var(--accent)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
          aria-label="Book a session"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* ── Body — main + sidebar ──────────────────────────────────────── */}
      <div
        className="artist-body-grid"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2.5rem 2rem 6rem',
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '3rem',
          alignItems: 'start',
        }}
      >
        {/* ── Main content ─────────────────────────────────────────────── */}
        <div>
          {/* Portfolio tab */}
          {activeTab === 'Portfolio' && (
            <div>
              {portfolio.length > 0 ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <h2
                      className="font-editorial"
                      style={{
                        fontSize: '2.25rem',
                        fontWeight: 400,
                        margin: 0,
                        letterSpacing: '-0.02em',
                        color: 'var(--ink)',
                      }}
                    >
                      Recent work
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>
                      {portfolio.length} photos
                    </span>
                  </div>
                  <div className="portfolio-grid">
                    {portfolio.map((item, i) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className={`portfolio-item${i === 0 ? ' portfolio-item-first' : ''}`}
                      >
                        <img
                          src={cfImage(item.image_url, 600)}
                          alt={item.caption ?? `Work ${i + 1}`}
                          loading="lazy"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.4s ease',
                          }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')
                          }
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    color: 'var(--ink-3)',
                    textAlign: 'center',
                    padding: '4rem 0',
                    fontSize: '0.9rem',
                  }}
                >
                  No portfolio photos yet.
                </div>
              )}
            </div>
          )}

          {/* Services tab */}
          {activeTab === 'Services' && (
            <div>
              <h2
                className="font-editorial"
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 400,
                  margin: '0 0 1.25rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                }}
              >
                Services & prices
              </h2>
              {services.length > 0 ? (
                <div
                  style={{
                    border: '1px solid var(--line-2)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  {services.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto auto',
                        gap: '1.5rem',
                        alignItems: 'center',
                        padding: '1.25rem 1.5rem',
                        borderTop: i === 0 ? 'none' : '1px solid var(--line-2)',
                        background: i % 2 ? 'transparent' : 'var(--bg-card)',
                      }}
                    >
                      <div>
                        <div
                          className="font-editorial"
                          style={{
                            fontSize: '1.25rem',
                            letterSpacing: '-0.01em',
                            color: 'var(--ink)',
                          }}
                        >
                          {s.name}
                        </div>
                        {s.description && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--ink-3)',
                              marginTop: '3px',
                            }}
                          >
                            {s.description}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--ink-2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.duration_min} min
                      </div>
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '1rem',
                          color: 'var(--ink)',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.price != null
                          ? `$${s.price}`
                          : s.catalog_price != null
                            ? `$${s.catalog_price}`
                            : '—'}
                      </div>
                      <button
                        onClick={() => handleBookCTA(s.name)}
                        style={{
                          fontSize: '0.7rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-2)',
                          border: '1px solid var(--line-2)',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '999px',
                          background: 'transparent',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-2)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--ink-2)';
                        }}
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--ink-3)', padding: '2rem 0', fontSize: '0.9rem' }}>
                  No services listed yet.
                </div>
              )}
            </div>
          )}

          {/* About tab */}
          {activeTab === 'About' && (
            <div>
              <h2
                className="font-editorial"
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 400,
                  margin: '0 0 1.5rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                }}
              >
                About
              </h2>
              {(artist.about ?? artist.bio) ? (
                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: 1.75,
                    color: 'var(--ink-2)',
                    maxWidth: '640px',
                    whiteSpace: 'pre-line',
                    marginBottom: '2rem',
                  }}
                >
                  {artist.about ?? artist.bio}
                </p>
              ) : (
                <p style={{ color: 'var(--ink-3)', fontSize: '0.9rem' }}>No bio yet.</p>
              )}
              {artist.industries.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {artist.industries.map((ind) => (
                    <span
                      key={ind.slug}
                      style={{
                        fontSize: '0.6rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                      }}
                    >
                      {ind.name}
                    </span>
                  ))}
                </div>
              )}
              {(artist.instagram_url ||
                artist.tiktok_url ||
                artist.facebook_url ||
                artist.website_url) && (
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {artist.instagram_url && (
                    <a
                      href={artist.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-2)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Instagram ↗
                    </a>
                  )}
                  {artist.tiktok_url && (
                    <a
                      href={artist.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-2)',
                        textDecoration: 'none',
                      }}
                    >
                      TikTok ↗
                    </a>
                  )}
                  {artist.facebook_url && (
                    <a
                      href={artist.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-2)',
                        textDecoration: 'none',
                      }}
                    >
                      Facebook ↗
                    </a>
                  )}
                  {artist.website_url && (
                    <a
                      href={artist.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-2)',
                        textDecoration: 'none',
                      }}
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'Reviews' && (
            <div>
              <h2
                className="font-editorial"
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 400,
                  margin: '0 0 1.25rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                }}
              >
                {testimonials.length > 0 ? `What clients say · ${testimonials.length}` : 'Reviews'}
              </h2>
              {testimonials.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {testimonials.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '1.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--line-2)',
                        borderRadius: '6px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.875rem',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: '0.9375rem',
                            color: 'var(--ink)',
                          }}
                        >
                          {t.client_name}
                        </div>
                        {t.date && (
                          <div
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '0.6875rem',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: 'var(--ink-3)',
                            }}
                          >
                            {t.date}
                          </div>
                        )}
                      </div>
                      <p
                        className="font-editorial"
                        style={{
                          fontSize: '1.0625rem',
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          color: 'var(--ink-2)',
                          margin: 0,
                        }}
                      >
                        "{t.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--ink-3)', fontSize: '0.9rem' }}>No reviews yet.</div>
              )}
            </div>
          )}

          {/* Booking section (below tabs) */}
          <div
            id="booking-section"
            style={{
              marginTop: '4rem',
              paddingTop: '3rem',
              borderTop: '1px solid var(--line-2)',
            }}
          >
            <h2
              className="font-editorial"
              style={{
                fontSize: '2.25rem',
                fontWeight: 400,
                margin: '0 0 1.5rem',
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
              }}
            >
              Book an appointment
            </h2>
            <div className="booking-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '6px',
                  border: '1px solid var(--line-2)',
                  padding: '1.25rem',
                }}
              >
                <CalendarView
                  year={calYear}
                  month={calMonth}
                  markedDates={availableDates}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onMonthChange={(y, m) => {
                    setCalYear(y);
                    setCalMonth(m);
                    setSelectedDate(null);
                  }}
                />
              </div>
              <div>
                {!selectedDate ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--ink-3)',
                      textAlign: 'center',
                      padding: '2rem 0',
                      fontSize: '0.875rem',
                    }}
                  >
                    Select a highlighted date to see available times
                  </div>
                ) : slotsForDate.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--ink-3)',
                      fontSize: '0.875rem',
                    }}
                  >
                    No slots on this date.
                  </div>
                ) : (
                  <div>
                    <h3
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--ink)',
                        marginBottom: '1rem',
                      }}
                    >
                      {new Date(selectedDate + 'T00:00').toLocaleDateString('default', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                      }}
                    >
                      {slotsForDate.map((slot) => (
                        <button
                          key={`${slot.date}-${slot.start}`}
                          onClick={() => openBooking(slot)}
                          style={{
                            padding: '0.875rem 0',
                            textAlign: 'center',
                            border: '1px solid var(--line-2)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'transparent',
                            color: 'var(--ink)',
                            fontSize: '0.9375rem',
                            fontFamily: "'Inter', sans-serif",
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)';
                            (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--line-2)';
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          {slot.start}
                        </button>
                      ))}
                    </div>
                    {!user && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--ink-3)',
                          marginTop: '1rem',
                          textAlign: 'center',
                        }}
                      >
                        You'll be asked to sign in before confirming.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky sidebar ─────────────────────────────────────────────── */}
        <div className="artist-sidebar">
          <div
            style={{
              position: 'sticky',
              top: '5rem',
              padding: '1.75rem',
              border: '1px solid var(--line-2)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
            }}
          >
            <p
              style={{
                fontSize: '0.6875rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
                margin: '0 0 0.875rem',
              }}
            >
              —— Booking
            </p>
            {startingPrice != null && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                <span
                  className="font-editorial"
                  style={{ fontSize: '2.5rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}
                >
                  ${startingPrice}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink-3)' }}>starting</span>
              </div>
            )}
            <div
              style={{
                borderTop: '1px solid var(--line-2)',
                paddingTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              {[
                { label: 'Location', value: artist.location ?? 'Jamaica' },
                { label: 'Cancel policy', value: '24h notice' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span style={{ color: 'var(--ink-3)' }}>{label}</span>
                  <span style={{ color: 'var(--ink)' }}>{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleBookCTA()}
              style={{
                width: '100%',
                padding: '0.9375rem',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9375rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.15s',
                marginBottom: '0.625rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Book a session
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
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  padding: '0.9375rem',
                  borderRadius: '999px',
                  border: '1px solid var(--line-2)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                Message on WhatsApp
              </a>
            )}
            {(artist.about ?? artist.bio) && (
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--line-2)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.6875rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-3)',
                    margin: '0 0 0.75rem',
                  }}
                >
                  About
                </p>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.65,
                    color: 'var(--ink-2)',
                    margin: 0,
                  }}
                >
                  {(artist.about ?? artist.bio ?? '').slice(0, 180)}
                  {(artist.about ?? artist.bio ?? '').length > 180 ? '…' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ───────────────────────────────────────────────────── */}
      {lightboxIndex !== null && portfolio[lightboxIndex] && (
        <dialog open className="modal modal-open" onClick={() => setLightboxIndex(null)}>
          <div
            className="modal-box max-w-4xl bg-transparent shadow-none p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10 bg-base-100/70"
              onClick={() => setLightboxIndex(null)}
            >
              ✕
            </button>
            <img
              src={cfImage(portfolio[lightboxIndex].image_url, 1600, 'contain')}
              alt={portfolio[lightboxIndex].caption ?? ''}
              className="w-full h-auto rounded-lg"
            />
            {portfolio[lightboxIndex].caption && (
              <p
                style={{
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.9)',
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {portfolio[lightboxIndex].caption}
              </p>
            )}
            {portfolio.length > 1 && (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-white"
                  onClick={() =>
                    setLightboxIndex((i) => (i! - 1 + portfolio.length) % portfolio.length)
                  }
                >
                  ← Prev
                </button>
                <span
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.875rem',
                    alignSelf: 'center',
                  }}
                >
                  {lightboxIndex + 1} / {portfolio.length}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-white"
                  onClick={() => setLightboxIndex((i) => (i! + 1) % portfolio.length)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </dialog>
      )}

      {/* ── Booking modal ──────────────────────────────────────────────── */}
      {bookingSlot && (
        <dialog open className="modal modal-open">
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--line-2)',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '420px',
              width: '100%',
              position: 'relative',
            }}
          >
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-3)',
                fontSize: '1rem',
              }}
              onClick={() => setBookingSlot(null)}
            >
              ✕
            </button>
            <h3
              className="font-editorial"
              style={{
                fontSize: '1.75rem',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
                margin: '0 0 0.5rem',
              }}
            >
              Confirm Booking
            </h3>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--ink-3)',
                marginBottom: '1.5rem',
              }}
            >
              {artist.name} ·{' '}
              {new Date(bookingSlot.date + 'T00:00').toLocaleDateString('default', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}{' '}
              · {bookingSlot.start}–{bookingSlot.end}
            </p>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '99px',
                    background: 'var(--accent)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2
                  className="font-editorial"
                  style={{
                    fontSize: '2.75rem',
                    fontWeight: 400,
                    lineHeight: 1,
                    letterSpacing: '-0.025em',
                    margin: '0 0 0.75rem',
                    color: 'var(--ink)',
                  }}
                >
                  You're
                  <br />
                  <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>booked.</span>
                </h2>
                <p
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    color: 'var(--ink-2)',
                    margin: '0 0 1.5rem',
                  }}
                >
                  {new Date(bookingSlot!.date + 'T00:00').toLocaleDateString('default', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  · {bookingSlot!.start}
                  <br />
                  with {artist.name}
                </p>
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    border: '1px solid var(--line-2)',
                    borderRadius: '10px',
                    background: 'var(--bg)',
                    textAlign: 'left',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingBottom: '0.875rem',
                      borderBottom: '1px solid var(--line-2)',
                    }}
                  >
                    {artist.photo_url && (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '99px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={cfImage(artist.photo_url, 120)}
                          alt={artist.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)' }}>
                        {artist.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>
                        {selectedService}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      paddingTop: '0.875rem',
                      fontSize: '0.8125rem',
                      color: 'var(--ink-2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Date</span>
                      <span style={{ color: 'var(--ink)' }}>
                        {new Date(bookingSlot!.date + 'T00:00').toLocaleDateString('default', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        · {bookingSlot!.start}
                      </span>
                    </div>
                    {artist.location && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Location</span>
                        <span style={{ color: 'var(--ink)' }}>{artist.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {user && (
                    <button
                      className="btn-accent"
                      style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
                      onClick={() => {
                        setBookingSlot(null);
                        navigate('/my-bookings');
                      }}
                    >
                      View my bookings
                    </button>
                  )}
                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-2)',
                      fontSize: '0.875rem',
                    }}
                    onClick={() => setBookingSlot(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleBook}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.6875rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Service
                  </label>
                  <select
                    className="select select-bordered w-full"
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      border: '1px solid var(--line-2)',
                      borderRadius: '6px',
                    }}
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    required
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                        {s.price != null ? ` — $${s.price}` : ''}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.6875rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Message (optional)
                  </label>
                  <textarea
                    style={{
                      width: '100%',
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      border: '1px solid var(--line-2)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      height: '80px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: "'Inter', sans-serif",
                    }}
                    placeholder="Any special requests…"
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                  />
                </div>
                {bookingError && (
                  <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>
                    {bookingError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-3)',
                      fontSize: '0.875rem',
                    }}
                    onClick={() => setBookingSlot(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-accent" disabled={bookingLoading}>
                    {bookingLoading ? 'Booking…' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
