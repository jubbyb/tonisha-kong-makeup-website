import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
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

  // Fetch artist by slug, then load related collections by id
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/artists/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Artist>) : Promise.reject(new Error('not found'))))
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

  const handleBook = async (e: React.FormEvent) => {
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
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  if (!artist)
    return (
      <div className="flex justify-center items-center min-h-screen text-error">
        Artist not found.
      </div>
    );

  const socials: Array<{ url: string; label: string; icon: string }> = [];
  if (artist.instagram_url)
    socials.push({ url: artist.instagram_url, label: 'Instagram', icon: 'IG' });
  if (artist.tiktok_url) socials.push({ url: artist.tiktok_url, label: 'TikTok', icon: 'TT' });
  if (artist.facebook_url)
    socials.push({ url: artist.facebook_url, label: 'Facebook', icon: 'FB' });
  if (artist.website_url) socials.push({ url: artist.website_url, label: 'Website', icon: 'WEB' });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div className="flex-shrink-0">
          {artist.photo_url ? (
            <img
              src={artist.photo_url}
              alt={artist.name}
              className="w-36 h-36 rounded-full object-cover ring-4 ring-primary ring-offset-2"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-base-200 flex items-center justify-center text-5xl font-bold text-base-content/30">
              {artist.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
          {artist.location && <p className="text-base-content/60 mb-2">📍 {artist.location}</p>}
          {artist.industries && artist.industries.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {artist.industries.map((ind) => (
                <span
                  key={ind.slug}
                  style={{
                    fontSize: '0.55rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    border: '1px solid var(--tk-gold)',
                    color: 'var(--tk-gold)',
                    padding: '0.2rem 0.55rem',
                  }}
                >
                  {ind.name}
                </span>
              ))}
            </div>
          )}
          {artist.specialties && (
            <div className="flex flex-wrap gap-1 mb-3">
              {artist.specialties.split(',').map((s) => (
                <span key={s} className="badge badge-primary badge-outline">
                  {s.trim()}
                </span>
              ))}
            </div>
          )}
          {artist.bio && (
            <p className="text-base-content/80 leading-relaxed max-w-xl mb-3">{artist.bio}</p>
          )}
          {artist.experience && (
            <p className="text-sm text-base-content/60 italic">{artist.experience}</p>
          )}
          {socials.length > 0 && (
            <div className="flex gap-2 mt-3">
              {socials.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-circle btn-sm btn-outline"
                  aria-label={s.label}
                  title={s.label}
                >
                  <span className="text-xs font-semibold">{s.icon}</span>
                </a>
              ))}
            </div>
          )}
          {buildWhatsAppUrl(artist.whatsapp_number, defaultBookingMessage(artist.name)) && (
            <div className="mt-3">
              <a
                href={buildWhatsAppUrl(artist.whatsapp_number, defaultBookingMessage(artist.name))!}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#25d366',
                  border: '1px solid #25d366',
                  padding: '0.4rem 1rem',
                  textDecoration: 'none',
                  transition: 'background 0.2s, color 0.2s',
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
                Book on WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      {artist.about && (
        <section className="mb-10">
          <div className="divider">About</div>
          <p className="text-base-content/80 leading-relaxed whitespace-pre-line">{artist.about}</p>
        </section>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section className="mb-10">
          <div className="divider">Portfolio</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolio.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className="aspect-square overflow-hidden rounded-lg bg-base-200 group relative"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={item.image_url}
                  alt={item.caption ?? `Portfolio image ${i + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {item.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity text-left">
                    {item.caption}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="mb-10">
          <div className="divider">Services</div>
          <ul className="divide-y divide-base-300 border border-base-300 rounded-lg">
            {services.map((s) => {
              const waUrl = buildWhatsAppUrl(
                artist.whatsapp_number,
                defaultBookingMessage(artist.name, s.name),
              );
              return (
                <li key={s.id} className="px-4 py-3 flex items-baseline justify-between gap-3">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    {s.description && (
                      <div className="text-sm text-base-content/60">{s.description}</div>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.65rem', color: '#25d366', letterSpacing: '0.1em', textDecoration: 'none', display: 'inline-block', marginTop: '0.3rem' }}
                      >
                        Book on WhatsApp →
                      </a>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    {s.price != null && <div className="font-semibold">${s.price}</div>}
                    <div className="text-xs text-base-content/60">{s.duration_min} min</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mb-10">
          <div className="divider">What clients say</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <blockquote key={t.id} className="p-4 bg-base-100 border border-base-300 rounded-lg">
                <p className="italic text-base-content/80 mb-2">"{t.quote}"</p>
                <footer className="text-sm text-base-content/60">
                  — {t.client_name}
                  {t.date ? ` · ${t.date}` : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Booking section */}
      <div className="divider">Book an Appointment</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="bg-base-100 rounded-xl border border-base-300 p-4">
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
            <div className="flex flex-col items-center justify-center h-full text-base-content/40 text-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-2 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>Select a highlighted date to see available times</p>
            </div>
          ) : slotsForDate.length === 0 ? (
            <div className="flex items-center justify-center h-full text-base-content/40 py-8">
              No available slots on this date.
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-lg mb-3">
                {new Date(selectedDate + 'T00:00').toLocaleDateString('default', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <div className="space-y-2">
                {slotsForDate.map((slot) => (
                  <button
                    key={`${slot.date}-${slot.start}`}
                    className="btn btn-outline btn-block justify-between"
                    onClick={() => openBooking(slot)}
                  >
                    <span>
                      {slot.start} – {slot.end}
                    </span>
                    <span className="badge badge-success badge-sm">Available</span>
                  </button>
                ))}
              </div>
              {!user && (
                <p className="text-sm text-base-content/50 mt-3 text-center">
                  You'll be asked to sign in before confirming your booking.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
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
              src={portfolio[lightboxIndex].image_url}
              alt={portfolio[lightboxIndex].caption ?? ''}
              className="w-full h-auto rounded-lg"
            />
            {portfolio[lightboxIndex].caption && (
              <p className="text-center text-white/90 mt-2">{portfolio[lightboxIndex].caption}</p>
            )}
            {portfolio.length > 1 && (
              <div className="flex justify-between mt-3">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-white"
                  onClick={() =>
                    setLightboxIndex((i) => (i! - 1 + portfolio.length) % portfolio.length)
                  }
                >
                  ← Prev
                </button>
                <span className="text-white/70 text-sm self-center">
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

      {/* Booking modal */}
      {bookingSlot && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setBookingSlot(null)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-1">Confirm Booking</h3>
            <p className="text-sm text-base-content/60 mb-4">
              {artist.name} ·{' '}
              {new Date(bookingSlot.date + 'T00:00').toLocaleDateString('default', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}{' '}
              · {bookingSlot.start}–{bookingSlot.end}
            </p>

            {bookingSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-semibold text-lg">Booking submitted!</p>
                <p className="text-sm text-base-content/60 mt-1">
                  The artist will confirm your appointment shortly.
                </p>
                {user ? (
                  <button
                    className="btn btn-primary mt-4"
                    onClick={() => {
                      setBookingSlot(null);
                      navigate('/my-bookings');
                    }}
                  >
                    View my bookings
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost mt-4"
                    onClick={() => setBookingSlot(null)}
                  >
                    Back to profile
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Service</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
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
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Message (optional)</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    placeholder="Any special requests or notes for the artist..."
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                  />
                </div>
                {bookingError && (
                  <div className="alert alert-error py-2 text-sm">{bookingError}</div>
                )}
                <div className="modal-action">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setBookingSlot(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={bookingLoading}>
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
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
