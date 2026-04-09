import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import CalendarView from '../components/CalendarView';

interface Artist {
  id: number;
  name: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
}

interface Slot {
  date: string;
  start: string;
  end: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
}

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!id) return;
    Promise.all([
      fetch(`/api/artists/${id}`).then((r) => r.json() as Promise<Artist>),
      fetch(`/api/artists/${id}/services`).then((r) => r.json() as Promise<Service[]>),
    ])
      .then(([a, s]) => { setArtist(a); setServices(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const fetchSlots = useCallback(() => {
    if (!id) return;
    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const to = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    fetch(`/api/artists/${id}/slots?from=${from}&to=${to}`)
      .then((r) => r.json() as Promise<Slot[]>)
      .then(setSlots);
  }, [id, calYear, calMonth]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Group slots by date
  const slotsByDate: Record<string, Slot[]> = {};
  for (const slot of slots) {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  }
  const availableDates = Object.keys(slotsByDate);
  const slotsForDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  const openBooking = (slot: Slot) => {
    if (!user) {
      navigate(`/login?returnTo=/artists/${id}`);
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

  if (loading) return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-spinner loading-lg" /></div>;
  if (!artist) return <div className="flex justify-center items-center min-h-screen text-error">Artist not found.</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Artist header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div className="flex-shrink-0">
          {artist.photo_url ? (
            <img src={artist.photo_url} alt={artist.name} className="w-36 h-36 rounded-full object-cover ring-4 ring-primary ring-offset-2" />
          ) : (
            <div className="w-36 h-36 rounded-full bg-base-200 flex items-center justify-center text-5xl font-bold text-base-content/30">
              {artist.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
          {artist.specialties && (
            <div className="flex flex-wrap gap-1 mb-3">
              {artist.specialties.split(',').map((s) => (
                <span key={s} className="badge badge-primary badge-outline">{s.trim()}</span>
              ))}
            </div>
          )}
          {artist.bio && <p className="text-base-content/80 leading-relaxed max-w-xl">{artist.bio}</p>}
        </div>
      </div>

      {/* Booking section */}
      <div className="divider">Book an Appointment</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Calendar */}
        <div className="bg-base-100 rounded-xl border border-base-300 p-4">
          <CalendarView
            year={calYear}
            month={calMonth}
            markedDates={availableDates}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); setSelectedDate(null); }}
          />
        </div>

        {/* Slot list */}
        <div>
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full text-base-content/40 text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                {new Date(selectedDate + 'T00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <div className="space-y-2">
                {slotsForDate.map((slot) => (
                  <button
                    key={`${slot.date}-${slot.start}`}
                    className="btn btn-outline btn-block justify-between"
                    onClick={() => openBooking(slot)}
                  >
                    <span>{slot.start} – {slot.end}</span>
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

      {/* Booking modal */}
      {bookingSlot && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setBookingSlot(null)}>✕</button>
            <h3 className="font-bold text-lg mb-1">Confirm Booking</h3>
            <p className="text-sm text-base-content/60 mb-4">
              {artist.name} · {new Date(bookingSlot.date + 'T00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })} · {bookingSlot.start}–{bookingSlot.end}
            </p>

            {bookingSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-semibold text-lg">Booking submitted!</p>
                <p className="text-sm text-base-content/60 mt-1">The artist will confirm your appointment shortly.</p>
                <button className="btn btn-primary mt-4" onClick={() => { setBookingSlot(null); navigate('/my-bookings'); }}>
                  View my bookings
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Service</span></label>
                  <select className="select select-bordered w-full" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} required>
                    {services.map((s) => <option key={s.id} value={s.name}>{s.name} — ${s.price}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Message (optional)</span></label>
                  <textarea className="textarea textarea-bordered h-20" placeholder="Any special requests or notes for the artist..." value={bookingMessage} onChange={(e) => setBookingMessage(e.target.value)} />
                </div>
                {bookingError && <div className="alert alert-error py-2 text-sm">{bookingError}</div>}
                <div className="modal-action">
                  <button type="button" className="btn btn-ghost" onClick={() => setBookingSlot(null)}>Cancel</button>
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
