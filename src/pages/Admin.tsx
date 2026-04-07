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
      if (!res.ok) { const d = await res.json<{ error: string }>(); throw new Error(d.error); }
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

// ── Admin shell ───────────────────────────────────────────────────────────────

const Admin: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('adminToken'));
  const [activeTab, setActiveTab] = useState<'bookings' | 'classes' | 'artists'>('bookings');

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
        {(['bookings', 'classes', 'artists'] as const).map((t) => (
          <button key={t} role="tab" className={`tab tab-lg capitalize ${activeTab === t ? 'tab-active' : ''}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && <BookingsTab token={token} />}
      {activeTab === 'classes' && <ClassesTab token={token} />}
      {activeTab === 'artists' && <ArtistsTab token={token} />}
    </div>
  );
};

export default Admin;
