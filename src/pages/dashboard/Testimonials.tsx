import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import type { TestimonialItem } from './types';

// ─── Testimonials tab ─────────────────────────────────────────────────────────

export default function Testimonials() {
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
      {/* ── header ── */}
      <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
        Client Feedback
      </p>
      <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--ink)' }}>
        Testimonials
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--ink-3)' }}>
        Add quotes from past clients. These appear on your public profile.
      </p>

      {/* ── add form ── */}
      <form
        onSubmit={add}
        className="border p-4 mb-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
      >
        <div className="space-y-3">
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
            className="textarea textarea-bordered h-20 w-full"
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
        <div
          className="text-center text-sm py-12 border border-dashed"
          style={{ color: 'var(--ink-3)', borderColor: 'var(--line-2)' }}
        >
          No testimonials yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((t, idx) => (
            <li
              key={t.id}
              className="p-4 border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
            >
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
                    <p className="italic mb-1" style={{ color: 'var(--ink-2)' }}>
                      "{t.quote}"
                    </p>
                    <p className="text-sm" style={{ color: 'var(--ink-3)' }}>
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
