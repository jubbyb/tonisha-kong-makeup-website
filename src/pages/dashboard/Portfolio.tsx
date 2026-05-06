import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import type { PortfolioItem } from './types';

// ─── Portfolio tab ────────────────────────────────────────────────────────────

export default function Portfolio() {
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
      {/* ── header ── */}
      <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
        Your Work
      </p>
      <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--ink)' }}>
        Portfolio
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--ink-3)' }}>
        Showcase your best work. Paste an image URL — anything publicly hosted (R2, your own site,
        etc.) will work.
      </p>

      {/* ── add form ── */}
      <form
        onSubmit={addItem}
        className="border p-4 mb-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
      >
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
      </form>

      {items.length === 0 ? (
        <div
          className="text-center text-sm py-12 border border-dashed"
          style={{ color: 'var(--ink-3)', borderColor: 'var(--line-2)' }}
        >
          Your portfolio is empty. Add your first image above.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => {
            const isEditing = editingCaption.has(item.id);
            return (
              <li
                key={item.id}
                className="flex gap-4 p-3 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
              >
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-base-200">
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
                      <p className="text-sm truncate" style={{ color: 'var(--ink-2)' }}>
                        {item.caption || (
                          <span className="italic" style={{ color: 'var(--ink-3)' }}>
                            No caption
                          </span>
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
                  <p className="text-xs truncate mt-1" style={{ color: 'var(--ink-3)' }}>
                    {item.image_url}
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
