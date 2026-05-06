import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import type { Block, DayHours } from './types';
import { DAY_NAMES, DURATIONS } from './types';

// ─── Hours tab — working hours + block time off ───────────────────────────────

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

export default function Hours() {
  const [days, setDays] = useState<Record<number, DayState>>(
    Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, defaultDay()])),
  );
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hoursLoading, setHoursLoading] = useState(true);

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
      {/* ── Working hours ── */}
      <div>
        <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
          Availability
        </p>
        <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          Working Hours
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--ink-3)' }}>
          Set the days and hours you're available by default. Clients will see these as bookable
          times.
        </p>

        <div className="overflow-x-auto border" style={{ borderColor: 'var(--line)' }}>
          <table className="table w-full">
            <thead>
              <tr style={{ background: 'var(--bg-card)' }}>
                <th className="w-10" />
                <th className="eyebrow" style={{ color: 'var(--ink-3)' }}>
                  Day
                </th>
                <th className="eyebrow" style={{ color: 'var(--ink-3)' }}>
                  Start
                </th>
                <th className="eyebrow" style={{ color: 'var(--ink-3)' }}>
                  End
                </th>
                <th className="eyebrow" style={{ color: 'var(--ink-3)' }}>
                  Slot length
                </th>
                <th />
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
                    <td className="font-medium text-sm">{DAY_NAMES[i]}</td>
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

      {/* ── Block time off ── */}
      <div>
        <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
          Exceptions
        </p>
        <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          Block Time Off
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--ink-3)' }}>
          Block specific dates or hours when you're unavailable — holidays, personal time,
          back-to-back bookings, etc.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add block form */}
          <div className="border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--ink)' }}>
              Block time off
            </h3>
            <form onSubmit={addBlock} className="space-y-3">
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

              {blockError && (
                <div className="alert alert-error py-2 text-sm">{blockError}</div>
              )}

              <button type="submit" className="btn btn-primary w-full" disabled={addingBlock}>
                {addingBlock ? 'Adding...' : 'Block this time'}
              </button>
            </form>
          </div>

          {/* Upcoming blocks list */}
          <div className="border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--ink)' }}>
              Upcoming blocks
            </h3>
            {blocks.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
                No time off blocked.
              </p>
            ) : (
              <ul className="space-y-2">
                {blocks.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-2 py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div>
                      <span className="font-medium text-sm">
                        {new Date(b.date + 'T00:00').toLocaleDateString('default', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-sm ml-2" style={{ color: 'var(--ink-3)' }}>
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
  );
}
