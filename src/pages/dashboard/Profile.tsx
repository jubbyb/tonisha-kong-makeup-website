import React, { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { apiFetch } from '../../lib/api';
import { cfImage } from '../../lib/cfImage';
import { MapView } from '../../components/MapView';
import type { ArtistProfile, IndustryOption } from './types';

const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const PHOTO_COMPRESSION_OPTS = { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true };

interface Parish {
  id: number;
  slug: string;
  name: string;
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

export default function Profile() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<IndustryOption[]>)
      .then(setIndustries)
      .catch(() => {});
    fetch('/api/parishes')
      .then((r) => r.json() as Promise<Parish[]>)
      .then(setParishes)
      .catch(() => {});
    apiFetch<ArtistProfile>('/api/artist/profile')
      .then((d) => {
        setProfile({ ...d, industry_ids: d.industry_ids ?? [] });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUseMyLocation = () => {
    if (!profile) return;
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfile((prev) =>
          prev ? { ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude } : prev,
        );
      },
      (err) => {
        setError(err.message || 'Could not get your location');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handlePhotoFile = async (file: File) => {
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const compressed = await imageCompression(file, PHOTO_COMPRESSION_OPTS);
      const form = new FormData();
      form.append('file', compressed, compressed.name || file.name);
      const res = await apiFetch<{ photo_url: string; photo_storage_key: string }>(
        '/api/artist/profile/upload',
        { method: 'POST', body: form },
      );
      setProfile((prev) =>
        prev
          ? { ...prev, photo_url: res.photo_url, photo_storage_key: res.photo_storage_key }
          : prev,
      );
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handlePhotoFile(file);
  };

  const handleRemovePhoto = async () => {
    if (!profile?.photo_url) return;
    if (!confirm('Remove your profile photo?')) return;
    setPhotoError(null);
    setRemovingPhoto(true);
    try {
      await apiFetch('/api/artist/profile', {
        method: 'PUT',
        body: JSON.stringify({ photo_url: null }),
      });
      setProfile((prev) => (prev ? { ...prev, photo_url: null, photo_storage_key: null } : prev));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/artist/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          specialties: profile.specialties,
          slug: profile.slug,
          about: profile.about,
          location: profile.location,
          experience: profile.experience,
          instagram_url: profile.instagram_url,
          tiktok_url: profile.tiktok_url,
          facebook_url: profile.facebook_url,
          website_url: profile.website_url,
          whatsapp_number: profile.whatsapp_number,
          industry_ids: profile.industry_ids,
          parish_id: profile.parish_id,
          lat: profile.lat,
          lng: profile.lng,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile)
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  const profileUrl = profile.slug ? `${window.location.origin}/artists/${profile.slug}` : null;

  return (
    <div className="max-w-2xl">
      {/* ── header ── */}
      <p className="eyebrow mb-1" style={{ color: 'var(--ink-3)' }}>
        Public Profile
      </p>
      <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--ink)' }}>
        My Profile
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--ink-3)' }}>
        These details appear on your public profile page.
      </p>

      {profileUrl && (
        <div className="alert alert-info mb-5 py-2 text-sm">
          <span>
            Your profile is live at{' '}
            <a href={profileUrl} target="_blank" rel="noreferrer" className="link font-mono">
              {profileUrl}
            </a>
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Name</span>
          <input
            type="text"
            className="grow"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">URL slug</span>
          <span className="text-sm" style={{ color: 'var(--ink-3)' }}>
            /artists/
          </span>
          <input
            type="text"
            className="grow"
            placeholder="your-name"
            pattern="[a-z0-9](-?[a-z0-9])*"
            minLength={3}
            maxLength={50}
            value={profile.slug ?? ''}
            onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase() })}
          />
        </label>
        <div
          className="border p-4"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--line)' }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--ink-2)' }}>
            Profile photo
          </p>
          <div className="flex items-start gap-4">
            <div
              className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-full bg-base-200 flex items-center justify-center"
              style={{ border: '1px solid var(--line)' }}
            >
              {profile.photo_url ? (
                <img
                  src={cfImage(profile.photo_url, 200)}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                  No photo
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept={PHOTO_ACCEPT}
                  onChange={onPickPhoto}
                  disabled={uploadingPhoto || removingPhoto}
                  className="file-input file-input-bordered file-input-sm flex-1"
                />
                {uploadingPhoto && (
                  <span className="loading loading-spinner loading-sm" aria-label="Uploading" />
                )}
                {profile.photo_url && !uploadingPhoto && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost text-error"
                    onClick={handleRemovePhoto}
                    disabled={removingPhoto}
                  >
                    {removingPhoto ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--ink-3)' }}>
                JPEG, PNG, or WebP. Compressed automatically. Saves immediately.
              </p>
              {photoError && (
                <div className="alert alert-error py-2 text-sm mt-2">{photoError}</div>
              )}
            </div>
          </div>
        </div>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Specialties</span>
          <input
            type="text"
            className="grow"
            placeholder="Bridal, Editorial, Events"
            value={profile.specialties ?? ''}
            onChange={(e) => setProfile({ ...profile, specialties: e.target.value || null })}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Location</span>
          <input
            type="text"
            className="grow"
            placeholder="Atlanta, GA — travels nationwide"
            value={profile.location ?? ''}
            onChange={(e) => setProfile({ ...profile, location: e.target.value || null })}
          />
        </label>

        <div className="divider text-sm" style={{ color: 'var(--ink-3)' }}>
          Address &amp; Map
        </div>

        <label className="form-control">
          <span className="label-text">Parish</span>
          <select
            className="select select-bordered"
            value={profile.parish_id ?? ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                parish_id: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">— Select parish —</option>
            {parishes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Map location</span>
            <span className="label-text-alt text-xs">
              {profile.lat && profile.lng
                ? `${profile.lat.toFixed(4)}, ${profile.lng.toFixed(4)}`
                : 'Not set'}
            </span>
          </label>
          <p className="text-xs mb-2" style={{ color: 'var(--ink-3)' }}>
            Click on the map to pin your exact location. This helps customers find you.
          </p>
          {!showMapPicker ? (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowMapPicker(true)}
            >
              Open map picker
            </button>
          ) : (
            <div
              style={{
                height: '300px',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '1rem',
              }}
            >
              <MapView
                artists={
                  profile.lat && profile.lng
                    ? [
                        {
                          id: 0,
                          name: profile.name,
                          slug: profile.slug,
                          lat: profile.lat,
                          lng: profile.lng,
                        },
                      ]
                    : []
                }
                editable={true}
                onLocationChange={(lat, lng) => {
                  setProfile({ ...profile, lat, lng });
                }}
              />
            </div>
          )}
          {showMapPicker && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleUseMyLocation}
              >
                Use my location
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setShowMapPicker(false)}>
                Done
              </button>
            </div>
          )}
        </div>

        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Experience</span>
          <input
            type="text"
            className="grow"
            placeholder="10+ years · MUD certified"
            value={profile.experience ?? ''}
            onChange={(e) => setProfile({ ...profile, experience: e.target.value || null })}
          />
        </label>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Short bio</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="A one-paragraph intro shown at the top of your profile."
            value={profile.bio ?? ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value || null })}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">About (long-form)</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-40"
            placeholder="Tell clients more about your background, style, and what to expect."
            value={profile.about ?? ''}
            onChange={(e) => setProfile({ ...profile, about: e.target.value || null })}
          />
        </div>

        <div className="divider text-sm" style={{ color: 'var(--ink-3)' }}>
          Booking &amp; Industries
        </div>
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">WhatsApp</span>
          <input
            type="tel"
            className="grow"
            placeholder="18765551234 (digits only)"
            value={profile.whatsapp_number ?? ''}
            onChange={(e) =>
              setProfile({
                ...profile,
                whatsapp_number: e.target.value.replace(/\D/g, '') || null,
              })
            }
          />
        </label>
        {industries.length > 0 && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Industries</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {industries.map((ind) => (
                <label key={ind.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={profile.industry_ids.includes(ind.id)}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? [...profile.industry_ids, ind.id]
                        : profile.industry_ids.filter((id) => id !== ind.id);
                      setProfile({ ...profile, industry_ids: ids });
                    }}
                  />
                  <span className="text-sm">{ind.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="divider text-sm" style={{ color: 'var(--ink-3)' }}>
          Social links
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">Instagram</span>
            <input
              type="url"
              className="grow"
              placeholder="https://instagram.com/..."
              value={profile.instagram_url ?? ''}
              onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value || null })}
            />
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">TikTok</span>
            <input
              type="url"
              className="grow"
              placeholder="https://tiktok.com/@..."
              value={profile.tiktok_url ?? ''}
              onChange={(e) => setProfile({ ...profile, tiktok_url: e.target.value || null })}
            />
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">Facebook</span>
            <input
              type="url"
              className="grow"
              placeholder="https://facebook.com/..."
              value={profile.facebook_url ?? ''}
              onChange={(e) => setProfile({ ...profile, facebook_url: e.target.value || null })}
            />
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <span className="label w-24">Website</span>
            <input
              type="url"
              className="grow"
              placeholder="https://..."
              value={profile.website_url ?? ''}
              onChange={(e) => setProfile({ ...profile, website_url: e.target.value || null })}
            />
          </label>
        </div>

        {error && <div className="alert alert-error py-2 text-sm">{error}</div>}
        {saved && <div className="alert alert-success py-2 text-sm">Saved!</div>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
