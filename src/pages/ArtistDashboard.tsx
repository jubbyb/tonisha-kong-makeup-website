import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  message: string | null;
  status: string;
}

interface DayHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

interface Block {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
}

interface ArtistProfile {
  id: number;
  slug: string | null;
  name: string;
  email: string;
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
  industry_ids: number[];
}

interface IndustryOption {
  id: number;
  slug: string;
  name: string;
}

interface PortfolioItem {
  id: number;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface TestimonialItem {
  id: number;
  client_name: string;
  quote: string;
  date: string | null;
  display_order: number;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  cancelled: 'badge-error',
  completed: 'badge-info',
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

// ─── Bookings tab ─────────────────────────────────────────────────────────────

function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiFetch<Booking[]>('/api/artist/bookings')
      .then((d) => {
        setBookings(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await apiFetch(`/api/artist/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Bookings</h2>
        <div className="flex gap-1 flex-wrap">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((s) => (
            <button
              key={s}
              className={`btn btn-xs capitalize ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-base-content/50 py-12">No bookings found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Date / Time</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-base-content/60">{b.email}</div>
                    {b.phone && <div className="text-xs text-base-content/60">{b.phone}</div>}
                  </td>
                  <td>{b.service}</td>
                  <td className="whitespace-nowrap text-sm">
                    <div>
                      {new Date(b.date + 'T00:00').toLocaleDateString('default', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {b.start_time && b.end_time && (
                      <div className="text-base-content/60">
                        {b.start_time} – {b.end_time}
                      </div>
                    )}
                  </td>
                  <td className="max-w-xs text-sm text-base-content/70 truncate">
                    {b.message ?? '—'}
                  </td>
                  <td>
                    <span className={`badge capitalize ${STATUS_BADGE[b.status] ?? 'badge-ghost'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {b.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => updateStatus(b.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => updateStatus(b.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <>
                          <button
                            className="btn btn-info btn-xs"
                            onClick={() => updateStatus(b.id, 'completed')}
                          >
                            Complete
                          </button>
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => updateStatus(b.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Availability tab ─────────────────────────────────────────────────────────

interface DayState {
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration: number;
  saving: boolean;
  saved: boolean;
}

const defaultDay = (): DayState => ({
  enabled: false,
  start_time: '09:00',
  end_time: '17:00',
  slot_duration: 60,
  saving: false,
  saved: false,
});

function AvailabilityTab() {
  const [days, setDays] = useState<Record<number, DayState>>(
    Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, defaultDay()])),
  );
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hoursLoading, setHoursLoading] = useState(true);

  // Block form state
  const [blockMode, setBlockMode] = useState<'single' | 'range'>('single');
  const [blockDate, setBlockDate] = useState('');
  const [blockDateTo, setBlockDateTo] = useState('');
  const [blockFullDay, setBlockFullDay] = useState(true);
  const [blockStart, setBlockStart] = useState('12:00');
  const [blockEnd, setBlockEnd] = useState('14:00');
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    const data = await apiFetch<Block[]>('/api/artist/blocks');
    setBlocks(data);
  }, []);

  useEffect(() => {
    apiFetch<DayHours[]>('/api/artist/hours')
      .then((data) => {
        setDays((prev) => {
          const next = { ...prev };
          for (const h of data) {
            next[h.day_of_week] = {
              enabled: true,
              start_time: h.start_time,
              end_time: h.end_time,
              slot_duration: h.slot_duration,
              saving: false,
              saved: false,
            };
          }
          return next;
        });
        setHoursLoading(false);
      })
      .catch(() => setHoursLoading(false));
    fetchBlocks();
  }, [fetchBlocks]);

  const updateDay = (i: number, patch: Partial<DayState>) => {
    setDays((prev) => ({ ...prev, [i]: { ...prev[i], ...patch } }));
  };

  const saveDay = async (i: number) => {
    const day = days[i];
    updateDay(i, { saving: true, saved: false });
    try {
      await apiFetch(`/api/artist/hours/${i}`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: day.enabled,
          start_time: day.start_time,
          end_time: day.end_time,
          slot_duration: day.slot_duration,
        }),
      });
      updateDay(i, { saved: true });
      setTimeout(() => updateDay(i, { saved: false }), 1500);
    } finally {
      updateDay(i, { saving: false });
    }
  };

  const addBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;
    if (blockMode === 'range' && !blockDateTo) return;
    setAddingBlock(true);
    setBlockError(null);
    try {
      await apiFetch('/api/artist/blocks', {
        method: 'POST',
        body: JSON.stringify({
          date: blockDate,
          date_to: blockMode === 'range' ? blockDateTo : undefined,
          start_time: blockFullDay ? null : blockStart,
          end_time: blockFullDay ? null : blockEnd,
        }),
      });
      setBlockDate('');
      setBlockDateTo('');
      setBlockFullDay(true);
      await fetchBlocks();
    } catch (err) {
      setBlockError(err instanceof Error ? err.message : 'Failed to add block');
    } finally {
      setAddingBlock(false);
    }
  };

  const deleteBlock = async (id: number) => {
    await apiFetch(`/api/artist/blocks/${id}`, { method: 'DELETE' });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  if (hoursLoading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return (
    <div className="space-y-10">
      {/* ── Working hours ────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Working Hours</h2>
        <p className="text-sm text-base-content/60 mb-4">
          Set the days and hours you're available by default. Clients will see these as bookable
          times.
        </p>

        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Day</th>
                <th>Start</th>
                <th>End</th>
                <th>Slot length</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }, (_, i) => {
                const day = days[i];
                return (
                  <tr key={i} className={day.enabled ? '' : 'opacity-50'}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={day.enabled}
                        onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                      />
                    </td>
                    <td className="font-medium">{DAY_NAMES[i]}</td>
                    <td>
                      <input
                        type="time"
                        className="input input-bordered input-sm w-28"
                        value={day.start_time}
                        disabled={!day.enabled}
                        onChange={(e) => updateDay(i, { start_time: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        className="input input-bordered input-sm w-28"
                        value={day.end_time}
                        disabled={!day.enabled}
                        onChange={(e) => updateDay(i, { end_time: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="select select-bordered select-sm"
                        value={day.slot_duration}
                        disabled={!day.enabled}
                        onChange={(e) => updateDay(i, { slot_duration: Number(e.target.value) })}
                      >
                        {DURATIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${day.saved ? 'btn-success' : 'btn-primary'}`}
                        onClick={() => saveDay(i)}
                        disabled={day.saving}
                      >
                        {day.saving ? '...' : day.saved ? 'Saved ✓' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Block time off ───────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Block Time Off</h2>
        <p className="text-sm text-base-content/60 mb-4">
          Block specific dates or hours when you're unavailable — holidays, personal time,
          back-to-back bookings, etc.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add block form */}
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body">
              <h3 className="font-semibold mb-2">Block time off</h3>
              <form onSubmit={addBlock} className="space-y-3">
                {/* Single vs range toggle */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-primary radio-sm"
                      checked={blockMode === 'single'}
                      onChange={() => setBlockMode('single')}
                    />
                    <span className="text-sm">Single date</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-primary radio-sm"
                      checked={blockMode === 'range'}
                      onChange={() => setBlockMode('range')}
                    />
                    <span className="text-sm">Date range</span>
                  </label>
                </div>

                {blockMode === 'single' ? (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={blockDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBlockDate(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">From</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={blockDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setBlockDate(e.target.value);
                          if (blockDateTo && e.target.value > blockDateTo) setBlockDateTo('');
                        }}
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">To</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={blockDateTo}
                        min={blockDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setBlockDateTo(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-primary radio-sm"
                      checked={blockFullDay}
                      onChange={() => setBlockFullDay(true)}
                    />
                    <span className="text-sm">Full day</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-primary radio-sm"
                      checked={!blockFullDay}
                      onChange={() => setBlockFullDay(false)}
                    />
                    <span className="text-sm">Specific hours</span>
                  </label>
                </div>

                {!blockFullDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">From</span>
                      </label>
                      <input
                        type="time"
                        className="input input-bordered"
                        value={blockStart}
                        onChange={(e) => setBlockStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">To</span>
                      </label>
                      <input
                        type="time"
                        className="input input-bordered"
                        value={blockEnd}
                        onChange={(e) => setBlockEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {blockError && <div className="alert alert-error py-2 text-sm">{blockError}</div>}

                <button type="submit" className="btn btn-primary w-full" disabled={addingBlock}>
                  {addingBlock ? 'Adding...' : 'Block this time'}
                </button>
              </form>
            </div>
          </div>

          {/* Upcoming blocks list */}
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body">
              <h3 className="font-semibold mb-2">Upcoming blocks</h3>
              {blocks.length === 0 ? (
                <p className="text-sm text-base-content/50">No time off blocked.</p>
              ) : (
                <ul className="space-y-2">
                  {blocks.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-2 py-1 border-b border-base-200 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-sm">
                          {new Date(b.date + 'T00:00').toLocaleDateString('default', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-sm text-base-content/60 ml-2">
                          {b.start_time && b.end_time
                            ? `${b.start_time}–${b.end_time}`
                            : 'Full day'}
                        </span>
                      </div>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => deleteBlock(b.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Services tab ─────────────────────────────────────────────────────────────

interface CatalogCategory {
  id: number;
  name: string;
  sort_order: number;
  subcategories: Array<{
    id: number;
    name: string;
    services: Array<{
      id: number;
      name: string;
      description: string | null;
      price: number | null;
      duration_min: number;
    }>;
  }>;
}

function ServicesTab() {
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  // Map of service_id → price override (null = checked but use catalog price; undefined/missing = unchecked)
  const [selected, setSelected] = useState<Map<number, number | null>>(new Map());
  const [overrideText, setOverrideText] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/service-catalog').then((r) => r.json() as Promise<CatalogCategory[]>),
      apiFetch<Array<{ service_id: number; price_override: number | null }>>(
        '/api/artist/services',
      ),
    ])
      .then(([cat, rows]) => {
        setCatalog(cat);
        const m = new Map<number, number | null>();
        const t = new Map<number, string>();
        for (const r of rows) {
          m.set(r.service_id, r.price_override);
          if (r.price_override != null) t.set(r.service_id, String(r.price_override));
        }
        setSelected(m);
        setOverrideText(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, null);
      return next;
    });
  };

  const updateOverride = (id: number, raw: string) => {
    setOverrideText((prev) => {
      const next = new Map(prev);
      if (raw === '') next.delete(id);
      else next.set(id, raw);
      return next;
    });
    setSelected((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      const num = parseFloat(raw);
      next.set(id, raw === '' || isNaN(num) ? null : num);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const services = Array.from(selected.entries()).map(([service_id, price_override]) => ({
        service_id,
        price_override,
      }));
      await apiFetch('/api/artist/services', {
        method: 'PUT',
        body: JSON.stringify({ services }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl font-bold">My Services</h2>
        <button
          className={`btn btn-sm ${saved ? 'btn-success' : 'btn-primary'}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>
      <p className="text-sm text-base-content/60 mb-6">
        Select the services you offer. Set a custom price if yours differs from the catalog price —
        leave blank to use the catalog default.
      </p>
      {error && <div className="alert alert-error py-2 text-sm mb-4">{error}</div>}

      {catalog.length === 0 ? (
        <div className="text-center text-base-content/50 py-12">
          No services in the catalog yet. Ask an admin to add some.
        </div>
      ) : (
        <div className="space-y-6">
          {catalog.map((cat) => (
            <div key={cat.id} className="card bg-base-100 border border-base-300">
              <div className="card-body py-4 px-5">
                <h3 className="font-semibold text-base mb-3">{cat.name}</h3>
                {cat.subcategories.map((sub) => (
                  <div key={sub.id} className="mb-4 last:mb-0">
                    <p className="text-xs uppercase tracking-widest text-base-content/50 mb-2">
                      {sub.name}
                    </p>
                    <div className="space-y-2">
                      {sub.services.map((svc) => {
                        const isSelected = selected.has(svc.id);
                        return (
                          <div
                            key={svc.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-base-200 transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm mt-0.5"
                              checked={isSelected}
                              onChange={() => toggle(svc.id)}
                              aria-label={`Offer ${svc.name}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-medium text-sm">{svc.name}</span>
                                <div className="text-right whitespace-nowrap text-xs text-base-content/60">
                                  {svc.price != null && (
                                    <span className="mr-2">Catalog: ${svc.price}</span>
                                  )}
                                  <span>{svc.duration_min} min</span>
                                </div>
                              </div>
                              {svc.description && (
                                <p className="text-xs text-base-content/60 mt-0.5">
                                  {svc.description}
                                </p>
                              )}
                              {isSelected && (
                                <div className="mt-2 flex items-center gap-2">
                                  <label className="text-xs text-base-content/70">My price:</label>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm text-base-content/60">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder={
                                        svc.price != null ? String(svc.price) : 'Set price'
                                      }
                                      className="input input-bordered input-xs w-24"
                                      value={overrideText.get(svc.id) ?? ''}
                                      onChange={(e) => updateOverride(svc.id, e.target.value)}
                                    />
                                  </div>
                                  <span className="text-xs text-base-content/40">
                                    (leave blank for catalog price)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<IndustryOption[]>)
      .then(setIndustries)
      .catch(() => {});
    apiFetch<ArtistProfile>('/api/artist/profile')
      .then((d) => {
        setProfile({ ...d, industry_ids: d.industry_ids ?? [] });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/artist/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          specialties: profile.specialties,
          photo_url: profile.photo_url,
          slug: profile.slug,
          about: profile.about,
          location: profile.location,
          experience: profile.experience,
          instagram_url: profile.instagram_url,
          tiktok_url: profile.tiktok_url,
          facebook_url: profile.facebook_url,
          website_url: profile.website_url,
          whatsapp_number: profile.whatsapp_number,
          industry_ids: profile.industry_ids,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  const profileUrl = profile.slug ? `${window.location.origin}/artists/${profile.slug}` : null;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-1">My Profile</h2>
      <p className="text-sm text-base-content/60 mb-4">
        These details appear on your public profile page.
      </p>
      {profileUrl && (
        <div className="alert alert-info mb-4 py-2 text-sm">
          <span>
            Your profile is live at{' '}
            <a href={profileUrl} target="_blank" rel="noreferrer" className="link font-mono">
              {profileUrl}
            </a>
          </span>
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Name</span>
          <input
            type="text"
            className="grow"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">URL slug</span>
          <span className="text-base-content/40 text-sm">/artists/</span>
          <input
            type="text"
            className="grow"
            placeholder="your-name"
            pattern="[a-z0-9](-?[a-z0-9])*"
            minLength={3}
            maxLength={50}
            value={profile.slug ?? ''}
            onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase() })}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Photo URL</span>
          <input
            type="url"
            className="grow"
            value={profile.photo_url ?? ''}
            onChange={(e) => setProfile({ ...profile, photo_url: e.target.value || null })}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Specialties</span>
          <input
            type="text"
            className="grow"
            placeholder="Bridal, Editorial, Events"
            value={profile.specialties ?? ''}
            onChange={(e) => setProfile({ ...profile, specialties: e.target.value || null })}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Location</span>
          <input
            type="text"
            className="grow"
            placeholder="Atlanta, GA — travels nationwide"
            value={profile.location ?? ''}
            onChange={(e) => setProfile({ ...profile, location: e.target.value || null })}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Experience</span>
          <input
            type="text"
            className="grow"
            placeholder="10+ years · MUD certified"
            value={profile.experience ?? ''}
            onChange={(e) => setProfile({ ...profile, experience: e.target.value || null })}
          />
        </label>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Short bio</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="A one-paragraph intro shown at the top of your profile."
            value={profile.bio ?? ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value || null })}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">About (long-form)</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-40"
            placeholder="Tell clients more about your background, style, and what to expect."
            value={profile.about ?? ''}
            onChange={(e) => setProfile({ ...profile, about: e.target.value || null })}
          />
        </div>

        <div className="divider text-sm">Booking &amp; Industries</div>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">WhatsApp</span>
          <input
            type="tel"
            className="grow"
            placeholder="18765551234 (digits only)"
            value={profile.whatsapp_number ?? ''}
            onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value.replace(/\D/g, '') || null })}
          />
        </label>
        {industries.length > 0 && (
          <div className="form-control">
            <label className="label"><span className="label-text">Industries</span></label>
            <div className="flex flex-wrap gap-3">
              {industries.map((ind) => (
                <label key={ind.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={profile.industry_ids.includes(ind.id)}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? [...profile.industry_ids, ind.id]
                        : profile.industry_ids.filter((id) => id !== ind.id);
                      setProfile({ ...profile, industry_ids: ids });
                    }}
                  />
                  <span className="text-sm">{ind.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="divider text-sm">Social links</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">Instagram</span>
            <input
              type="url"
              className="grow"
              placeholder="https://instagram.com/..."
              value={profile.instagram_url ?? ''}
              onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value || null })}
            />
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">TikTok</span>
            <input
              type="url"
              className="grow"
              placeholder="https://tiktok.com/@..."
              value={profile.tiktok_url ?? ''}
              onChange={(e) => setProfile({ ...profile, tiktok_url: e.target.value || null })}
            />
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">Facebook</span>
            <input
              type="url"
              className="grow"
              placeholder="https://facebook.com/..."
              value={profile.facebook_url ?? ''}
              onChange={(e) => setProfile({ ...profile, facebook_url: e.target.value || null })}
            />
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">Website</span>
            <input
              type="url"
              className="grow"
              placeholder="https://..."
              value={profile.website_url ?? ''}
              onChange={(e) => setProfile({ ...profile, website_url: e.target.value || null })}
            />
          </label>
        </div>

        {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
        {saved && <div className="alert alert-success py-2 text-sm">Saved!</div>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

// ─── Portfolio tab ────────────────────────────────────────────────────────────

function PortfolioTab() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<Map<number, string>>(new Map());

  const refresh = useCallback(() => {
    apiFetch<PortfolioItem[]>('/api/artist/portfolio')
      .then((d) => {
        setItems(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await apiFetch('/api/artist/portfolio', {
        method: 'POST',
        body: JSON.stringify({ image_url: newUrl.trim(), caption: newCaption.trim() || null }),
      });
      setNewUrl('');
      setNewCaption('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add image');
    } finally {
      setAdding(false);
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[idx];
    const b = items[target];
    const reordered = [...items];
    reordered[idx] = b;
    reordered[target] = a;
    setItems(reordered);
    await Promise.all([
      apiFetch(`/api/artist/portfolio/${a.id}`, {
        method: 'PUT',
        body: JSON.stringify({ display_order: target }),
      }),
      apiFetch(`/api/artist/portfolio/${b.id}`, {
        method: 'PUT',
        body: JSON.stringify({ display_order: idx }),
      }),
    ]);
  };

  const saveCaption = async (id: number) => {
    const caption = editingCaption.get(id) ?? '';
    await apiFetch(`/api/artist/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ caption: caption || null }),
    });
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, caption: caption || null } : it)));
    setEditingCaption((prev) => {
      const n = new Map(prev);
      n.delete(id);
      return n;
    });
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Remove this image from your portfolio?')) return;
    await apiFetch(`/api/artist/portfolio/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Portfolio</h2>
      <p className="text-sm text-base-content/60 mb-4">
        Showcase your best work. Paste an image URL — anything publicly hosted (R2, your own site,
        etc.) will work.
      </p>

      <form onSubmit={addItem} className="card bg-base-100 border border-base-300 mb-6">
        <div className="card-body py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              placeholder="https://..."
              className="input input-bordered flex-1"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              className="input input-bordered flex-1"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? 'Adding...' : 'Add image'}
            </button>
          </div>
          {error && <div className="alert alert-error py-2 text-sm mt-2">{error}</div>}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="text-center text-base-content/50 py-12 border border-dashed border-base-300 rounded-lg">
          Your portfolio is empty. Add your first image above.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => {
            const isEditing = editingCaption.has(item.id);
            return (
              <li
                key={item.id}
                className="flex gap-4 p-3 bg-base-100 border border-base-300 rounded-lg"
              >
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded bg-base-200">
                  <img
                    src={item.image_url}
                    alt={item.caption ?? ''}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        value={editingCaption.get(item.id) ?? ''}
                        onChange={(e) =>
                          setEditingCaption((prev) => new Map(prev).set(item.id, e.target.value))
                        }
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => saveCaption(item.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() =>
                          setEditingCaption((prev) => {
                            const n = new Map(prev);
                            n.delete(item.id);
                            return n;
                          })
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-base-content/80 truncate">
                        {item.caption || (
                          <span className="italic text-base-content/40">No caption</span>
                        )}
                      </p>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() =>
                          setEditingCaption((prev) =>
                            new Map(prev).set(item.id, item.caption ?? ''),
                          )
                        }
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-base-content/40 truncate mt-1">{item.image_url}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    disabled={idx === items.length - 1}
                    onClick={() => move(idx, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => deleteItem(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Testimonials tab ─────────────────────────────────────────────────────────

function TestimonialsTab() {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [quote, setQuote] = useState('');
  const [date, setDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ client_name: string; quote: string; date: string }>({
    client_name: '',
    quote: '',
    date: '',
  });

  const refresh = useCallback(() => {
    apiFetch<TestimonialItem[]>('/api/artist/testimonials')
      .then((d) => {
        setItems(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !quote.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await apiFetch('/api/artist/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          client_name: clientName.trim(),
          quote: quote.trim(),
          date: date || null,
        }),
      });
      setClientName('');
      setQuote('');
      setDate('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add testimonial');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (t: TestimonialItem) => {
    setEditingId(t.id);
    setEditDraft({ client_name: t.client_name, quote: t.quote, date: t.date ?? '' });
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    await apiFetch(`/api/artist/testimonials/${editingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        client_name: editDraft.client_name.trim(),
        quote: editDraft.quote.trim(),
        date: editDraft.date || null,
      }),
    });
    setItems((prev) =>
      prev.map((t) =>
        t.id === editingId ? { ...t, ...editDraft, date: editDraft.date || null } : t,
      ),
    );
    setEditingId(null);
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[idx];
    const b = items[target];
    const reordered = [...items];
    reordered[idx] = b;
    reordered[target] = a;
    setItems(reordered);
    await Promise.all([
      apiFetch(`/api/artist/testimonials/${a.id}`, {
        method: 'PUT',
        body: JSON.stringify({ display_order: target }),
      }),
      apiFetch(`/api/artist/testimonials/${b.id}`, {
        method: 'PUT',
        body: JSON.stringify({ display_order: idx }),
      }),
    ]);
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this testimonial?')) return;
    await apiFetch(`/api/artist/testimonials/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Testimonials</h2>
      <p className="text-sm text-base-content/60 mb-4">
        Add quotes from past clients. These appear on your public profile.
      </p>

      <form onSubmit={add} className="card bg-base-100 border border-base-300 mb-6">
        <div className="card-body py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Client name"
              className="input input-bordered"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <input
              type="date"
              placeholder="Date (optional)"
              className="input input-bordered"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <textarea
            required
            placeholder="What they said..."
            className="textarea textarea-bordered h-20"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
          {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
          <button type="submit" className="btn btn-primary self-start" disabled={adding}>
            {adding ? 'Adding...' : 'Add testimonial'}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="text-center text-base-content/50 py-12 border border-dashed border-base-300 rounded-lg">
          No testimonials yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((t, idx) => (
            <li key={t.id} className="p-4 bg-base-100 border border-base-300 rounded-lg">
              {editingId === t.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm"
                      value={editDraft.client_name}
                      onChange={(e) => setEditDraft({ ...editDraft, client_name: e.target.value })}
                    />
                    <input
                      type="date"
                      className="input input-bordered input-sm"
                      value={editDraft.date}
                      onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                    />
                  </div>
                  <textarea
                    className="textarea textarea-bordered textarea-sm h-20 w-full"
                    value={editDraft.quote}
                    onChange={(e) => setEditDraft({ ...editDraft, quote: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-sm btn-primary" onClick={saveEdit}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-3">
                  <div className="flex-1">
                    <p className="italic text-base-content/80 mb-1">"{t.quote}"</p>
                    <p className="text-sm text-base-content/60">
                      — {t.client_name}
                      {t.date ? ` · ${t.date}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      disabled={idx === 0}
                      onClick={() => move(idx, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      disabled={idx === items.length - 1}
                      onClick={() => move(idx, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost text-error"
                      onClick={() => remove(t.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

type Tab = 'bookings' | 'availability' | 'services' | 'portfolio' | 'testimonials' | 'profile';

export default function ArtistDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('bookings');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Artist Dashboard</h1>
      <div role="tablist" className="tabs tabs-bordered mb-6">
        {(
          ['bookings', 'availability', 'services', 'portfolio', 'testimonials', 'profile'] as Tab[]
        ).map((t) => (
          <button
            key={t}
            role="tab"
            className={`tab tab-lg capitalize ${activeTab === t ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {activeTab === 'bookings' && <BookingsTab />}
      {activeTab === 'availability' && <AvailabilityTab />}
      {activeTab === 'services' && <ServicesTab />}
      {activeTab === 'portfolio' && <PortfolioTab />}
      {activeTab === 'testimonials' && <TestimonialsTab />}
      {activeTab === 'profile' && <ProfileTab />}
    </div>
  );
}
