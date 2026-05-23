import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { formatPrice } from '../../lib/price';
import type { CatalogCategory } from './types';

// ─── Services tab — catalog checkbox + price / currency overrides ─────────────

// What an artist has set for one Offering. Empty strings mean "inherit catalog".
interface Override {
  price: string;
  price_max: string;
  currency: string; // '' | 'JMD' | 'USD'
}

const emptyOverride = (): Override => ({ price: '', price_max: '', currency: '' });

export default function Services() {
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [selected, setSelected] = useState<Map<number, Override>>(new Map());
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/service-catalog').then((r) => r.json() as Promise<CatalogCategory[]>),
      apiFetch<
        Array<{
          service_id: number;
          price_override: number | null;
          price_max_override: number | null;
          currency_override: string | null;
        }>
      >('/api/artist/services'),
    ])
      .then(([cat, rows]) => {
        setCatalog(cat);
        const m = new Map<number, Override>();
        for (const r of rows) {
          m.set(r.service_id, {
            price: r.price_override != null ? String(r.price_override) : '',
            price_max: r.price_max_override != null ? String(r.price_max_override) : '',
            currency: r.currency_override ?? '',
          });
        }
        setSelected(m);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, emptyOverride());
      return next;
    });
  };

  const updateField = (id: number, field: keyof Override, value: string) => {
    setSelected((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.set(id, { ...next.get(id)!, [field]: value });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const services = Array.from(selected.entries()).map(([service_id, o]) => ({
        service_id,
        price_override: o.price.trim() === '' ? null : parseFloat(o.price),
        price_max_override: o.price_max.trim() === '' ? null : parseFloat(o.price_max),
        currency_override: o.currency === '' ? null : o.currency,
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
            Select the services you offer. Set your own price, currency, and an optional upper
            price for a range — leave a field blank to use the catalog default.
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
                      const ov = selected.get(svc.id);
                      const isSelected = ov !== undefined;
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
                                <span className="mr-2">Catalog: {formatPrice(svc)}</span>
                                <span>{svc.duration_min} min</span>
                              </div>
                            </div>
                            {svc.description && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
                                {svc.description}
                              </p>
                            )}
                            {isSelected && ov && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <label className="text-xs" style={{ color: 'var(--ink-3)' }}>
                                  My price:
                                </label>
                                <select
                                  className="select select-bordered select-xs w-28"
                                  value={ov.currency}
                                  onChange={(e) =>
                                    updateField(svc.id, 'currency', e.target.value)
                                  }
                                  aria-label={`Currency for ${svc.name}`}
                                >
                                  <option value="">{svc.currency} (catalog)</option>
                                  <option value="JMD">JMD</option>
                                  <option value="USD">USD</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={svc.price != null ? String(svc.price) : 'Min'}
                                  className="input input-bordered input-xs w-24"
                                  value={ov.price}
                                  onChange={(e) => updateField(svc.id, 'price', e.target.value)}
                                  aria-label={`Minimum price for ${svc.name}`}
                                />
                                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                                  to
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={
                                    svc.price_max != null ? String(svc.price_max) : 'Max (optional)'
                                  }
                                  className="input input-bordered input-xs w-32"
                                  value={ov.price_max}
                                  onChange={(e) =>
                                    updateField(svc.id, 'price_max', e.target.value)
                                  }
                                  aria-label={`Maximum price for ${svc.name}`}
                                />
                                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                                  (blank = catalog default; max blank = "from" price)
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
