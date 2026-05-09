import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { CatalogCategory } from './types';

// ─── Services tab — catalog checkbox + price override ────────────────────────

export default function Services() {
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [selected, setSelected] = useState<Map<number, number | null>>(new Map());
  const [overrideText, setOverrideText] = useState<Map<number, string>>(new Map());
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/service-catalog').then((r) => r.json() as Promise<CatalogCategory[]>),
      apiFetch<Array<{ service_id: number; price_override: number | null }>>('/api/artist/services'),
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

  const visible = activeCategory === null ? catalog : catalog.filter((c) => c.id === activeCategory);

  return (
    <div>
      {/* ── header ── */}
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div>
          <p className="eyebrow" style={{ color: 'var(--ink-3)' }}>
            Offered Services
          </p>
          <h2 className="text-2xl font-display font-semibold" style={{ color: 'var(--ink)' }}>
            My Services
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>
            Select the services you offer. Set a custom price if yours differs from the catalog —
            leave blank to use the default.
          </p>
        </div>
        <button
          className={`btn btn-sm ${saved ? 'btn-success' : 'btn-primary'}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="alert alert-error py-2 text-sm mb-4">{error}</div>}

      {catalog.length === 0 ? (
        <div
          className="text-center text-sm py-12 border"
          style={{ color: 'var(--ink-3)', borderColor: 'var(--line)' }}
        >
          No services in the catalog yet. Ask an admin to add some.
        </div>
      ) : (
        <>
          {/* ── category filter pills ── */}
          <div
            className="mb-5 flex gap-2 overflow-x-auto pb-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: activeCategory === null ? 600 : 400,
                color: activeCategory === null ? 'var(--accent)' : 'var(--ink-3)',
                border: `1px solid ${activeCategory === null ? 'var(--accent)' : 'var(--line-2)'}`,
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '99px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              All
            </button>
            {catalog.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: activeCategory === cat.id ? 600 : 400,
                  color: activeCategory === cat.id ? 'var(--accent)' : 'var(--ink-3)',
                  border: `1px solid ${activeCategory === cat.id ? 'var(--accent)' : 'var(--line-2)'}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '99px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* ── catalog ── */}
          <div className="space-y-5">
            {visible.map((cat) => (
            <div
              key={cat.id}
              className="border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
            >
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--ink)' }}>
                {cat.name}
              </h3>
              {cat.subcategories.map((sub) => (
                <div key={sub.id} className="mb-5 last:mb-0">
                  <p
                    className="eyebrow mb-2"
                    style={{ color: 'var(--ink-3)' }}
                  >
                    {sub.name}
                  </p>
                  <div className="space-y-2">
                    {sub.services.map((svc) => {
                      const isSelected = selected.has(svc.id);
                      return (
                        <div
                          key={svc.id}
                          className="flex items-start gap-3 p-2 transition-colors hover:bg-base-200"
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
                              <span className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
                                {svc.name}
                              </span>
                              <div
                                className="text-right whitespace-nowrap text-xs"
                                style={{ color: 'var(--ink-3)' }}
                              >
                                {svc.price != null && (
                                  <span className="mr-2">Catalog: ${svc.price}</span>
                                )}
                                <span>{svc.duration_min} min</span>
                              </div>
                            </div>
                            {svc.description && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
                                {svc.description}
                              </p>
                            )}
                            {isSelected && (
                              <div className="mt-2 flex items-center gap-2">
                                <label
                                  className="text-xs"
                                  style={{ color: 'var(--ink-3)' }}
                                >
                                  My price:
                                </label>
                                <div className="flex items-center gap-1">
                                  <span
                                    className="text-sm"
                                    style={{ color: 'var(--ink-3)' }}
                                  >
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={svc.price != null ? String(svc.price) : 'Set price'}
                                    className="input input-bordered input-xs w-24"
                                    value={overrideText.get(svc.id) ?? ''}
                                    onChange={(e) => updateOverride(svc.id, e.target.value)}
                                  />
                                </div>
                                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
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
          ))}
          </div>
        </>
      )}
    </div>
  );
}
