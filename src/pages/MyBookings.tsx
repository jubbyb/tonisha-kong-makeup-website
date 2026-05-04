import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface Booking {
  id: number;
  service: string;
  date: string;
  status: string;
  message: string | null;
  created_at: string;
  artist_name: string | null;
  artist_photo: string | null;
  start_time: string | null;
  end_time: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  cancelled: 'badge-error',
  completed: 'badge-info',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchBookings = () => {
    apiFetch<Booking[]>('/api/bookings/mine')
      .then((data) => { setBookings(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await apiFetch(`/api/bookings/mine/${id}/cancel`, { method: 'POST' });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-spinner loading-lg" /></div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-error">{error}</div>;

  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.date) >= new Date());
  const past = bookings.filter((b) => b.status === 'completed' || (b.status !== 'cancelled' && new Date(b.date) < new Date()));
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  const BookingCard = ({ b }: { b: Booking }) => (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-4">
        <div className="flex justify-between items-start gap-2 flex-wrap">
          <div>
            <p className="font-semibold">{b.service}</p>
            <p className="text-sm text-base-content/60">
              {new Date(b.date).toLocaleString('default', { dateStyle: 'medium', timeStyle: 'short' })}
              {b.start_time && b.end_time && ` · ${b.start_time}–${b.end_time}`}
            </p>
            {b.artist_name && <p className="text-sm text-base-content/60">with {b.artist_name}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`badge ${STATUS_BADGE[b.status] ?? 'badge-ghost'} capitalize`}>{b.status}</span>
            {b.status === 'pending' && new Date(b.date) >= new Date() && (
              <button className="btn btn-error btn-xs" disabled={cancelling === b.id} onClick={() => handleCancel(b.id)}>
                {cancelling === b.id ? '...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
        {b.message && <p className="text-sm text-base-content/50 mt-1 italic">"{b.message}"</p>}
      </div>
    </div>
  );

  const Section = ({ title, items }: { title: string; items: Booking[] }) =>
    items.length === 0 ? null : (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="space-y-3">
          {items.map((b) => <BookingCard key={b.id} b={b} />)}
        </div>
      </div>
    );

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center text-base-content/50 py-20">
          <p className="mb-4">You have no bookings yet.</p>
          <a href="/artists" className="btn btn-primary">Browse Artists</a>
        </div>
      ) : (
        <>
          <Section title="Upcoming" items={upcoming} />
          <Section title="Past" items={past} />
          <Section title="Cancelled" items={cancelled} />
        </>
      )}
    </div>
  );
}
