import React, { useState, useEffect, useCallback, useMemo } from 'react';

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
  host_artist_id: number | null;
  host_name?: string;
  total_slots: number;
  duration_min: number;
}

type ClassFormData = {
  name: string;
  description: string;
  date: string;
  price: string;
  certificate: boolean;
  mentoring: boolean;
  host_artist_id: string;
  total_slots: string;
  duration_min: string;
};

const emptyClassForm = (): ClassFormData => ({
  name: '',
  description: '',
  date: '',
  price: '',
  certificate: false,
  mentoring: false,
  host_artist_id: '',
  total_slots: '0',
  duration_min: '60',
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
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassFormData>(emptyClassForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const artistById = useMemo(
    () => new Map(artists.map((a) => [a.id, a.name])),
    [artists],
  );

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, artistRes, bookingRes] = await Promise.all([
        fetch('/api/admin/classes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/artists', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!classRes.ok) throw new Error();
      setClasses(await classRes.json());
      if (artistRes.ok) setArtists(await artistRes.json());
      if (bookingRes.ok) setBookings(await bookingRes.json());
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
      host_artist_id: c.host_artist_id != null ? String(c.host_artist_id) : '',
      total_slots: String(c.total_slots),
      duration_min: String(c.duration_min),
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
      host_artist_id: form.host_artist_id ? parseInt(form.host_artist_id) : null,
      total_slots: parseInt(form.total_slots) || 0,
      duration_min: parseInt(form.duration_min) || 60,
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
                <th>Host</th>
                <th>Bookings</th>
                <th>Certificate</th>
                <th>Mentoring</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const classDate = c.date.substring(0, 10);
                const booked = bookings.filter(
                  (b) => b.service === c.name && b.date.startsWith(classDate),
                ).length;
                return (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-base-content/60 max-w-xs truncate">{c.description}</div>
                  </td>
                  <td className="whitespace-nowrap">{new Date(c.date).toLocaleString()}</td>
                  <td>${c.price}</td>
                  <td>{c.host_artist_id ? (artistById.get(c.host_artist_id) ?? '—') : '—'}</td>
                  <td>
                    {c.total_slots > 0
                      ? <span className={booked >= c.total_slots ? 'text-error font-medium' : ''}>{booked} / {c.total_slots}</span>
                      : <span>{booked}</span>}
                  </td>
                  <td>{c.certificate ? '✓' : '—'}</td>
                  <td>{c.mentoring ? '✓' : '—'}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-error btn-xs" onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
                );
              })}
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
              <label className="form-control w-full">
                <div className="label"><span className="label-text">Host Artist</span></div>
                <select
                  className="select select-bordered w-full"
                  value={form.host_artist_id}
                  onChange={(e) => setForm({ ...form, host_artist_id: e.target.value })}
                >
                  <option value="">— No host —</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="input input-bordered flex items-center gap-2 flex-1">
                  <span className="label whitespace-nowrap">Total Slots</span>
                  <input
                    type="number" min="0" className="grow"
                    value={form.total_slots}
                    onChange={(e) => setForm({ ...form, total_slots: e.target.value })}
                    placeholder="0 = unlimited"
                  />
                </label>
                <label className="input input-bordered flex items-center gap-2 flex-1">
                  <span className="label whitespace-nowrap">Duration (min)</span>
                  <input
                    type="number" min="1" className="grow"
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                  />
                </label>
              </div>
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
  user_id: number | null;
}

interface AdminIndustry { id: number; slug: string; name: string; }

type ArtistForm = { name: string; email: string; password: string; bio: string; specialties: string; photo_url: string };
const emptyArtistForm = (): ArtistForm => ({ name: '', email: '', password: '', bio: '', specialties: '', photo_url: '' });

type ArtistEditForm = { name: string; bio: string; specialties: string; photo_url: string; whatsapp_number: string; industry_ids: number[] };
const emptyArtistEditForm = (a: ArtistRecord): ArtistEditForm => ({
  name: a.name,
  bio: a.bio ?? '',
  specialties: a.specialties ?? '',
  photo_url: a.photo_url ?? '',
  whatsapp_number: '',
  industry_ids: [],
});

function ArtistsTab({ token }: { token: string }) {
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [adminIndustries, setAdminIndustries] = useState<AdminIndustry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ArtistForm>(emptyArtistForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editArtist, setEditArtist] = useState<ArtistRecord | null>(null);
  const [editForm, setEditForm] = useState<ArtistEditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/artists', { headers: { Authorization: `Bearer ${token}` } });
    setArtists(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);
  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<AdminIndustry[]>)
      .then(setAdminIndustries)
      .catch(() => {});
  }, []);

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

  const openEdit = (a: ArtistRecord) => {
    setEditArtist(a);
    setEditForm(emptyArtistEditForm(a));
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArtist || !editForm) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/artists/${editArtist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name || undefined,
          bio: editForm.bio || undefined,
          specialties: editForm.specialties || undefined,
          photo_url: editForm.photo_url || undefined,
          whatsapp_number: editForm.whatsapp_number || null,
          industry_ids: editForm.industry_ids,
        }),
      });
      if (!res.ok) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      await fetchArtists();
      setEditArtist(null);
      setEditForm(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setEditSaving(false);
    }
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
            <thead><tr><th>Name</th><th>Email</th><th>Specialties</th><th>Account</th><th>Status</th><th></th></tr></thead>
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
                    {a.user_id != null
                      ? <span className="badge badge-info badge-sm">Linked</span>
                      : <span className="text-base-content/40 text-xs">Standalone</span>}
                  </td>
                  <td>
                    <button className={`badge ${a.is_active ? 'badge-success' : 'badge-error'} cursor-pointer`} onClick={() => handleToggleActive(a)}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="flex gap-1">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(a)}>Edit</button>
                    <button className="btn btn-error btn-xs" onClick={() => handleDelete(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editArtist && editForm && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => { setEditArtist(null); setEditForm(null); }}>✕</button>
            <h3 className="font-bold text-lg mb-4">Edit Artist — {editArtist.name}</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-28">Name</span>
                <input type="text" className="grow" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-28">Specialties</span>
                <input type="text" className="grow" placeholder="Bridal, Editorial" value={editForm.specialties} onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })} />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-28">Photo URL</span>
                <input type="url" className="grow" value={editForm.photo_url} onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })} />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-28">WhatsApp</span>
                <input type="tel" className="grow" placeholder="18765551234 (digits only)" value={editForm.whatsapp_number} onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value.replace(/\D/g, '') })} />
              </label>
              {adminIndustries.length > 0 && (
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Industries</span></label>
                  <div className="flex flex-wrap gap-3">
                    {adminIndustries.map((ind) => (
                      <label key={ind.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={editForm.industry_ids.includes(ind.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...editForm.industry_ids, ind.id]
                              : editForm.industry_ids.filter((id) => id !== ind.id);
                            setEditForm({ ...editForm, industry_ids: ids });
                          }}
                        />
                        <span className="text-sm">{ind.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <label className="textarea textarea-bordered flex items-start gap-2 pt-2">
                <span className="label w-28 mt-1">Bio</span>
                <textarea className="grow" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} />
              </label>
              {editError && <div className="alert alert-error py-2 text-sm">{editError}</div>}
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => { setEditArtist(null); setEditForm(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </dialog>
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

type PromoteForm = { bio: string; specialties: string; photo_url: string };
const emptyPromoteForm = (): PromoteForm => ({ bio: '', specialties: '', photo_url: '' });

function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promotingUser, setPromotingUser] = useState<UserRecord | null>(null);
  const [promoteForm, setPromoteForm] = useState<PromoteForm>(emptyPromoteForm());
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    setUsers(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDemote = async (user: UserRecord) => {
    if (!confirm(`Convert ${user.name} back to a client? Their artist profile will be deactivated.`)) return;
    setSaving(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: 'user' }),
    });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: 'user' } : u));
    setSaving(null);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingUser) return;
    setPromoting(true);
    setPromoteError(null);
    try {
      const res = await fetch(`/api/admin/users/${promotingUser.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bio: promoteForm.bio || undefined,
          specialties: promoteForm.specialties || undefined,
          photo_url: promoteForm.photo_url || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error: string };
        throw new Error(d.error);
      }
      await fetchUsers();
      setPromoteModalOpen(false);
      setPromotingUser(null);
    } catch (err) {
      setPromoteError(err instanceof Error ? err.message : 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
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
                    <span className={`badge badge-sm ${u.role === 'artist' ? 'badge-primary' : 'badge-neutral'}`}>
                      {u.role === 'artist' ? 'Artist' : 'Client'}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/60 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      {u.role === 'user' && (
                        <button
                          className="btn btn-xs btn-outline btn-primary"
                          disabled={saving === u.id}
                          onClick={() => {
                            setPromotingUser(u);
                            setPromoteForm(emptyPromoteForm());
                            setPromoteError(null);
                            setPromoteModalOpen(true);
                          }}
                        >
                          Promote to Artist
                        </button>
                      )}
                      {u.role === 'artist' && (
                        <button
                          className="btn btn-xs btn-outline btn-warning"
                          disabled={saving === u.id}
                          onClick={() => handleDemote(u)}
                        >
                          Convert to Client
                        </button>
                      )}
                      <button className="btn btn-error btn-xs" onClick={() => handleDelete(u.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {promoteModalOpen && promotingUser && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setPromoteModalOpen(false)}>✕</button>
            <h3 className="font-bold text-lg mb-1">Promote to Artist</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Creating artist profile for <strong>{promotingUser.name}</strong> ({promotingUser.email}). All fields are optional.
            </p>
            <form onSubmit={handlePromote} className="space-y-3">
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Specialties</span>
                <input
                  type="text"
                  className="grow"
                  placeholder="Bridal, Editorial"
                  value={promoteForm.specialties}
                  onChange={(e) => setPromoteForm({ ...promoteForm, specialties: e.target.value })}
                />
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <span className="label w-24">Photo URL</span>
                <input
                  type="url"
                  className="grow"
                  value={promoteForm.photo_url}
                  onChange={(e) => setPromoteForm({ ...promoteForm, photo_url: e.target.value })}
                />
              </label>
              <label className="textarea textarea-bordered flex items-start gap-2 pt-2">
                <span className="label w-24 mt-1">Bio</span>
                <textarea
                  className="grow"
                  rows={3}
                  value={promoteForm.bio}
                  onChange={(e) => setPromoteForm({ ...promoteForm, bio: e.target.value })}
                />
              </label>
              {promoteError && <div className="alert alert-error py-2 text-sm">{promoteError}</div>}
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setPromoteModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={promoting}>
                  {promoting ? 'Promoting...' : 'Promote to Artist'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
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
          {(() => {
            const nonClassServices = services.filter((sv) => {
              const sub = subcategories.find((s) => s.id === sv.subcategory_id);
              if (!sub) return true;
              const cat = categories.find((c) => c.id === sub.category_id);
              return cat?.name !== 'Lessons & Education';
            });
            return nonClassServices.length === 0 ? (
            <div className="text-center text-base-content/50 py-12">No services yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-zebra w-full">
                <thead><tr><th>Category › Sub</th><th>Name</th><th>Price</th><th>Duration</th><th>Sort</th><th></th></tr></thead>
                <tbody>
                  {nonClassServices.map((sv) => (
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
          );
          })()}
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

// ── Reviews tab ───────────────────────────────────────────────────────────────

interface ReviewRecord {
  id: number;
  name: string;
  service: string;
  rating: number;
  body: string;
  approved: number;
  created_at: string;
  booking_date: string | null;
  booking_email: string | null;
}

function ReviewsTab({ token }: { token: string }) {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { results: ReviewRecord[] };
      setReviews(data.results);
    } catch {
      setError('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleToggleApprove = async (id: number, currentApproved: number) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ approved: currentApproved ? 0 : 1 }),
    });
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, approved: currentApproved ? 0 : 1 } : r));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>;
  if (error) return <div className="alert alert-error mt-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Reviews</h2>
        <span className="badge badge-neutral">{reviews.length} total</span>
      </div>
      {reviews.length === 0 ? (
        <div className="text-center text-base-content/60 py-12">No reviews yet. They will appear here once clients submit surveys.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="font-medium">{r.name}</div>
                    {r.booking_email && <div className="text-xs text-base-content/50">{r.booking_email}</div>}
                  </td>
                  <td className="text-sm">{r.service}</td>
                  <td className="whitespace-nowrap">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </td>
                  <td className="max-w-xs">
                    <div className="truncate text-sm">{r.body || '—'}</div>
                  </td>
                  <td>
                    <button
                      className={`badge cursor-pointer select-none ${r.approved ? 'badge-success' : 'badge-warning'}`}
                      onClick={() => handleToggleApprove(r.id, r.approved)}
                    >
                      {r.approved ? 'Approved' : 'Pending'}
                    </button>
                  </td>
                  <td className="text-sm text-base-content/60 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-error btn-xs" onClick={() => handleDelete(r.id)}>
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

// ── Surveys tab ───────────────────────────────────────────────────────────────

interface SurveyRecord {
  id: number;
  token: string;
  sent_at: string;
  submitted_at: string | null;
  rating: number | null;
  body: string | null;
  review_requested: number;
  review_request_sent_at: string | null;
  booking_id: number;
  name: string;
  email: string;
  service: string;
  date: string;
}

function SurveysTab({ token }: { token: string }) {
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/surveys', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSurveys(await res.json() as SurveyRecord[]);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const handleAction = async (id: number, endpoint: string, label: string) => {
    setActionLoading(id);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/surveys/${id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setActionMsg(d.error ?? 'Failed');
      } else {
        setActionMsg(`${label} sent successfully`);
        await fetchSurveys();
      }
    } catch {
      setActionMsg('Request failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Surveys</h2>
        <span className="badge badge-neutral">{surveys.length} total</span>
      </div>
      {actionMsg && (
        <div className="alert alert-info mb-4 py-2 text-sm">
          {actionMsg}
          <button className="btn btn-ghost btn-xs ml-2" onClick={() => setActionMsg(null)}>✕</button>
        </div>
      )}
      {surveys.length === 0 ? (
        <div className="text-center text-base-content/60 py-12">No surveys sent yet. Surveys are sent automatically 1 hour after a booking is marked as completed.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service</th>
                <th>Sent</th>
                <th>Response</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Review Req.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-base-content/50">{s.email}</div>
                  </td>
                  <td className="text-sm">{s.service}</td>
                  <td className="text-sm whitespace-nowrap">
                    {new Date(s.sent_at).toLocaleDateString()}
                  </td>
                  <td>
                    {s.submitted_at
                      ? <span className="badge badge-success badge-sm">Submitted</span>
                      : <span className="badge badge-ghost badge-sm">Pending</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    {s.rating ? `${s.rating}/5` : '—'}
                  </td>
                  <td className="max-w-xs">
                    <div className="truncate text-sm">{s.body ?? '—'}</div>
                  </td>
                  <td>
                    {s.review_requested
                      ? <span className="badge badge-info badge-sm" title={s.review_request_sent_at ?? ''}>Sent</span>
                      : <span className="text-base-content/40 text-sm">—</span>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleAction(s.id, 'resend', 'Survey')}
                        disabled={actionLoading === s.id}
                        title="Resend survey email"
                      >
                        Resend
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleAction(s.id, 'request-review', 'Review request')}
                        disabled={actionLoading === s.id || !!s.review_requested}
                        title={s.review_requested ? 'Already sent' : 'Send Google review request'}
                      >
                        Req. Review
                      </button>
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

// ── Admin shell ───────────────────────────────────────────────────────────────

const Admin: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('adminToken'));
  const [activeTab, setActiveTab] = useState<'bookings' | 'classes' | 'artists' | 'users' | 'services' | 'reviews' | 'surveys'>('bookings');

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
        {(['bookings', 'classes', 'artists', 'users', 'services', 'reviews', 'surveys'] as const).map((t) => (
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
      {activeTab === 'reviews' && <ReviewsTab token={token} />}
      {activeTab === 'surveys' && <SurveysTab token={token} />}
    </div>
  );
};

export default Admin;
