import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { ArtistProfile, IndustryOption } from './types';

// ─── Profile tab ──────────────────────────────────────────────────────────────

export default function Profile() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/industries')
      .then((r) => r.json() as Promise<IndustryOption[]>)
      .then(setIndustries)
      .catch(() => {});
    apiFetch<ArtistProfile>('/api/artist/profile')
      .then((d) => {
        setProfile({ ...d, industry_ids: d.industry_ids ?? [] });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          photo_url: profile.photo_url,
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
        <label className="input input-bordered flex items-center gap-2">
          <span className="label w-32">Photo URL</span>
          <input
            type="url"
            className="grow"
            value={profile.photo_url ?? ''}
            onChange={(e) => setProfile({ ...profile, photo_url: e.target.value || null })}
          />
        </label>
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

        <div
          className="divider text-sm"
          style={{ color: 'var(--ink-3)' }}
        >
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
