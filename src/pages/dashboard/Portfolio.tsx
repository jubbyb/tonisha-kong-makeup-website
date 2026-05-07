import React, { useEffect, useRef, useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { apiFetch } from '../../lib/api';
import { cfImage } from '../../lib/cfImage';
import { PORTFOLIO_LIMIT, type PortfolioItem } from './types';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const COMPRESSION_OPTS = { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true };

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newUrlCaption, setNewUrlCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingCaption, setEditingCaption] = useState<Map<number, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const atLimit = items.length >= PORTFOLIO_LIMIT;

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

  const handleFile = async (file: File) => {
    if (atLimit) return;
    setError(null);
    setUploading(true);
    try {
      const compressed = await imageCompression(file, COMPRESSION_OPTS);
      const form = new FormData();
      form.append('file', compressed, compressed.name || file.name);
      if (pendingCaption.trim()) form.append('caption', pendingCaption.trim());
      await apiFetch<PortfolioItem>('/api/artist/portfolio/upload', {
        method: 'POST',
        body: form,
      });
      setPendingCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const addByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || atLimit) return;
    setAdding(true);
    setError(null);
    try {
      await apiFetch('/api/artist/portfolio', {
        method: 'POST',
        body: JSON.stringify({ image_url: newUrl.trim(), caption: newUrlCaption.trim() || null }),
      });
      setNewUrl('');
      setNewUrlCaption('');
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
      <div className="flex items-end justify-between mb-1">
        <div>
          <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
            Your Work
          </p>
          <h2 className="text-2xl font-display font-semibold" style={{ color: 'var(--ink)' }}>
            Portfolio
          </h2>
        </div>
        <span className="text-sm" style={{ color: atLimit ? 'var(--error, #c33)' : 'var(--ink-3)' }}>
          {items.length}/{PORTFOLIO_LIMIT} photos
        </span>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--ink-3)' }}>
        Upload up to {PORTFOLIO_LIMIT} photos of your work. Images are compressed and resized in your
        browser for fast uploads.
      </p>

      {/* ── upload card ── */}
      <div
        className="border p-4 mb-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={onPickFile}
            disabled={uploading || atLimit}
            className="file-input file-input-bordered flex-1"
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            className="input input-bordered flex-1"
            value={pendingCaption}
            onChange={(e) => setPendingCaption(e.target.value)}
            disabled={uploading || atLimit}
          />
          {uploading && (
            <span className="loading loading-spinner loading-sm" aria-label="Uploading" />
          )}
        </div>
        {atLimit && (
          <p className="text-xs mt-2" style={{ color: 'var(--ink-3)' }}>
            You've reached the {PORTFOLIO_LIMIT}-photo limit. Delete one to upload a new image.
          </p>
        )}
        {error && <div className="alert alert-error py-2 text-sm mt-2">{error}</div>}
      </div>

      {/* ── URL fallback ── */}
      <button
        type="button"
        className="text-xs underline mb-6"
        style={{ color: 'var(--ink-3)' }}
        onClick={() => setShowUrlForm((v) => !v)}
      >
        {showUrlForm ? 'Hide URL option' : 'Or paste an image URL'}
      </button>
      {showUrlForm && (
        <form
          onSubmit={addByUrl}
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
              disabled={atLimit}
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              className="input input-bordered flex-1"
              value={newUrlCaption}
              onChange={(e) => setNewUrlCaption(e.target.value)}
              disabled={atLimit}
            />
            <button type="submit" className="btn btn-primary" disabled={adding || atLimit}>
              {adding ? 'Adding...' : 'Add image'}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div
          className="text-center text-sm py-12 border border-dashed"
          style={{ color: 'var(--ink-3)', borderColor: 'var(--line-2)' }}
        >
          Your portfolio is empty. Upload your first image above.
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
                    src={cfImage(item.image_url, 200)}
                    alt={item.caption ?? ''}
                    loading="lazy"
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
