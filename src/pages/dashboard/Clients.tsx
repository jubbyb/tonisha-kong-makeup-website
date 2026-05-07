import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import type { ClientSummary, ClientDetail, Booking } from './types';
import { STATUS_BADGE } from './types';

// ─── Clients tab — CRM view derived from bookings ─────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

function fmt(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-JM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ─── Inline drawer for one expanded client ────────────────────────────────────

function ClientDrawer({
  client,
  onClose,
}: {
  client: ClientSummary;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<ClientDetail>(`/api/artist/clients/${encodeURIComponent(client.email)}`)
      .then((d) => {
        setDetail(d);
        setNotes(d.notes?.notes ?? '');
        setTags(parseTags(d.notes?.tags ?? null));
        setIsVip(Boolean(d.notes?.is_vip));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [client.email]);

  const save = useCallback(
    async (overrides?: Partial<{ notes: string; tags: string[]; isVip: boolean }>) => {
      setSaving(true);
      setSaved(false);
      const n = overrides?.notes ?? notes;
      const t = overrides?.tags ?? tags;
      const v = overrides?.isVip ?? isVip;
      await apiFetch(`/api/artist/clients/${encodeURIComponent(client.email)}`, {
        method: 'PUT',
        body: JSON.stringify({ notes: n, tags: JSON.stringify(t), is_vip: v ? 1 : 0 }),
      }).catch(() => null);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [client.email, notes, tags, isVip],
  );

  const toggleVip = async () => {
    const next = !isVip;
    setIsVip(next);
    await save({ isVip: next });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput('');
    save({ tags: next });
  };

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    save({ tags: next });
  };

  return (
    <div
      className="border rounded-lg mt-2 p-5"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
          Client detail
        </span>
        <button
          onClick={onClose}
          className="text-xs hover:underline"
          style={{ color: 'var(--ink-3)' }}
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking history */}
          <div>
            <p className="eyebrow mb-3" style={{ color: 'var(--ink-3)' }}>
              Booking history
            </p>
            {detail?.bookings.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
                No bookings yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {detail?.bookings.map((b: Booking) => (
                  <li
                    key={b.id}
                    className="flex items-start justify-between gap-3 py-2 border-b"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {b.service}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                        {fmt(b.date)}
                        {b.start_time ? ` · ${b.start_time}` : ''}
                      </p>
                      {b.message && (
                        <p className="text-xs mt-0.5 italic" style={{ color: 'var(--ink-3)' }}>
                          "{b.message}"
                        </p>
                      )}
                    </div>
                    <span className={`badge badge-sm ${STATUS_BADGE[b.status] ?? ''} shrink-0`}>
                      {b.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes & tags */}
          <div className="space-y-5">
            {/* VIP toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={isVip}
                onChange={toggleVip}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span className="text-sm" style={{ color: 'var(--ink-2)' }}>
                Mark as VIP
              </span>
            </label>

            {/* Tags */}
            <div>
              <p className="eyebrow mb-2" style={{ color: 'var(--ink-3)' }}>
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: 'var(--accent-muted, color-mix(in srgb, var(--accent) 15%, transparent))',
                      color: 'var(--accent)',
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{ lineHeight: 1, fontWeight: 700, opacity: 0.7 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-sm input-bordered flex-1"
                  placeholder="bride, regular, referral…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  style={{ fontSize: '0.8rem' }}
                />
                <button
                  onClick={addTag}
                  className="btn btn-sm"
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Private notes */}
            <div>
              <p className="eyebrow mb-2" style={{ color: 'var(--ink-3)' }}>
                Private notes
              </p>
              <textarea
                className="textarea textarea-bordered w-full text-sm"
                rows={4}
                placeholder="Skin sensitivity, preferred products, special requests…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => save()}
                style={{ resize: 'vertical', fontSize: '0.85rem' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>
                {saving ? 'Saving…' : saved ? 'Saved' : 'Auto-saves on blur · visible only to you'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Clients tab root ─────────────────────────────────────────────────────────

type SortKey = 'recent' | 'bookings' | 'vip';

export default function Clients() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vipOnly, setVipOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ClientSummary[]>('/api/artist/clients')
      .then((d) => {
        setClients(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  const total = clients.length;
  const returning = clients.filter((c) => c.completed_count >= 2).length;
  const returningRate = total > 0 ? Math.round((returning / total) * 100) : 0;

  // mode of service field — most booked service
  const serviceCounts: Record<string, number> = {};
  clients.forEach((c) => {
    // We don't have per-client service breakdown in the list endpoint; skip
    void c;
  });
  void serviceCounts;

  const q = search.trim().toLowerCase();
  const filtered = clients
    .filter((c) => {
      if (vipOnly && !c.is_vip) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'bookings') return b.booking_count - a.booking_count;
      if (sortBy === 'vip') return (b.is_vip ?? 0) - (a.is_vip ?? 0) || b.booking_count - a.booking_count;
      // recent
      return b.last_booking_date.localeCompare(a.last_booking_date);
    });

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total clients', value: total },
          { label: 'Returning rate', value: `${returningRate}%` },
          { label: 'Repeat clients', value: returning },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-4 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
          >
            <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
              {label}
            </p>
            <p className="text-2xl font-display font-semibold" style={{ color: 'var(--ink)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          className="input input-bordered input-sm flex-1 min-w-[180px]"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={vipOnly}
            onChange={(e) => setVipOnly(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--ink-2)' }}>VIP only</span>
        </label>

        <select
          className="select select-sm select-bordered"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          style={{ fontSize: '0.8rem' }}
        >
          <option value="recent">Most recent</option>
          <option value="bookings">Most bookings</option>
          <option value="vip">VIP first</option>
        </select>
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--ink-3)' }}>
          {total === 0
            ? 'No clients yet — they will appear here once bookings come in.'
            : 'No clients match your search.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => {
            const isOpen = expanded === c.email;
            const isReturning = c.completed_count >= 2;
            return (
              <li key={c.email}>
                <div
                  className="flex items-center gap-4 p-4 border cursor-pointer transition-colors"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--line)',
                  }}
                  onClick={() => setExpanded(isOpen ? null : c.email)}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    {initials(c.name)}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
                        {c.name}
                      </span>
                      {c.is_vip ? (
                        <span className="badge badge-sm badge-warning">VIP</span>
                      ) : null}
                      {isReturning ? (
                        <span className="badge badge-sm badge-info">Returning</span>
                      ) : null}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--ink-3)' }}>
                      {c.email}
                    </p>
                  </div>

                  {/* Chips */}
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-xs" style={{ color: 'var(--ink-3)' }}>
                    <span>{c.booking_count} booking{c.booking_count !== 1 ? 's' : ''}</span>
                    <span>Last: {fmt(c.last_booking_date)}</span>
                  </div>

                  {/* Chevron */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: 'var(--ink-3)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {isOpen && (
                  <ClientDrawer client={c} onClose={() => setExpanded(null)} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
