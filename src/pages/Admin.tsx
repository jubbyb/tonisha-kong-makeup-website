import React, { useState, useEffect, useCallback } from 'react';

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  date: string;
  message: string | null;
  created_at: string;
}

interface ClassItem {
  id: number;
  name: string;
  description: string;
  date: string;
  price: number;
  certificate: number;
  mentoring: number;
}

type ClassFormData = {
  name: string;
  description: string;
  date: string;
  price: string;
  certificate: boolean;
  mentoring: boolean;
};

const emptyClassForm = (): ClassFormData => ({
  name: '',
  description: '',
  date: '',
  price: '',
  certificate: false,
  mentoring: false,
});

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Invalid password');
      sessionStorage.setItem('adminToken', password);
      onLogin(password);
    } catch {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl mb-2">Admin Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="input input-bordered flex items-center gap-2">
                <span className="label">Password</span>
                <input
                  type="password"
                  className="grow"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </label>
            </div>
            {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Bookings tab ──────────────────────────────────────────────────────────────

function BookingsTab({ token }: { token: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load bookings');
      setBookings(await res.json());
    } catch {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this booking?')) return;
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>;
  if (error) return <div className="alert alert-error mt-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Bookings</h2>
        <span className="badge badge-neutral">{bookings.length} total</span>
      </div>
      {bookings.length === 0 ? (
        <div className="text-center text-base-content/60 py-12">No bookings yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Message</th>
                <th>Received</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap">{new Date(b.date).toLocaleString()}</td>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>{b.phone ?? '—'}</td>
                  <td>{b.service}</td>
                  <td className="max-w-xs truncate">{b.message ?? '—'}</td>
                  <td className="whitespace-nowrap text-sm text-base-content/60">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-error btn-xs"
                      onClick={() => handleDelete(b.id)}
                    >
                      Delete
                    </button>
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

// ── Classes tab ───────────────────────────────────────────────────────────────

function ClassesTab({ token }: { token: string }) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassFormData>(emptyClassForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setClasses(await res.json());
    } catch {
      setError('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const openAdd = () => {
    setEditingClass(null);
    setForm(emptyClassForm());
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (c: ClassItem) => {
    setEditingClass(c);
    setForm({
      name: c.name,
      description: c.description,
      date: c.date,
      price: String(c.price),
      certificate: !!c.certificate,
      mentoring: !!c.mentoring,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this class?')) return;
    await fetch(`/api/admin/classes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const payload = {
      name: form.name,
      description: form.description,
      date: form.date,
      price: parseFloat(form.price),
      certificate: form.certificate,
      mentoring: form.mentoring,
    };

    try {
      const url = editingClass ? `/api/admin/classes/${editingClass.id}` : '/api/admin/classes';
      const res = await fetch(url, {
        method: editingClass ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      await fetchClasses();
      setModalOpen(false);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>;
  if (error) return <div className="alert alert-error mt-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Classes</h2>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Class</button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center text-base-content/60 py-12">No classes yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Price</th>
                <th>Certificate</th>
                <th>Mentoring</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-base-content/60 max-w-xs truncate">{c.description}</div>
                  </td>
                  <td className="whitespace-nowrap">{new Date(c.date).toLocaleString()}</td>
                  <td>${c.price}</td>
                  <td>{c.certificate ? '✓' : '—'}</td>
                  <td>{c.mentoring ? '✓' : '—'}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-error btn-xs" onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setModalOpen(false)}
            >✕</button>
            <h3 className="font-bold text-lg mb-4">{editingClass ? 'Edit Class' : 'Add Class'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Name</span>
                <input type="text" className="grow" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label className="textarea textarea-bordered flex items-start gap-2 pt-2">
                <span className="label w-24 mt-1">Description</span>
                <textarea className="grow" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Date</span>
                <input type="datetime-local" className="grow" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Price ($)</span>
                <input type="number" min="0" step="0.01" className="grow" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </label>
              <div className="flex gap-6 pl-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="checkbox checkbox-primary" checked={form.certificate} onChange={(e) => setForm({ ...form, certificate: e.target.checked })} />
                  <span>Certificate</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="checkbox checkbox-primary" checked={form.mentoring} onChange={(e) => setForm({ ...form, mentoring: e.target.checked })} />
                  <span>1-on-1 Mentoring</span>
                </label>
              </div>
              {saveError && <div className="alert alert-error py-2 text-sm">{saveError}</div>}
              <div className="modal-action mt-2">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingClass ? 'Save Changes' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}

// ── Artists tab ───────────────────────────────────────────────────────────────

interface ArtistRecord {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
  is_active: number;
}

type ArtistForm = { name: string; email: string; password: string; bio: string; specialties: string; photo_url: string };
const emptyArtistForm = (): ArtistForm => ({ name: '', email: '', password: '', bio: '', specialties: '', photo_url: '' });

function ArtistsTab({ token }: { token: string }) {
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ArtistForm>(emptyArtistForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/artists', { headers: { Authorization: `Bearer ${token}` } });
    setArtists(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, bio: form.bio || undefined, specialties: form.specialties || undefined, photo_url: form.photo_url || undefined }),
      });
      if (!res.ok) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      await fetchArtists();
      setModalOpen(false);
      setForm(emptyArtistForm());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create artist');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (artist: ArtistRecord) => {
    await fetch(`/api/admin/artists/${artist.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !artist.is_active }),
    });
    fetchArtists();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this artist? This cannot be undone.')) return;
    await fetch(`/api/admin/artists/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setArtists((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Artists</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(emptyArtistForm()); setSaveError(null); setModalOpen(true); }}>+ Add Artist</button>
      </div>

      {artists.length === 0 ? (
        <div className="text-center text-base-content/50 py-12">No artists yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead><tr><th>Name</th><th>Email</th><th>Specialties</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {artists.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="font-medium">{a.name}</div>
                    {a.bio && <div className="text-xs text-base-content/60 max-w-xs truncate">{a.bio}</div>}
                  </td>
                  <td>{a.email}</td>
                  <td className="text-sm">{a.specialties ?? '—'}</td>
                  <td>
                    <button className={`badge ${a.is_active ? 'badge-success' : 'badge-error'} cursor-pointer`} onClick={() => handleToggleActive(a)}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-error btn-xs" onClick={() => handleDelete(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setModalOpen(false)}>✕</button>
            <h3 className="font-bold text-lg mb-4">Add Artist</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {(['name', 'email'] as const).map((field) => (
                <label key={field} className="input input-bordered flex items-center gap-2">
                  <span className="label w-24 capitalize">{field}</span>
                  <input type={field === 'email' ? 'email' : 'text'} className="grow" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required />
                </label>
              ))}
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Password</span>
                <input type="password" className="grow" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Specialties</span>
                <input type="text" className="grow" placeholder="Bridal, Editorial" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Photo URL</span>
                <input type="url" className="grow" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
              </label>
              <label className="textarea textarea-bordered flex items-start gap-2 pt-2">
                <span className="label w-24 mt-1">Bio</span>
                <textarea className="grow" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
              </label>
              {saveError && <div className="alert alert-error py-2 text-sm">{saveError}</div>}
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Artist'}</button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    setUsers(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (user: UserRecord, newRole: string) => {
    setSaving(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
    setSaving(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <span className="badge badge-neutral">{users.length} total</span>
      </div>
      {users.length === 0 ? (
        <div className="text-center text-base-content/50 py-12">No users yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="select select-bordered select-xs"
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                    >
                      <option value="user">Client</option>
                      <option value="artist">Artist</option>
                    </select>
                  </td>
                  <td className="text-sm text-base-content/60 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-error btn-xs" onClick={() => handleDelete(u.id)}>Delete</button>
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

// ── Services tab ─────────────────────────────────────────────────────────────

interface ServiceCategory { id: number; name: string; sort_order: number }
interface ServiceSubcategory { id: number; category_id: number; name: string; sort_order: number }
interface CatalogServiceItem { id: number; subcategory_id: number; name: string; description: string | null; price: number | null; duration_min: number; sort_order: number }

function ServicesTab({ token }: { token: string }) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [services, setServices] = useState<CatalogServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UI sub-section: 'categories' | 'subcategories' | 'services'
  const [section, setSection] = useState<'categories' | 'subcategories' | 'services'>('categories');

  // Modal state
  const [modal, setModal] = useState<null | { type: 'category' | 'subcategory' | 'service'; item?: ServiceCategory | ServiceSubcategory | CatalogServiceItem }>(null);
  const [formData, setFormData] = useState<Record<string, string | number | null>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [cats, subs, svcs] = await Promise.all([
      fetch('/api/admin/service-catalog/categories', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json() as Promise<ServiceCategory[]>),
      fetch('/api/admin/service-catalog/subcategories', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json() as Promise<ServiceSubcategory[]>),
      fetch('/api/admin/service-catalog/services', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json() as Promise<CatalogServiceItem[]>),
    ]);
    setCategories(cats);
    setSubcategories(subs);
    setServices(svcs);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = (type: 'category' | 'subcategory' | 'service') => {
    const defaults: Record<string, string | number> =
      type === 'category' ? { name: '', sort_order: 0 } :
      type === 'subcategory' ? { name: '', sort_order: 0, category_id: categories[0]?.id ?? '' } :
      { name: '', description: '', price: '', duration_min: 60, sort_order: 0, subcategory_id: subcategories[0]?.id ?? '' };
    setFormData(defaults);
    setSaveError(null);
    setModal({ type });
  };

  const openEdit = (type: 'category' | 'subcategory' | 'service', item: ServiceCategory | ServiceSubcategory | CatalogServiceItem) => {
    setFormData({ ...item });
    setSaveError(null);
    setModal({ type, item });
  };

  const handleDelete = async (type: 'category' | 'subcategory' | 'service', id: number) => {
    const label = type === 'category' ? 'category (and all subcategories and services within it)' : type === 'subcategory' ? 'subcategory (and all services within it)' : 'service';
    if (!confirm(`Delete this ${label}?`)) return;
    const url =
      type === 'category' ? `/api/admin/service-catalog/categories/${id}` :
      type === 'subcategory' ? `/api/admin/service-catalog/subcategories/${id}` :
      `/api/admin/service-catalog/services/${id}`;
    await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setSaveError(null);
    const { type, item } = modal;
    const url = item
      ? `/api/admin/service-catalog/${type === 'category' ? 'categories' : type === 'subcategory' ? 'subcategories' : 'services'}/${(item as ServiceCategory).id}`
      : `/api/admin/service-catalog/${type === 'category' ? 'categories' : type === 'subcategory' ? 'subcategories' : 'services'}`;
    try {
      const body: Record<string, string | number | null> = { ...formData };
      if (type === 'service') {
        body.price = formData.price === '' ? null : Number(formData.price);
        body.duration_min = Number(formData.duration_min) || 60;
        body.sort_order = Number(formData.sort_order) || 0;
        body.subcategory_id = Number(formData.subcategory_id);
      } else if (type === 'subcategory') {
        body.category_id = Number(formData.category_id);
        body.sort_order = Number(formData.sort_order) || 0;
      } else {
        body.sort_order = Number(formData.sort_order) || 0;
      }
      const res = await fetch(url, { method: item ? 'PUT' : 'POST', headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      await fetchAll();
      setModal(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>;

  const catName = (id: number) => categories.find((c) => c.id === id)?.name ?? '—';
  const subName = (id: number) => { const s = subcategories.find((s) => s.id === id); return s ? `${catName(s.category_id)} › ${s.name}` : '—'; };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Service Catalog</h2>
      </div>

      <div className="tabs tabs-boxed mb-6 w-fit">
        {(['categories', 'subcategories', 'services'] as const).map((s) => (
          <button key={s} className={`tab capitalize ${section === s ? 'tab-active' : ''}`} onClick={() => setSection(s)}>{s}</button>
        ))}
      </div>

      {/* ── Categories ── */}
      {section === 'categories' && (
        <div>
          <div className="flex justify-end mb-3">
            <button className="btn btn-primary btn-sm" onClick={() => openAdd('category')}>+ Add Category</button>
          </div>
          {categories.length === 0 ? (
            <div className="text-center text-base-content/50 py-12">No categories yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-zebra w-full">
                <thead><tr><th>Name</th><th>Sort Order</th><th>Subcategories</th><th></th></tr></thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.name}</td>
                      <td>{c.sort_order}</td>
                      <td className="text-sm text-base-content/60">{subcategories.filter((s) => s.category_id === c.id).length}</td>
                      <td className="space-x-2">
                        <button className="btn btn-ghost btn-xs" onClick={() => openEdit('category', c)}>Edit</button>
                        <button className="btn btn-error btn-xs" onClick={() => handleDelete('category', c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Subcategories ── */}
      {section === 'subcategories' && (
        <div>
          <div className="flex justify-end mb-3">
            <button className="btn btn-primary btn-sm" onClick={() => openAdd('subcategory')}>+ Add Subcategory</button>
          </div>
          {subcategories.length === 0 ? (
            <div className="text-center text-base-content/50 py-12">No subcategories yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-zebra w-full">
                <thead><tr><th>Category</th><th>Name</th><th>Sort Order</th><th>Services</th><th></th></tr></thead>
                <tbody>
                  {subcategories.map((s) => (
                    <tr key={s.id}>
                      <td className="text-sm text-base-content/60">{catName(s.category_id)}</td>
                      <td className="font-medium">{s.name}</td>
                      <td>{s.sort_order}</td>
                      <td className="text-sm text-base-content/60">{services.filter((sv) => sv.subcategory_id === s.id).length}</td>
                      <td className="space-x-2">
                        <button className="btn btn-ghost btn-xs" onClick={() => openEdit('subcategory', s)}>Edit</button>
                        <button className="btn btn-error btn-xs" onClick={() => handleDelete('subcategory', s.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Services ── */}
      {section === 'services' && (
        <div>
          <div className="flex justify-end mb-3">
            <button className="btn btn-primary btn-sm" onClick={() => openAdd('service')}>+ Add Service</button>
          </div>
          {services.length === 0 ? (
            <div className="text-center text-base-content/50 py-12">No services yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-zebra w-full">
                <thead><tr><th>Category › Sub</th><th>Name</th><th>Price</th><th>Duration</th><th>Sort</th><th></th></tr></thead>
                <tbody>
                  {services.map((sv) => (
                    <tr key={sv.id}>
                      <td className="text-sm text-base-content/60">{subName(sv.subcategory_id)}</td>
                      <td>
                        <div className="font-medium">{sv.name}</div>
                        {sv.description && <div className="text-xs text-base-content/50 max-w-xs truncate">{sv.description}</div>}
                      </td>
                      <td>{sv.price != null ? `$${sv.price}` : '—'}</td>
                      <td>{sv.duration_min} min</td>
                      <td>{sv.sort_order}</td>
                      <td className="space-x-2">
                        <button className="btn btn-ghost btn-xs" onClick={() => openEdit('service', sv)}>Edit</button>
                        <button className="btn btn-error btn-xs" onClick={() => handleDelete('service', sv.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setModal(null)}>✕</button>
            <h3 className="font-bold text-lg mb-4 capitalize">{modal.item ? 'Edit' : 'Add'} {modal.type}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              {modal.type === 'subcategory' && (
                <div className="form-control">
                  <label className="label"><span className="label-text">Category</span></label>
                  <select className="select select-bordered" value={formData.category_id ?? ''} onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })} required>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {modal.type === 'service' && (
                <div className="form-control">
                  <label className="label"><span className="label-text">Subcategory</span></label>
                  <select className="select select-bordered" value={formData.subcategory_id ?? ''} onChange={(e) => setFormData({ ...formData, subcategory_id: Number(e.target.value) })} required>
                    {subcategories.map((s) => <option key={s.id} value={s.id}>{catName(s.category_id)} › {s.name}</option>)}
                  </select>
                </div>
              )}
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Name</span>
                <input type="text" className="grow" value={String(formData.name ?? '')} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </label>
              {modal.type === 'service' && (
                <>
                  <label className="textarea textarea-bordered flex items-start gap-2 pt-2">
                    <span className="label w-24 mt-1">Description</span>
                    <textarea className="grow" rows={2} value={String(formData.description ?? '')} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="label w-24">Price ($)</span>
                    <input type="number" min="0" step="0.01" className="grow" placeholder="Optional" value={String(formData.price ?? '')} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="label w-24">Duration</span>
                    <input type="number" min="1" className="grow" value={String(formData.duration_min ?? 60)} onChange={(e) => setFormData({ ...formData, duration_min: e.target.value })} required />
                    <span className="text-sm text-base-content/60">min</span>
                  </label>
                </>
              )}
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Sort Order</span>
                <input type="number" className="grow" value={String(formData.sort_order ?? 0)} onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })} />
              </label>
              {saveError && <div className="alert alert-error py-2 text-sm">{saveError}</div>}
              <div className="modal-action mt-2">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : modal.item ? 'Save Changes' : 'Add'}</button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}

// ── Admin shell ───────────────────────────────────────────────────────────────

const Admin: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('adminToken'));
  const [activeTab, setActiveTab] = useState<'bookings' | 'classes' | 'artists' | 'users' | 'services'>('bookings');

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setToken(null);
  };

  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        {(['bookings', 'classes', 'artists', 'users', 'services'] as const).map((t) => (
          <button key={t} role="tab" className={`tab tab-lg capitalize ${activeTab === t ? 'tab-active' : ''}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && <BookingsTab token={token} />}
      {activeTab === 'classes' && <ClassesTab token={token} />}
      {activeTab === 'artists' && <ArtistsTab token={token} />}
      {activeTab === 'users' && <UsersTab token={token} />}
      {activeTab === 'services' && <ServicesTab token={token} />}
    </div>
  );
};

export default Admin;
