import { signJWT, verifyJWT, hashPassword, verifyPassword, type JWTPayload } from './auth';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_SECRET: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  SITE_URL: string;
  FROM_EMAIL: string;
  GOOGLE_REVIEW_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  PORTFOLIO_BUCKET: R2Bucket;
  PORTFOLIO_PUBLIC_BASE: string;
}

const PORTFOLIO_MAX_IMAGES = 20;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.FROM_EMAIL, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildSurveyEmail(clientName: string, service: string, surveyUrl: string): string {
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">Thank you, ${clientName}</h1>
  <p style="color:#a09890;line-height:1.7;margin-bottom:8px;">Your <em>${service}</em> session is complete. We hope you loved your look!</p>
  <p style="color:#a09890;line-height:1.7;">We would appreciate 2 minutes of your time to share your experience.</p>
  <div style="margin:32px 0;">
    <a href="${surveyUrl}" style="display:inline-block;padding:14px 40px;border:1px solid #c9a96e;color:#c9a96e;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
      Share Your Feedback
    </a>
  </div>
  <p style="font-size:11px;color:#4a4540;">This link is unique to your booking and expires after submission.</p>
</div>`;
}

function buildReviewRequestEmail(clientName: string, googleUrl: string): string {
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">We're glad you loved it, ${clientName}!</h1>
  <p style="color:#a09890;line-height:1.7;">Your kind words mean the world. Would you mind sharing your experience on Google? It helps other clients discover us.</p>
  <div style="margin:32px 0;">
    <a href="${googleUrl}" style="display:inline-block;padding:14px 40px;border:1px solid #c9a96e;color:#c9a96e;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
      Leave a Google Review
    </a>
  </div>
</div>`;
}

function buildPasswordResetEmail(resetUrl: string): string {
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">Reset Your Password</h1>
  <p style="color:#a09890;line-height:1.7;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
  <div style="margin:32px 0;">
    <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;border:1px solid #c9a96e;color:#c9a96e;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
      Reset Password
    </a>
  </div>
  <p style="font-size:11px;color:#4a4540;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
</div>`;
}

function buildBookingReceivedEmail(name: string, service: string, date: string, startTime: string, artistName?: string): string {
  const withArtist = artistName ? ` with ${artistName}` : '';
  const atTime = startTime ? ` at ${startTime}` : '';
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">Thank you, ${name}</h1>
  <p style="color:#a09890;line-height:1.7;">Your booking request for <em>${service}</em>${withArtist} on <strong style="color:#ede8e0;">${date}</strong>${atTime} has been received.</p>
  <p style="color:#a09890;line-height:1.7;margin-top:12px;">We'll be in touch shortly to confirm your appointment.</p>
  <p style="font-size:11px;color:#4a4540;margin-top:32px;">If you have any questions, simply reply to this email.</p>
</div>`;
}

function buildBookingConfirmedEmail(name: string, service: string, date: string, startTime: string, artistName?: string): string {
  const withArtist = artistName ? ` with ${artistName}` : '';
  const atTime = startTime ? ` at ${startTime}` : '';
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">You're confirmed, ${name}!</h1>
  <p style="color:#a09890;line-height:1.7;">Your booking for <em>${service}</em>${withArtist} on <strong style="color:#ede8e0;">${date}</strong>${atTime} is confirmed.</p>
  <p style="color:#a09890;line-height:1.7;margin-top:12px;">We look forward to seeing you!</p>
  <p style="font-size:11px;color:#4a4540;margin-top:32px;">If you need to make any changes, please contact us as soon as possible.</p>
</div>`;
}

function buildBookingCancelledEmail(name: string, service: string, date: string, startTime: string): string {
  const atTime = startTime ? ` at ${startTime}` : '';
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">Booking Cancelled</h1>
  <p style="color:#a09890;line-height:1.7;">Hi ${name}, your booking for <em>${service}</em> on <strong style="color:#ede8e0;">${date}</strong>${atTime} has been cancelled.</p>
  <p style="color:#a09890;line-height:1.7;margin-top:12px;">If you'd like to rebook or have any questions, please don't hesitate to get in touch.</p>
  <p style="font-size:11px;color:#4a4540;margin-top:32px;">We hope to see you soon.</p>
</div>`;
}

function buildArtistNewBookingEmail(clientName: string, clientEmail: string, service: string, date: string, startTime: string): string {
  const atTime = startTime ? ` at ${startTime}` : '';
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">New Booking Request</h1>
  <p style="color:#a09890;line-height:1.7;"><strong style="color:#ede8e0;">${clientName}</strong> has requested a booking for <em>${service}</em> on <strong style="color:#ede8e0;">${date}</strong>${atTime}.</p>
  <p style="color:#a09890;line-height:1.7;margin-top:12px;">Client email: <a href="mailto:${clientEmail}" style="color:#c9a96e;">${clientEmail}</a></p>
  <p style="color:#a09890;line-height:1.7;margin-top:12px;">Log in to your dashboard to confirm or manage this booking.</p>
</div>`;
}

function buildArtistClientCancelledEmail(clientName: string, service: string, date: string, startTime: string): string {
  const atTime = startTime ? ` at ${startTime}` : '';
  return `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0a08;color:#ede8e0;padding:40px 32px;">
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Styleja</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">Booking Cancelled by Client</h1>
  <p style="color:#a09890;line-height:1.7;"><strong style="color:#ede8e0;">${clientName}</strong> has cancelled their booking for <em>${service}</em> on <strong style="color:#ede8e0;">${date}</strong>${atTime}.</p>
  <p style="color:#a09890;line-height:1.7;margin-top:12px;">This time slot is now available again.</p>
</div>`;
}

async function getAuth(request: Request, env: Env): Promise<JWTPayload | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyJWT(auth.slice(7), env.JWT_SECRET);
}

function isAdmin(request: Request, env: Env): boolean {
  return request.headers.get('Authorization') === `Bearer ${env.ADMIN_SECRET}`;
}

// ─── Slug helpers ────────────────────────────────────────────────────────────

const RESERVED_SLUGS = new Set([
  'new',
  'admin',
  'api',
  'me',
  'dashboard',
  'login',
  'logout',
  'signup',
  'auth',
  'profile',
  'about',
  'home',
  'contact',
  'services',
  'classes',
  'bookings',
  'survey',
  'artist-dashboard',
  'my-bookings',
  'industries',
  'makeup',
  'hair',
  'nails',
  'barber',
  'stylist',
  'tailoring',
]);

const SLUG_RE = /^[a-z0-9](-?[a-z0-9])*$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function uniqueSlug(db: D1Database, base: string, excludeArtistId?: number): Promise<string> {
  const root = base || 'artist';
  let candidate = root;
  let n = 2;
  while (true) {
    const row = excludeArtistId
      ? await db
          .prepare('SELECT id FROM artists WHERE slug = ? AND id != ?')
          .bind(candidate, excludeArtistId)
          .first()
      : await db.prepare('SELECT id FROM artists WHERE slug = ?').bind(candidate).first();
    if (!row) return candidate;
    candidate = `${root}-${n++}`;
    if (n > 1000) return `${root}-${Date.now()}`;
  }
}

// ─── Availability computation helpers ────────────────────────────────────────

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function generateSlots(
  startTime: string,
  endTime: string,
  durationMin: number,
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  let cur = timeToMin(startTime);
  const end = timeToMin(endTime);
  while (cur + durationMin <= end) {
    slots.push({ start: minToTime(cur), end: minToTime(cur + durationMin) });
    cur += durationMin;
  }
  return slots;
}

function isBlocked(
  slotStart: string,
  slotEnd: string,
  blocks: Array<{ start_time: string | null; end_time: string | null }>,
): boolean {
  const s = timeToMin(slotStart);
  const e = timeToMin(slotEnd);
  for (const b of blocks) {
    if (!b.start_time || !b.end_time) return true; // full-day block
    if (s < timeToMin(b.end_time) && e > timeToMin(b.start_time)) return true; // overlap
  }
  return false;
}

function datesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // ── Public: classes ───────────────────────────────────────────────────────

    if (pathname === '/api/classes' && method === 'GET') {
      const { results } = await env.DB.prepare(
        `
        SELECT c.*,
          a.name AS host_name,
          CASE WHEN c.total_slots > 0
            THEN c.total_slots - COALESCE((
              SELECT COUNT(*) FROM bookings b
              WHERE b.service = c.name
                AND b.date = substr(c.date, 1, 10)
                AND b.status != 'cancelled'
            ), 0)
          ELSE NULL END AS slots_remaining
        FROM classes c
        LEFT JOIN artists a ON a.id = c.host_artist_id
        ORDER BY c.date
      `,
      ).all();
      return json(results);
    }

    // ── Public: industries ────────────────────────────────────────────────────

    if (pathname === '/api/parishes' && method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, slug, name, region, sort_order FROM parishes ORDER BY sort_order',
      ).all();
      return json(results);
    }

    if (pathname === '/api/industries' && method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, slug, name, tagline, icon, sort_order FROM industries WHERE is_active = 1 ORDER BY sort_order',
      ).all();
      return json(results);
    }

    const industryBySlug = pathname.match(/^\/api\/industries\/([^/]+)$/);
    if (industryBySlug && method === 'GET') {
      const slug = industryBySlug[1];
      const industry = await env.DB.prepare(
        'SELECT id, slug, name, tagline, icon, sort_order FROM industries WHERE slug = ? AND is_active = 1',
      ).bind(slug).first<{ id: number; slug: string; name: string; tagline: string | null; icon: string | null; sort_order: number }>();
      if (!industry) return json({ error: 'Industry not found' }, 404);
      const { results: countRows } = await env.DB.prepare(
        `SELECT
           (SELECT COUNT(*) FROM artist_industries WHERE industry_id = ?) AS artist_count,
           (SELECT COUNT(*) FROM category_industries WHERE industry_id = ?) AS category_count`,
      ).bind(industry.id, industry.id).all<{ artist_count: number; category_count: number }>();
      return json({ ...industry, ...countRows[0] });
    }

    // ── Public: artists directory ─────────────────────────────────────────────

    if (pathname === '/api/artists' && method === 'GET') {
      const industryFilter = url.searchParams.get('industry');
      const parishFilter = url.searchParams.get('parish');
      const bboxParam = url.searchParams.get('bbox');
      const nearParam = url.searchParams.get('near');
      const radiusKm = parseFloat(url.searchParams.get('radiusKm') ?? '50');
      const artistCols = `a.id, a.slug, a.name, a.bio, a.specialties, a.photo_url, a.location, a.whatsapp_number,
                          a.lat, a.lng, a.cover_url, a.service_radius_km, a.parish_id`;
      let artistRows: Record<string, unknown>[];
      if (industryFilter) {
        const { results } = await env.DB.prepare(
          `SELECT ${artistCols}
           FROM artists a
           JOIN artist_industries ai ON ai.artist_id = a.id
           JOIN industries i ON i.id = ai.industry_id
           WHERE a.is_active = 1 AND i.slug = ?
           ORDER BY a.name`,
        ).bind(industryFilter).all();
        artistRows = results as Record<string, unknown>[];
      } else if (parishFilter) {
        const { results } = await env.DB.prepare(
          `SELECT ${artistCols}
           FROM artists a
           JOIN parishes p ON a.parish_id = p.id
           WHERE a.is_active = 1 AND p.slug = ?
           ORDER BY a.name`,
        ).bind(parishFilter).all();
        artistRows = results as Record<string, unknown>[];
      } else if (bboxParam) {
        const [minLng, minLat, maxLng, maxLat] = bboxParam.split(',').map(Number);
        const { results } = await env.DB.prepare(
          `SELECT ${artistCols}
           FROM artists a
           WHERE a.is_active = 1 AND a.lat IS NOT NULL AND a.lng IS NOT NULL
             AND a.lat BETWEEN ? AND ? AND a.lng BETWEEN ? AND ?
           ORDER BY a.name`,
        ).bind(minLat, maxLat, minLng, maxLng).all();
        artistRows = results as Record<string, unknown>[];
      } else if (nearParam) {
        const [nearLat, nearLng] = nearParam.split(',').map(Number);
        const { results } = await env.DB.prepare(
          `SELECT ${artistCols}
           FROM artists a
           WHERE a.is_active = 1 AND a.lat IS NOT NULL AND a.lng IS NOT NULL
           ORDER BY a.name`,
        ).all();
        artistRows = (results as Record<string, unknown>[]).filter((a) =>
          haversine(nearLat, nearLng, a.lat as number, a.lng as number) <= radiusKm,
        );
      } else {
        const { results } = await env.DB.prepare(
          `SELECT id, slug, name, bio, specialties, photo_url, location, whatsapp_number,
                  lat, lng, cover_url, service_radius_km, parish_id
           FROM artists WHERE is_active = 1 ORDER BY name`,
        ).all();
        artistRows = results as Record<string, unknown>[];
      }
      if (artistRows.length === 0) return json([]);
      const artistIds = artistRows.map((a) => a.id as number);
      const placeholders = artistIds.map(() => '?').join(',');
      const { results: indRows } = await env.DB.prepare(
        `SELECT ai.artist_id, i.slug, i.name FROM artist_industries ai
         JOIN industries i ON i.id = ai.industry_id
         WHERE ai.artist_id IN (${placeholders})`,
      ).bind(...artistIds).all<{ artist_id: number; slug: string; name: string }>();
      const indByArtist = new Map<number, { slug: string; name: string }[]>();
      for (const row of indRows) {
        const list = indByArtist.get(row.artist_id) ?? [];
        list.push({ slug: row.slug, name: row.name });
        indByArtist.set(row.artist_id, list);
      }
      const enriched = artistRows.map((a) => ({
        ...a,
        industries: indByArtist.get(a.id as number) ?? [],
      }));
      return json(enriched);
    }

    const artistByIdOrSlug = pathname.match(/^\/api\/artists\/([^/]+)$/);
    if (artistByIdOrSlug && method === 'GET') {
      const key = artistByIdOrSlug[1];
      const isNumeric = /^\d+$/.test(key);
      const artist = isNumeric
        ? await env.DB.prepare(
            `SELECT id, slug, name, bio, specialties, photo_url, about, location, experience,
                    instagram_url, tiktok_url, facebook_url, website_url, whatsapp_number,
                    lat, lng, cover_url, service_radius_km, parish_id
             FROM artists WHERE id = ? AND is_active = 1`,
          )
            .bind(Number(key))
            .first<Record<string, unknown>>()
        : await env.DB.prepare(
            `SELECT id, slug, name, bio, specialties, photo_url, about, location, experience,
                    instagram_url, tiktok_url, facebook_url, website_url, whatsapp_number,
                    lat, lng, cover_url, service_radius_km, parish_id
             FROM artists WHERE slug = ? AND is_active = 1`,
          )
            .bind(key)
            .first<Record<string, unknown>>();
      if (!artist) return json({ error: 'Artist not found' }, 404);
      const { results: indRows } = await env.DB.prepare(
        `SELECT i.slug, i.name FROM artist_industries ai
         JOIN industries i ON i.id = ai.industry_id WHERE ai.artist_id = ?`,
      ).bind(artist.id).all<{ slug: string; name: string }>();
      return json({ ...artist, industries: indRows });
    }

    const artistPortfolio = pathname.match(/^\/api\/artists\/(\d+)\/portfolio$/);
    if (artistPortfolio && method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, image_url, caption, display_order FROM artist_portfolio WHERE artist_id = ? ORDER BY display_order, id',
      )
        .bind(Number(artistPortfolio[1]))
        .all();
      return json(results);
    }

    const artistTestimonials = pathname.match(/^\/api\/artists\/(\d+)\/testimonials$/);
    if (artistTestimonials && method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, client_name, quote, date, display_order FROM artist_testimonials WHERE artist_id = ? ORDER BY display_order, id',
      )
        .bind(Number(artistTestimonials[1]))
        .all();
      return json(results);
    }

    // ── Public: service catalog (full hierarchy) ─────────────────────────────
    // GET /api/service-catalog

    if (pathname === '/api/service-catalog' && method === 'GET') {
      const industrySlug = url.searchParams.get('industry');
      let cats: { id: number; name: string; sort_order: number }[];
      if (industrySlug) {
        const { results } = await env.DB.prepare(
          `SELECT sc.id, sc.name, sc.sort_order FROM service_categories sc
           JOIN category_industries ci ON ci.category_id = sc.id
           JOIN industries i ON i.id = ci.industry_id
           WHERE i.slug = ? ORDER BY sc.sort_order, sc.name`,
        ).bind(industrySlug).all<{ id: number; name: string; sort_order: number }>();
        cats = results;
      } else {
        const { results } = await env.DB.prepare(
          'SELECT id, name, sort_order FROM service_categories ORDER BY sort_order, name',
        ).all<{ id: number; name: string; sort_order: number }>();
        cats = results;
      }

      const { results: subs } = await env.DB.prepare(
        'SELECT id, category_id, name, sort_order FROM service_subcategories ORDER BY sort_order, name',
      ).all<{ id: number; category_id: number; name: string; sort_order: number }>();

      const { results: svcs } = await env.DB.prepare(
        'SELECT id, subcategory_id, name, description, price, duration_min, sort_order FROM catalog_services ORDER BY sort_order, name',
      ).all<{
        id: number;
        subcategory_id: number;
        name: string;
        description: string | null;
        price: number | null;
        duration_min: number;
        sort_order: number;
      }>();

      const catalog = cats.map((cat) => ({
        ...cat,
        subcategories: subs
          .filter((s) => s.category_id === cat.id)
          .map((sub) => ({
            ...sub,
            services: svcs.filter((svc) => svc.subcategory_id === sub.id),
          })),
      }));
      return json(catalog);
    }

    // ── Public: services for a specific artist ────────────────────────────────
    // GET /api/artists/:id/services

    const artistServices = pathname.match(/^\/api\/artists\/(\d+)\/services$/);
    if (artistServices && method === 'GET') {
      const artistId = Number(artistServices[1]);
      const { results } = await env.DB.prepare(
        `
        SELECT cs.id, cs.name, cs.description,
               COALESCE(ar.price_override, cs.price) AS price,
               ar.price_override,
               cs.price AS catalog_price,
               cs.duration_min,
               ss.id AS subcategory_id, ss.name AS subcategory_name,
               sc.id AS category_id, sc.name AS category_name
        FROM artist_services ar
        JOIN catalog_services cs ON cs.id = ar.service_id
        JOIN service_subcategories ss ON ss.id = cs.subcategory_id
        JOIN service_categories sc ON sc.id = ss.category_id
        WHERE ar.artist_id = ?
        ORDER BY sc.sort_order, ss.sort_order, cs.sort_order, cs.name
      `,
      )
        .bind(artistId)
        .all();
      return json(results);
    }

    // ── Public: computed available slots ─────────────────────────────────────
    // GET /api/artists/:id/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
    // Returns [{ date, start, end }] for all available (unblocked, unbooked) slots

    const artistSlots = pathname.match(/^\/api\/artists\/(\d+)\/slots$/);
    if (artistSlots && method === 'GET') {
      const artistId = Number(artistSlots[1]);
      const url = new URL(request.url);
      const today = new Date().toISOString().split('T')[0];
      const from = url.searchParams.get('from') ?? today;
      const to = url.searchParams.get('to') ?? from;
      const serviceDuration = Number(url.searchParams.get('duration') ?? 0);

      // Working hours
      const { results: hoursRows } = await env.DB.prepare(
        'SELECT day_of_week, start_time, end_time, slot_duration FROM artist_hours WHERE artist_id = ?',
      )
        .bind(artistId)
        .all<{
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_duration: number;
        }>();

      if (hoursRows.length === 0) return json([]); // no schedule set yet

      const hoursByDay = new Map(hoursRows.map((h) => [h.day_of_week, h]));

      // Blocks in range
      const { results: blockRows } = await env.DB.prepare(
        'SELECT date, start_time, end_time FROM artist_blocks WHERE artist_id = ? AND date >= ? AND date <= ?',
      )
        .bind(artistId, from, to)
        .all<{ date: string; start_time: string | null; end_time: string | null }>();

      const blocksByDate = new Map<string, typeof blockRows>();
      for (const b of blockRows) {
        if (!blocksByDate.has(b.date)) blocksByDate.set(b.date, []);
        blocksByDate.get(b.date)!.push(b);
      }

      // Booked times in range
      const { results: bookedRows } = await env.DB.prepare(
        `SELECT date, start_time, end_time FROM bookings
         WHERE artist_id = ? AND date >= ? AND date <= ?
         AND start_time IS NOT NULL AND status NOT IN ('cancelled')`,
      )
        .bind(artistId, from, to)
        .all<{ date: string; start_time: string; end_time: string | null }>();

      const bookedByDate = new Map<
        string,
        Array<{ start_time: string; end_time: string | null }>
      >();
      for (const b of bookedRows) {
        if (!bookedByDate.has(b.date)) bookedByDate.set(b.date, []);
        bookedByDate.get(b.date)!.push({ start_time: b.start_time, end_time: b.end_time });
      }

      // Compute available slots
      const result: Array<{ date: string; start: string; end: string }> = [];

      for (const date of datesInRange(from, to)) {
        if (date < today) continue;

        // Monday=0 … Sunday=6
        const jsDay = new Date(date + 'T00:00:00Z').getUTCDay(); // 0=Sun
        const dayOfWeek = (jsDay + 6) % 7; // 0=Mon

        if (!hoursByDay.has(dayOfWeek)) continue;

        const { start_time, end_time, slot_duration } = hoursByDay.get(dayOfWeek)!;
        const dayBlocks = blocksByDate.get(date) ?? [];
        const dayBooked = bookedByDate.get(date) ?? [];

        // Full-day block?
        if (dayBlocks.some((b) => !b.start_time)) continue;

        // Use service duration for filtering if provided; otherwise fall back to slot_duration
        const filterDuration = serviceDuration > 0 ? serviceDuration : slot_duration;

        for (const slot of generateSlots(start_time, end_time, slot_duration)) {
          const slotStartMin = timeToMin(slot.start);
          const slotEndMin = slotStartMin + filterDuration;
          const slotEndStr = minToTime(slotEndMin);

          // Reject if service window extends past artist's working hours
          if (slotEndMin > timeToMin(end_time)) continue;

          // Reject if service window overlaps any existing booking
          const bookedConflict = dayBooked.some((b) => {
            const bStart = timeToMin(b.start_time);
            const bEnd = b.end_time ? timeToMin(b.end_time) : bStart + slot_duration;
            return bStart < slotEndMin && bEnd > slotStartMin;
          });
          if (bookedConflict) continue;

          // Reject if artist_block overlaps the service window
          if (isBlocked(slot.start, slotEndStr, dayBlocks)) continue;

          result.push({ date, ...slot });
        }
      }

      return json(result);
    }

    // ── Public: legacy anonymous booking ─────────────────────────────────────

    if (pathname === '/api/bookings' && method === 'POST') {
      const bookingAuth = await getAuth(request, env);
      const bookingUserId = (bookingAuth && !bookingAuth.artist_id) ? Number(bookingAuth.sub) : null;
      const body = await request.json<{
        name?: string;
        email?: string;
        phone?: string;
        service?: string;
        date?: string;
        message?: string;
        artist_id?: number;
        start_time?: string;
        end_time?: string;
        contact_method?: 'email' | 'whatsapp';
      }>();
      if (!body.name || !body.email || !body.service || !body.date) {
        return json({ error: 'Missing required fields' }, 400);
      }
      // Conflict check when an artist + time window is specified
      if (body.artist_id && body.start_time && body.end_time) {
        const conflict = await env.DB.prepare(
          `SELECT 1 FROM bookings
           WHERE artist_id = ?
             AND date = ?
             AND start_time < ?
             AND end_time > ?
             AND status NOT IN ('cancelled')`,
        )
          .bind(body.artist_id, body.date, body.end_time, body.start_time)
          .first();
        if (conflict)
          return json({ error: 'This slot was just taken — please choose another.' }, 409);
      }
      await env.DB.prepare(
        'INSERT INTO bookings (user_id, name, email, phone, service, date, start_time, end_time, artist_id, message, contact_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(
          bookingUserId,
          body.name,
          body.email,
          body.phone ?? null,
          body.service,
          body.date,
          body.start_time ?? null,
          body.end_time ?? null,
          body.artist_id ?? null,
          body.message ?? null,
          body.contact_method ?? 'email',
        )
        .run();
      let anonArtistName: string | undefined;
      let anonArtistEmail: string | undefined;
      if (body.artist_id) {
        const a = await env.DB.prepare('SELECT name, email FROM artists WHERE id = ?')
          .bind(body.artist_id).first<{ name: string; email: string }>();
        anonArtistName = a?.name;
        anonArtistEmail = a?.email;
      }
      await sendEmail(
        env, body.email,
        'Booking Request Received — Styleja',
        buildBookingReceivedEmail(body.name, body.service, body.date, body.start_time ?? '', anonArtistName),
      );
      if (anonArtistEmail) {
        await sendEmail(
          env, anonArtistEmail,
          'New Booking Request — Styleja',
          buildArtistNewBookingEmail(body.name, body.email, body.service, body.date, body.start_time ?? ''),
        );
      }
      return json({ success: true }, 201);
    }

    // ── Public: contact ───────────────────────────────────────────────────────

    if (pathname === '/api/contact' && method === 'POST') {
      const body = await request.json<{
        name?: string;
        email?: string;
        phone?: string;
        subject?: string;
        message?: string;
      }>();
      if (!body.name || !body.email || !body.subject || !body.message) {
        return json({ error: 'Missing required fields' }, 400);
      }
      await env.DB.prepare(
        'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(body.name, body.email, body.phone ?? null, body.subject, body.message)
        .run();
      return json({ success: true }, 201);
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    if (pathname === '/api/auth/signup' && method === 'POST') {
      const body = await request.json<{ name?: string; email?: string; password?: string }>();
      if (!body.name || !body.email || !body.password)
        return json({ error: 'Missing required fields' }, 400);
      const normalizedEmail = body.email.toLowerCase().trim();
      const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = ?')
        .bind(normalizedEmail)
        .first();
      if (existing) return json({ error: 'Email already registered' }, 409);
      const hash = await hashPassword(body.password);
      const result = await env.DB.prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      )
        .bind(body.name, normalizedEmail, hash)
        .run();
      const id = String(result.meta.last_row_id);
      const token = await signJWT(
        {
          sub: id,
          email: body.email,
          name: body.name,
          role: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        },
        env.JWT_SECRET,
      );
      return json({ token, user: { id, name: body.name, email: body.email, role: 'user' } }, 201);
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await request.json<{ email?: string; password?: string }>();
      if (!body.email || !body.password) return json({ error: 'Missing fields' }, 400);
      const normalizedEmail = body.email.toLowerCase().trim();

      // Check users table first
      const user = await env.DB.prepare('SELECT * FROM users WHERE LOWER(email) = ?')
        .bind(normalizedEmail)
        .first<{ id: number; name: string; email: string; password_hash: string; role: string }>();
      if (user && user.password_hash && !(await verifyPassword(body.password, user.password_hash))) {
        return json({ error: 'Incorrect password. Forgot your password?' }, 401);
      }
      if (user && user.password_hash && (await verifyPassword(body.password, user.password_hash))) {
        const role = user.role === 'artist' ? 'artist' : 'user';
        let loginArtistId: string | undefined;
        if (role === 'artist') {
          const linked = await env.DB.prepare(
            'SELECT id FROM artists WHERE user_id = ? AND is_active = 1',
          )
            .bind(user.id)
            .first<{ id: number }>();
          loginArtistId = linked ? String(linked.id) : undefined;
        }
        const token = await signJWT(
          {
            sub: String(user.id),
            email: user.email,
            name: user.name,
            role,
            artist_id: loginArtistId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
          },
          env.JWT_SECRET,
        );
        return json({
          token,
          user: { id: String(user.id), name: user.name, email: user.email, role },
        });
      }

      // Fallback: check artists table (artist logging in via client screen)
      const artist = await env.DB.prepare(
        'SELECT * FROM artists WHERE LOWER(email) = ? AND is_active = 1',
      )
        .bind(normalizedEmail)
        .first<{ id: number; name: string; email: string; password_hash: string }>();
      if (!artist) {
        return json({ error: 'No account found with that email. Try signing up.' }, 401);
      }
      if (!(await verifyPassword(body.password, artist.password_hash))) {
        return json({ error: 'Incorrect password.' }, 401);
      }
      const token = await signJWT(
        {
          sub: String(artist.id),
          email: artist.email,
          name: artist.name,
          role: 'artist',
          artist_id: String(artist.id),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        },
        env.JWT_SECRET,
      );
      return json({
        token,
        user: { id: String(artist.id), name: artist.name, email: artist.email, role: 'artist' },
      });
    }

    if (pathname === '/api/auth/artist-login' && method === 'POST') {
      const body = await request.json<{ email?: string; password?: string }>();
      if (!body.email || !body.password) return json({ error: 'Missing fields' }, 400);
      const normalizedEmail = body.email.toLowerCase().trim();
      const artist = await env.DB.prepare(
        'SELECT * FROM artists WHERE LOWER(email) = ? AND is_active = 1',
      )
        .bind(normalizedEmail)
        .first<{ id: number; name: string; email: string; password_hash: string }>();
      if (!artist || !(await verifyPassword(body.password, artist.password_hash))) {
        return json({ error: 'Invalid email or password' }, 401);
      }
      const token = await signJWT(
        {
          sub: String(artist.id),
          email: artist.email,
          name: artist.name,
          role: 'artist',
          artist_id: String(artist.id),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 3600,
        },
        env.JWT_SECRET,
      );
      return json({
        token,
        user: { id: String(artist.id), name: artist.name, email: artist.email, role: 'artist' },
      });
    }

    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const body = await request.json<{ email?: string }>();
      const normalizedEmail = body.email?.toLowerCase().trim() ?? '';
      const user = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = ?')
        .bind(normalizedEmail)
        .first<{ id: number }>();
      if (user) {
        const resetToken = generateToken();
        const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
        await env.DB.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND used = 0')
          .bind(user.id).run();
        await env.DB.prepare(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        ).bind(user.id, resetToken, expiresAt).run();
        const resetUrl = `${env.SITE_URL}/reset-password?token=${resetToken}`;
        await sendEmail(env, normalizedEmail, 'Reset Your Password — Styleja', buildPasswordResetEmail(resetUrl));
      }
      return json({ success: true });
    }

    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const body = await request.json<{ token?: string; password?: string }>();
      if (!body.token || !body.password) return json({ error: 'Missing required fields' }, 400);
      if (body.password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
      const row = await env.DB.prepare(
        `SELECT id, user_id FROM password_reset_tokens
         WHERE token = ? AND used = 0 AND expires_at > datetime('now')`,
      ).bind(body.token).first<{ id: number; user_id: number }>();
      if (!row) return json({ error: 'Invalid or expired reset link' }, 400);
      const newHash = await hashPassword(body.password);
      await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(newHash, row.user_id).run();
      await env.DB.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?')
        .bind(row.id).run();
      return json({ success: true });
    }

    // ── Google OAuth ──────────────────────────────────────────────────────────

    if (pathname === '/api/auth/google' && method === 'GET') {
      const returnTo = new URL(request.url).searchParams.get('returnTo') ?? '/';
      const state = btoa(JSON.stringify({ returnTo }));
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        state,
      });
      return Response.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        302,
      );
    }

    if (pathname === '/api/auth/google/callback' && method === 'GET') {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error || !code) {
        return Response.redirect(`${env.SITE_URL}/login?error=oauth_cancelled`, 302);
      }

      let returnTo = '/';
      try {
        const parsed = JSON.parse(atob(state ?? ''));
        if (typeof parsed.returnTo === 'string') returnTo = parsed.returnTo;
      } catch {
        /* ignore */
      }

      // Exchange code for access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });
      if (!tokenRes.ok) {
        return Response.redirect(`${env.SITE_URL}/login?error=oauth_token_exchange`, 302);
      }
      const tokenData = (await tokenRes.json()) as { access_token: string };

      // Fetch Google user info
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!userInfoRes.ok) {
        return Response.redirect(`${env.SITE_URL}/login?error=oauth_userinfo`, 302);
      }
      const googleUser = (await userInfoRes.json()) as {
        sub: string;
        email: string;
        name: string;
        email_verified: boolean;
      };

      if (!googleUser.email_verified) {
        return Response.redirect(`${env.SITE_URL}/login?error=email_not_verified`, 302);
      }

      const normalizedEmail = googleUser.email.toLowerCase().trim();

      // Upsert user in D1: look up by google_id, then by email
      let user = await env.DB.prepare('SELECT id, name, email, role FROM users WHERE google_id = ?')
        .bind(googleUser.sub)
        .first<{ id: number; name: string; email: string; role: string }>();

      if (!user) {
        const existing = await env.DB.prepare(
          'SELECT id, name, email, role FROM users WHERE LOWER(email) = ?',
        )
          .bind(normalizedEmail)
          .first<{ id: number; name: string; email: string; role: string }>();

        if (existing) {
          // Link existing password account to Google
          await env.DB.prepare('UPDATE users SET google_id = ? WHERE id = ?')
            .bind(googleUser.sub, existing.id)
            .run();
          user = existing;
        } else {
          // New user via Google
          const result = await env.DB.prepare(
            'INSERT INTO users (name, email, password_hash, google_id, role) VALUES (?, ?, ?, ?, ?)',
          )
            .bind(googleUser.name, normalizedEmail, '', googleUser.sub, 'user')
            .run();
          user = {
            id: result.meta.last_row_id as number,
            name: googleUser.name,
            email: normalizedEmail,
            role: 'user',
          };
        }
      }

      // Resolve artist_id for users promoted to artist role
      let googleArtistId: string | undefined;
      if (user.role === 'artist') {
        const linked = await env.DB.prepare(
          'SELECT id FROM artists WHERE user_id = ? AND is_active = 1',
        )
          .bind(user.id)
          .first<{ id: number }>();
        googleArtistId = linked ? String(linked.id) : undefined;
      }

      const jwtToken = await signJWT(
        {
          sub: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role as 'user' | 'artist',
          artist_id: googleArtistId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        },
        env.JWT_SECRET,
      );

      const callbackUrl = new URL(`${env.SITE_URL}/auth/callback`);
      callbackUrl.searchParams.set('token', jwtToken);
      callbackUrl.searchParams.set('returnTo', returnTo);
      return Response.redirect(callbackUrl.toString(), 302);
    }

    // ── User bookings (JWT role=user) ─────────────────────────────────────────

    if (pathname === '/api/bookings/mine' && method === 'GET') {
      const auth = await getAuth(request, env);
      if (!auth) return json({ error: 'Authentication required' }, 401);
      let results;
      if (auth.artist_id) {
        // Artist logged in via client tab — find bookings by email
        ({ results } = await env.DB.prepare(
          `
          SELECT b.id, b.service, b.date, b.start_time, b.end_time,
                 b.status, b.message, b.created_at,
                 a.name as artist_name, a.photo_url as artist_photo
          FROM bookings b
          LEFT JOIN artists a ON a.id = b.artist_id
          WHERE b.email = ? AND (b.user_id IS NULL OR b.artist_id != ?)
          ORDER BY b.created_at DESC
        `,
        )
          .bind(auth.email, Number(auth.artist_id))
          .all());
      } else {
        ({ results } = await env.DB.prepare(
          `
          SELECT b.id, b.service, b.date, b.start_time, b.end_time,
                 b.status, b.message, b.created_at,
                 a.name as artist_name, a.photo_url as artist_photo
          FROM bookings b
          LEFT JOIN artists a ON a.id = b.artist_id
          WHERE b.user_id = ?
          ORDER BY b.created_at DESC
        `,
        )
          .bind(Number(auth.sub))
          .all());
      }
      return json(results);
    }

    const cancelMine = pathname.match(/^\/api\/bookings\/mine\/(\d+)\/cancel$/);
    if (cancelMine && method === 'POST') {
      const auth = await getAuth(request, env);
      if (!auth) return json({ error: 'Authentication required' }, 401);
      if (auth.artist_id) {
        await env.DB.prepare(
          `UPDATE bookings SET status = 'cancelled' WHERE id = ? AND email = ? AND status = 'pending'`,
        )
          .bind(Number(cancelMine[1]), auth.email)
          .run();
      } else {
        await env.DB.prepare(
          `UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'`,
        )
          .bind(Number(cancelMine[1]), Number(auth.sub))
          .run();
      }
      const cancelled = await env.DB.prepare(
        'SELECT name, email, service, date, start_time, artist_id FROM bookings WHERE id = ?',
      ).bind(Number(cancelMine[1])).first<{ name: string; email: string; service: string; date: string; start_time: string | null; artist_id: number | null }>();
      if (cancelled) {
        await sendEmail(
          env, cancelled.email,
          'Booking Cancellation — Styleja',
          buildBookingCancelledEmail(cancelled.name, cancelled.service, cancelled.date, cancelled.start_time ?? ''),
        );
        if (cancelled.artist_id) {
          const artist = await env.DB.prepare('SELECT email FROM artists WHERE id = ?')
            .bind(cancelled.artist_id).first<{ email: string }>();
          if (artist?.email) {
            await sendEmail(
              env, artist.email,
              'Booking Cancelled by Client — Styleja',
              buildArtistClientCancelledEmail(cancelled.name, cancelled.service, cancelled.date, cancelled.start_time ?? ''),
            );
          }
        }
      }
      return json({ success: true });
    }

    // ── User profile ──────────────────────────────────────────────────────────

    if (pathname === '/api/user/profile' && method === 'GET') {
      const auth = await getAuth(request, env);
      if (!auth) return json({ error: 'Authentication required' }, 401);
      const user = await env.DB.prepare('SELECT name, email, phone FROM users WHERE id = ?')
        .bind(Number(auth.sub))
        .first<{ name: string; email: string; phone: string | null }>();
      if (!user) return json({ error: 'User not found' }, 404);
      return json(user);
    }

    if (pathname === '/api/user/profile' && method === 'PUT') {
      const auth = await getAuth(request, env);
      if (!auth) return json({ error: 'Authentication required' }, 401);
      const body = await request.json<{ name?: string; phone?: string }>();
      const name = body.name?.trim();
      const phone = body.phone?.trim() ?? null;
      if (!name) return json({ error: 'Name is required' }, 400);
      await env.DB.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?')
        .bind(name, phone || null, Number(auth.sub))
        .run();
      const updated = await env.DB.prepare('SELECT name, email, phone FROM users WHERE id = ?')
        .bind(Number(auth.sub))
        .first<{ name: string; email: string; phone: string | null }>();
      return json(updated);
    }

    // ── Artist dashboard (JWT role=artist) ────────────────────────────────────

    if (pathname.startsWith('/api/artist/')) {
      const auth = await getAuth(request, env);
      if (!auth || auth.role !== 'artist')
        return json({ error: 'Artist authentication required' }, 401);
      const artistId = auth.artist_id ? Number(auth.artist_id) : Number(auth.sub);

      // Bookings
      if (pathname === '/api/artist/bookings' && method === 'GET') {
        const { results } = await env.DB.prepare(
          `
          SELECT b.id, b.name, b.email, b.phone, b.service, b.date,
                 b.start_time, b.end_time, b.message, b.status, b.created_at
          FROM bookings b
          WHERE b.artist_id = ?
          ORDER BY b.date DESC, b.start_time DESC
        `,
        )
          .bind(artistId)
          .all();
        return json(results);
      }

      const bookingId = pathname.match(/^\/api\/artist\/bookings\/(\d+)$/);
      if (bookingId && method === 'PUT') {
        const body = await request.json<{ status?: string }>();
        const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!body.status || !allowed.includes(body.status))
          return json({ error: 'Invalid status' }, 400);
        const completedAt =
          body.status === 'completed'
            ? new Date().toISOString().replace('T', ' ').slice(0, 19)
            : null;
        const bookingForEmail = await env.DB.prepare(
          `SELECT b.name, b.email, b.service, b.date, b.start_time, a.name as artist_name
           FROM bookings b LEFT JOIN artists a ON b.artist_id = a.id
           WHERE b.id = ? AND b.artist_id = ?`,
        ).bind(Number(bookingId[1]), artistId).first<{ name: string; email: string; service: string; date: string; start_time: string | null; artist_name: string | null }>();
        await env.DB.prepare(
          'UPDATE bookings SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ? AND artist_id = ?',
        )
          .bind(body.status, completedAt, Number(bookingId[1]), artistId)
          .run();
        if (bookingForEmail) {
          if (body.status === 'confirmed') {
            await sendEmail(
              env, bookingForEmail.email,
              'Your Booking is Confirmed — Styleja',
              buildBookingConfirmedEmail(bookingForEmail.name, bookingForEmail.service, bookingForEmail.date, bookingForEmail.start_time ?? '', bookingForEmail.artist_name ?? undefined),
            );
          } else if (body.status === 'cancelled') {
            await sendEmail(
              env, bookingForEmail.email,
              'Booking Cancellation — Styleja',
              buildBookingCancelledEmail(bookingForEmail.name, bookingForEmail.service, bookingForEmail.date, bookingForEmail.start_time ?? ''),
            );
          }
        }
        return json({ success: true });
      }

      // Working hours
      if (pathname === '/api/artist/hours' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT day_of_week, start_time, end_time, slot_duration FROM artist_hours WHERE artist_id = ? ORDER BY day_of_week',
        )
          .bind(artistId)
          .all();
        return json(results);
      }

      const hourDay = pathname.match(/^\/api\/artist\/hours\/([0-6])$/);
      if (hourDay && method === 'PUT') {
        const body = await request.json<{
          start_time?: string;
          end_time?: string;
          slot_duration?: number;
          enabled?: boolean;
        }>();
        if (body.enabled === false) {
          await env.DB.prepare('DELETE FROM artist_hours WHERE artist_id = ? AND day_of_week = ?')
            .bind(artistId, Number(hourDay[1]))
            .run();
        } else {
          if (!body.start_time || !body.end_time) return json({ error: 'Missing times' }, 400);
          await env.DB.prepare(
            `INSERT INTO artist_hours (artist_id, day_of_week, start_time, end_time, slot_duration)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(artist_id, day_of_week)
             DO UPDATE SET start_time = excluded.start_time, end_time = excluded.end_time, slot_duration = excluded.slot_duration`,
          )
            .bind(
              artistId,
              Number(hourDay[1]),
              body.start_time,
              body.end_time,
              body.slot_duration ?? 60,
            )
            .run();
        }
        return json({ success: true });
      }

      // Blocks
      if (pathname === '/api/artist/blocks' && method === 'GET') {
        const today = new Date().toISOString().split('T')[0];
        const { results } = await env.DB.prepare(
          'SELECT id, date, start_time, end_time FROM artist_blocks WHERE artist_id = ? AND date >= ? ORDER BY date, start_time',
        )
          .bind(artistId, today)
          .all();
        return json(results);
      }

      if (pathname === '/api/artist/blocks' && method === 'POST') {
        const body = await request.json<{
          date?: string;
          date_to?: string;
          start_time?: string;
          end_time?: string;
        }>();
        if (!body.date) return json({ error: 'Date is required' }, 400);
        const dates =
          body.date_to && body.date_to >= body.date
            ? datesInRange(body.date, body.date_to)
            : [body.date];
        const stmt = env.DB.prepare(
          'INSERT INTO artist_blocks (artist_id, date, start_time, end_time) VALUES (?, ?, ?, ?)',
        );
        for (const d of dates) {
          await stmt.bind(artistId, d, body.start_time ?? null, body.end_time ?? null).run();
        }
        return json({ success: true, count: dates.length }, 201);
      }

      const blockId = pathname.match(/^\/api\/artist\/blocks\/(\d+)$/);
      if (blockId && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM artist_blocks WHERE id = ? AND artist_id = ?')
          .bind(Number(blockId[1]), artistId)
          .run();
        return json({ success: true });
      }

      // Artist's offered services
      if (pathname === '/api/artist/services' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT service_id, price_override FROM artist_services WHERE artist_id = ?',
        )
          .bind(artistId)
          .all<{ service_id: number; price_override: number | null }>();
        return json(results);
      }

      if (pathname === '/api/artist/services' && method === 'PUT') {
        const body = await request.json<{
          services?: Array<{ service_id: number; price_override?: number | null }>;
          service_ids?: number[];
        }>();
        // Accept either the new {services: [...]} shape or legacy {service_ids: [...]}
        const items: Array<{ service_id: number; price_override: number | null }> = Array.isArray(
          body.services,
        )
          ? body.services.map((s) => ({
              service_id: Number(s.service_id),
              price_override:
                s.price_override == null || isNaN(Number(s.price_override))
                  ? null
                  : Number(s.price_override),
            }))
          : Array.isArray(body.service_ids)
            ? body.service_ids.map((id) => ({ service_id: Number(id), price_override: null }))
            : [];
        if (!items.every((i) => Number.isInteger(i.service_id) && i.service_id > 0)) {
          return json({ error: 'Invalid services payload' }, 400);
        }
        await env.DB.prepare('DELETE FROM artist_services WHERE artist_id = ?')
          .bind(artistId)
          .run();
        for (const it of items) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO artist_services (artist_id, service_id, price_override) VALUES (?, ?, ?)',
          )
            .bind(artistId, it.service_id, it.price_override)
            .run();
        }
        return json({ success: true });
      }

      // Profile
      if (pathname === '/api/artist/profile' && method === 'GET') {
        const artist = await env.DB.prepare(
          `SELECT id, slug, name, email, bio, specialties, photo_url, about, location, experience,
                  instagram_url, tiktok_url, facebook_url, website_url, whatsapp_number,
                  parish_id, lat, lng
           FROM artists WHERE id = ?`,
        )
          .bind(artistId)
          .first<Record<string, unknown>>();
        if (!artist) return json({ error: 'Artist not found' }, 404);
        const { results: indRows } = await env.DB.prepare(
          'SELECT industry_id FROM artist_industries WHERE artist_id = ?',
        ).bind(artistId).all<{ industry_id: number }>();
        return json({ ...artist, industry_ids: indRows.map((r) => r.industry_id) });
      }

      if (pathname === '/api/artist/profile' && method === 'PUT') {
        const body = await request.json<{
          name?: string;
          bio?: string;
          specialties?: string;
          photo_url?: string;
          slug?: string;
          about?: string;
          location?: string;
          experience?: string;
          instagram_url?: string;
          tiktok_url?: string;
          facebook_url?: string;
          website_url?: string;
          whatsapp_number?: string | null;
          industry_ids?: number[];
          parish_id?: number | null;
          lat?: number | null;
          lng?: number | null;
          service_radius_km?: number | null;
          cover_url?: string | null;
        }>();

        // Slug validation if provided
        if (body.slug != null) {
          const slug = body.slug.trim().toLowerCase();
          if (slug === '') return json({ error: 'Slug cannot be empty' }, 400);
          if (slug.length < 3 || slug.length > 50)
            return json({ error: 'Slug must be 3–50 characters' }, 400);
          if (!SLUG_RE.test(slug))
            return json(
              { error: 'Slug may only contain lowercase letters, numbers, and dashes' },
              400,
            );
          if (RESERVED_SLUGS.has(slug)) return json({ error: 'That slug is reserved' }, 409);
          const existing = await env.DB.prepare('SELECT id FROM artists WHERE slug = ? AND id != ?')
            .bind(slug, artistId)
            .first();
          if (existing) return json({ error: 'That slug is already taken' }, 409);
          body.slug = slug;
        }

        // If caller explicitly touched photo_url (paste-URL or remove), clean
        // up any prior R2-hosted photo. Storage_key is only ever set by the
        // upload endpoint, so this won't delete anything for legacy URL photos.
        const photoTouched = 'photo_url' in body;
        if (photoTouched) {
          const prev = await env.DB.prepare('SELECT photo_storage_key FROM artists WHERE id = ?')
            .bind(artistId)
            .first<{ photo_storage_key: string | null }>();
          if (prev?.photo_storage_key) {
            try {
              await env.PORTFOLIO_BUCKET.delete(prev.photo_storage_key);
            } catch (err) {
              console.warn('R2 delete failed for', prev.photo_storage_key, err);
            }
          }
        }

        await env.DB.prepare(
          `UPDATE artists SET
             name = COALESCE(?, name),
             bio = COALESCE(?, bio),
             specialties = COALESCE(?, specialties),
             photo_url = CASE WHEN ? IS NOT NULL THEN ? ELSE photo_url END,
             photo_storage_key = CASE WHEN ? IS NOT NULL THEN NULL ELSE photo_storage_key END,
             slug = COALESCE(?, slug),
             about = COALESCE(?, about),
             location = COALESCE(?, location),
             experience = COALESCE(?, experience),
             instagram_url = COALESCE(?, instagram_url),
             tiktok_url = COALESCE(?, tiktok_url),
             facebook_url = COALESCE(?, facebook_url),
             website_url = COALESCE(?, website_url),
             whatsapp_number = CASE WHEN ? IS NOT NULL THEN ? ELSE whatsapp_number END,
             parish_id = COALESCE(?, parish_id),
             lat = COALESCE(?, lat),
             lng = COALESCE(?, lng),
             service_radius_km = COALESCE(?, service_radius_km),
             cover_url = COALESCE(?, cover_url)
           WHERE id = ?`,
        )
          .bind(
            body.name ?? null,
            body.bio ?? null,
            body.specialties ?? null,
            photoTouched ? 1 : null,
            body.photo_url ?? null,
            photoTouched ? 1 : null,
            body.slug ?? null,
            body.about ?? null,
            body.location ?? null,
            body.experience ?? null,
            body.instagram_url ?? null,
            body.tiktok_url ?? null,
            body.facebook_url ?? null,
            body.website_url ?? null,
            'whatsapp_number' in body ? (body.whatsapp_number ?? null) : null,
            body.whatsapp_number ?? null,
            body.parish_id ?? null,
            body.lat ?? null,
            body.lng ?? null,
            body.service_radius_km ?? null,
            body.cover_url ?? null,
            artistId,
          )
          .run();

        if (body.industry_ids !== undefined) {
          const delStmt = env.DB.prepare('DELETE FROM artist_industries WHERE artist_id = ?').bind(artistId);
          const insStmts = body.industry_ids.map((iid) =>
            env.DB.prepare('INSERT OR IGNORE INTO artist_industries (artist_id, industry_id) VALUES (?, ?)').bind(artistId, iid),
          );
          await env.DB.batch([delStmt, ...insStmts]);
        }

        return json({ success: true });
      }

      if (pathname === '/api/artist/profile/upload' && method === 'POST') {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ error: 'Expected multipart/form-data' }, 400);
        }
        const file = form.get('file');
        if (!(file instanceof File)) return json({ error: 'file is required' }, 400);
        const ext = ALLOWED_IMAGE_TYPES[file.type];
        if (!ext) return json({ error: 'Unsupported image type (use JPEG, PNG, or WebP)' }, 400);
        if (file.size === 0) return json({ error: 'Empty file' }, 400);
        if (file.size > MAX_UPLOAD_BYTES)
          return json({ error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` }, 400);

        const prev = await env.DB.prepare('SELECT photo_storage_key FROM artists WHERE id = ?')
          .bind(artistId)
          .first<{ photo_storage_key: string | null }>();
        const oldKey = prev?.photo_storage_key ?? null;

        const storageKey = `artists/${artistId}/profile/${crypto.randomUUID()}.${ext}`;
        await env.PORTFOLIO_BUCKET.put(storageKey, file.stream(), {
          httpMetadata: { contentType: file.type },
        });
        const imageUrl = `${env.PORTFOLIO_PUBLIC_BASE.replace(/\/$/, '')}/${storageKey}`;

        await env.DB.prepare('UPDATE artists SET photo_url = ?, photo_storage_key = ? WHERE id = ?')
          .bind(imageUrl, storageKey, artistId)
          .run();

        if (oldKey && oldKey !== storageKey) {
          try {
            await env.PORTFOLIO_BUCKET.delete(oldKey);
          } catch (err) {
            console.warn('R2 delete failed for', oldKey, err);
          }
        }

        return json({ photo_url: imageUrl, photo_storage_key: storageKey }, 201);
      }

      // Portfolio (artist-owned CRUD)
      if (pathname === '/api/artist/portfolio' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, image_url, caption, display_order FROM artist_portfolio WHERE artist_id = ? ORDER BY display_order, id',
        )
          .bind(artistId)
          .all();
        return json(results);
      }

      if (pathname === '/api/artist/portfolio/upload' && method === 'POST') {
        const countRow = await env.DB.prepare(
          'SELECT COUNT(*) AS n FROM artist_portfolio WHERE artist_id = ?',
        )
          .bind(artistId)
          .first<{ n: number }>();
        if ((countRow?.n ?? 0) >= PORTFOLIO_MAX_IMAGES)
          return json({ error: `Portfolio limit of ${PORTFOLIO_MAX_IMAGES} images reached` }, 409);

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ error: 'Expected multipart/form-data' }, 400);
        }
        const file = form.get('file');
        if (!(file instanceof File)) return json({ error: 'file is required' }, 400);
        const ext = ALLOWED_IMAGE_TYPES[file.type];
        if (!ext) return json({ error: 'Unsupported image type (use JPEG, PNG, or WebP)' }, 400);
        if (file.size === 0) return json({ error: 'Empty file' }, 400);
        if (file.size > MAX_UPLOAD_BYTES)
          return json({ error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` }, 400);

        const caption = (form.get('caption') as string | null)?.trim() || null;
        const storageKey = `artists/${artistId}/${crypto.randomUUID()}.${ext}`;
        await env.PORTFOLIO_BUCKET.put(storageKey, file.stream(), {
          httpMetadata: { contentType: file.type },
        });
        const imageUrl = `${env.PORTFOLIO_PUBLIC_BASE.replace(/\/$/, '')}/${storageKey}`;

        const maxRow = await env.DB.prepare(
          'SELECT COALESCE(MAX(display_order), -1) AS max_order FROM artist_portfolio WHERE artist_id = ?',
        )
          .bind(artistId)
          .first<{ max_order: number }>();
        const nextOrder = (maxRow?.max_order ?? -1) + 1;
        const inserted = await env.DB.prepare(
          'INSERT INTO artist_portfolio (artist_id, image_url, storage_key, caption, display_order) VALUES (?, ?, ?, ?, ?)',
        )
          .bind(artistId, imageUrl, storageKey, caption, nextOrder)
          .run();

        return json(
          {
            id: inserted.meta.last_row_id,
            image_url: imageUrl,
            storage_key: storageKey,
            caption,
            display_order: nextOrder,
          },
          201,
        );
      }

      if (pathname === '/api/artist/portfolio' && method === 'POST') {
        const countRow = await env.DB.prepare(
          'SELECT COUNT(*) AS n FROM artist_portfolio WHERE artist_id = ?',
        )
          .bind(artistId)
          .first<{ n: number }>();
        if ((countRow?.n ?? 0) >= PORTFOLIO_MAX_IMAGES)
          return json({ error: `Portfolio limit of ${PORTFOLIO_MAX_IMAGES} images reached` }, 409);
        const body = await request.json<{ image_url?: string; caption?: string }>();
        const imageUrl = body.image_url?.trim();
        if (!imageUrl) return json({ error: 'image_url is required' }, 400);
        const maxRow = await env.DB.prepare(
          'SELECT COALESCE(MAX(display_order), -1) AS max_order FROM artist_portfolio WHERE artist_id = ?',
        )
          .bind(artistId)
          .first<{ max_order: number }>();
        const nextOrder = (maxRow?.max_order ?? -1) + 1;
        const result = await env.DB.prepare(
          'INSERT INTO artist_portfolio (artist_id, image_url, caption, display_order) VALUES (?, ?, ?, ?)',
        )
          .bind(artistId, imageUrl, body.caption?.trim() ?? null, nextOrder)
          .run();
        return json({ success: true, id: result.meta.last_row_id }, 201);
      }

      const portfolioItem = pathname.match(/^\/api\/artist\/portfolio\/(\d+)$/);
      if (portfolioItem && method === 'PUT') {
        const body = await request.json<{ caption?: string | null; display_order?: number }>();
        const updated = await env.DB.prepare(
          `UPDATE artist_portfolio
           SET caption = COALESCE(?, caption),
               display_order = COALESCE(?, display_order)
           WHERE id = ? AND artist_id = ?`,
        )
          .bind(
            body.caption === undefined ? null : body.caption,
            body.display_order ?? null,
            Number(portfolioItem[1]),
            artistId,
          )
          .run();
        if (!updated.meta.changes) return json({ error: 'Not found' }, 404);
        return json({ success: true });
      }

      if (portfolioItem && method === 'DELETE') {
        const itemId = Number(portfolioItem[1]);
        const existing = await env.DB.prepare(
          'SELECT storage_key FROM artist_portfolio WHERE id = ? AND artist_id = ?',
        )
          .bind(itemId, artistId)
          .first<{ storage_key: string | null }>();
        if (!existing) return json({ error: 'Not found' }, 404);
        if (existing.storage_key) {
          try {
            await env.PORTFOLIO_BUCKET.delete(existing.storage_key);
          } catch (err) {
            console.warn('R2 delete failed for', existing.storage_key, err);
          }
        }
        await env.DB.prepare('DELETE FROM artist_portfolio WHERE id = ? AND artist_id = ?')
          .bind(itemId, artistId)
          .run();
        return json({ success: true });
      }

      // Testimonials (artist-owned CRUD)
      if (pathname === '/api/artist/testimonials' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, client_name, quote, date, display_order FROM artist_testimonials WHERE artist_id = ? ORDER BY display_order, id',
        )
          .bind(artistId)
          .all();
        return json(results);
      }

      if (pathname === '/api/artist/testimonials' && method === 'POST') {
        const body = await request.json<{ client_name?: string; quote?: string; date?: string }>();
        const clientName = body.client_name?.trim();
        const quote = body.quote?.trim();
        if (!clientName || !quote)
          return json({ error: 'client_name and quote are required' }, 400);
        const maxRow = await env.DB.prepare(
          'SELECT COALESCE(MAX(display_order), -1) AS max_order FROM artist_testimonials WHERE artist_id = ?',
        )
          .bind(artistId)
          .first<{ max_order: number }>();
        const nextOrder = (maxRow?.max_order ?? -1) + 1;
        const result = await env.DB.prepare(
          'INSERT INTO artist_testimonials (artist_id, client_name, quote, date, display_order) VALUES (?, ?, ?, ?, ?)',
        )
          .bind(artistId, clientName, quote, body.date?.trim() || null, nextOrder)
          .run();
        return json({ success: true, id: result.meta.last_row_id }, 201);
      }

      const testimonialItem = pathname.match(/^\/api\/artist\/testimonials\/(\d+)$/);
      if (testimonialItem && method === 'PUT') {
        const body = await request.json<{
          client_name?: string;
          quote?: string;
          date?: string | null;
          display_order?: number;
        }>();
        const updated = await env.DB.prepare(
          `UPDATE artist_testimonials
           SET client_name = COALESCE(?, client_name),
               quote = COALESCE(?, quote),
               date = COALESCE(?, date),
               display_order = COALESCE(?, display_order)
           WHERE id = ? AND artist_id = ?`,
        )
          .bind(
            body.client_name?.trim() ?? null,
            body.quote?.trim() ?? null,
            body.date === undefined ? null : body.date?.trim() || null,
            body.display_order ?? null,
            Number(testimonialItem[1]),
            artistId,
          )
          .run();
        if (!updated.meta.changes) return json({ error: 'Not found' }, 404);
        return json({ success: true });
      }

      if (testimonialItem && method === 'DELETE') {
        const result = await env.DB.prepare(
          'DELETE FROM artist_testimonials WHERE id = ? AND artist_id = ?',
        )
          .bind(Number(testimonialItem[1]), artistId)
          .run();
        if (!result.meta.changes) return json({ error: 'Not found' }, 404);
        return json({ success: true });
      }

      // Clients — derived from bookings, annotated via artist_client_notes

      if (pathname === '/api/artist/clients' && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT
             b.email,
             b.name,
             b.phone,
             b.contact_method,
             COUNT(*) AS booking_count,
             SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
             MAX(b.date) AS last_booking_date,
             acn.notes,
             acn.tags,
             acn.is_vip
           FROM bookings b
           LEFT JOIN artist_client_notes acn
             ON acn.artist_id = b.artist_id AND acn.client_email = b.email
           WHERE b.artist_id = ?
           GROUP BY b.email
           ORDER BY last_booking_date DESC`,
        )
          .bind(artistId)
          .all();
        return json(results);
      }

      const clientEmail = pathname.match(/^\/api\/artist\/clients\/(.+)$/);

      if (clientEmail && method === 'GET') {
        const email = decodeURIComponent(clientEmail[1]);
        const [bookingsRes, notesRow] = await Promise.all([
          env.DB.prepare(
            `SELECT id, name, email, phone, service, date, start_time, end_time, message, status, created_at
             FROM bookings WHERE artist_id = ? AND email = ? ORDER BY date DESC`,
          )
            .bind(artistId, email)
            .all(),
          env.DB.prepare(
            'SELECT notes, tags, is_vip FROM artist_client_notes WHERE artist_id = ? AND client_email = ?',
          )
            .bind(artistId, email)
            .first<{ notes: string | null; tags: string | null; is_vip: number }>(),
        ]);
        return json({ bookings: bookingsRes.results, notes: notesRow ?? null });
      }

      if (clientEmail && method === 'PUT') {
        const email = decodeURIComponent(clientEmail[1]);
        const body = await request.json<{ notes?: string | null; tags?: string | null; is_vip?: number }>();
        await env.DB.prepare(
          `INSERT INTO artist_client_notes (artist_id, client_email, notes, tags, is_vip, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(artist_id, client_email) DO UPDATE SET
             notes      = excluded.notes,
             tags       = excluded.tags,
             is_vip     = excluded.is_vip,
             updated_at = excluded.updated_at`,
        )
          .bind(
            artistId,
            email,
            body.notes ?? null,
            body.tags ?? null,
            body.is_vip ?? 0,
          )
          .run();
        return json({ success: true });
      }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    if (pathname === '/api/admin/login' && method === 'POST') {
      const body = await request.json<{ password?: string }>();
      if (!body.password || body.password !== env.ADMIN_SECRET)
        return json({ error: 'Invalid password' }, 401);
      return json({ success: true });
    }

    if (pathname.startsWith('/api/admin/')) {
      if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);

      if (pathname === '/api/admin/bookings' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM bookings ORDER BY created_at DESC',
        ).all();
        return json(results);
      }
      const adminBooking = pathname.match(/^\/api\/admin\/bookings\/(\d+)$/);
      if (adminBooking && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM bookings WHERE id = ?')
          .bind(Number(adminBooking[1]))
          .run();
        return json({ success: true });
      }

      if (pathname === '/api/admin/classes' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM classes ORDER BY date').all();
        return json(results);
      }
      if (pathname === '/api/admin/classes' && method === 'POST') {
        const body = await request.json<{
          name?: string;
          description?: string;
          date?: string;
          price?: number;
          certificate?: boolean;
          mentoring?: boolean;
          host_artist_id?: number | null;
          total_slots?: number;
          duration_min?: number;
        }>();
        if (!body.name || !body.description || !body.date || body.price == null)
          return json({ error: 'Missing required fields' }, 400);
        const result = await env.DB.prepare(
          'INSERT INTO classes (name, description, date, price, certificate, mentoring, host_artist_id, total_slots, duration_min) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            body.name,
            body.description,
            body.date,
            body.price,
            body.certificate ? 1 : 0,
            body.mentoring ? 1 : 0,
            body.host_artist_id ?? null,
            body.total_slots ?? 0,
            body.duration_min ?? 60,
          )
          .run();
        return json({ success: true, id: result.meta.last_row_id }, 201);
      }
      const adminClass = pathname.match(/^\/api\/admin\/classes\/(\d+)$/);
      if (adminClass && method === 'PUT') {
        const body = await request.json<{
          name?: string;
          description?: string;
          date?: string;
          price?: number;
          certificate?: boolean;
          mentoring?: boolean;
          host_artist_id?: number | null;
          total_slots?: number;
          duration_min?: number;
        }>();
        if (!body.name || !body.description || !body.date || body.price == null)
          return json({ error: 'Missing required fields' }, 400);
        await env.DB.prepare(
          'UPDATE classes SET name=?, description=?, date=?, price=?, certificate=?, mentoring=?, host_artist_id=?, total_slots=?, duration_min=? WHERE id=?',
        )
          .bind(
            body.name,
            body.description,
            body.date,
            body.price,
            body.certificate ? 1 : 0,
            body.mentoring ? 1 : 0,
            body.host_artist_id ?? null,
            body.total_slots ?? 0,
            body.duration_min ?? 60,
            Number(adminClass[1]),
          )
          .run();
        return json({ success: true });
      }
      if (adminClass && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM classes WHERE id = ?').bind(Number(adminClass[1])).run();
        return json({ success: true });
      }

      if (pathname === '/api/admin/artists' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, name, email, bio, specialties, photo_url, is_active, user_id, created_at FROM artists ORDER BY name',
        ).all();
        return json(results);
      }
      if (pathname === '/api/admin/artists' && method === 'POST') {
        const body = await request.json<{
          name?: string;
          email?: string;
          password?: string;
          bio?: string;
          specialties?: string;
          photo_url?: string;
        }>();
        if (!body.name || !body.email || !body.password)
          return json({ error: 'Missing required fields' }, 400);
        const normalizedEmail = body.email.toLowerCase().trim();
        const existing = await env.DB.prepare('SELECT id FROM artists WHERE LOWER(email) = ?')
          .bind(normalizedEmail)
          .first();
        if (existing) return json({ error: 'Email already registered' }, 409);
        const hash = await hashPassword(body.password);
        const slug = await uniqueSlug(env.DB, slugify(body.name));
        const result = await env.DB.prepare(
          'INSERT INTO artists (name, email, password_hash, bio, specialties, photo_url, slug) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            body.name,
            normalizedEmail,
            hash,
            body.bio ?? null,
            body.specialties ?? null,
            body.photo_url ?? null,
            slug,
          )
          .run();
        return json({ success: true, id: result.meta.last_row_id, slug }, 201);
      }
      const adminArtist = pathname.match(/^\/api\/admin\/artists\/(\d+)$/);
      if (adminArtist && method === 'PUT') {
        const body = await request.json<{
          name?: string;
          bio?: string;
          specialties?: string;
          photo_url?: string;
          is_active?: boolean;
          whatsapp_number?: string | null;
          industry_ids?: number[];
        }>();
        const adminArtistId = Number(adminArtist[1]);
        await env.DB.prepare(
          `UPDATE artists SET
             name=COALESCE(?,name), bio=COALESCE(?,bio), specialties=COALESCE(?,specialties),
             photo_url=COALESCE(?,photo_url), is_active=COALESCE(?,is_active),
             whatsapp_number = CASE WHEN ? IS NOT NULL THEN ? ELSE whatsapp_number END
           WHERE id=?`,
        )
          .bind(
            body.name ?? null,
            body.bio ?? null,
            body.specialties ?? null,
            body.photo_url ?? null,
            body.is_active != null ? (body.is_active ? 1 : 0) : null,
            'whatsapp_number' in body ? (body.whatsapp_number ?? null) : null,
            body.whatsapp_number ?? null,
            adminArtistId,
          )
          .run();

        if (body.industry_ids !== undefined) {
          const delStmt = env.DB.prepare('DELETE FROM artist_industries WHERE artist_id = ?').bind(adminArtistId);
          const insStmts = body.industry_ids.map((iid) =>
            env.DB.prepare('INSERT OR IGNORE INTO artist_industries (artist_id, industry_id) VALUES (?, ?)').bind(adminArtistId, iid),
          );
          await env.DB.batch([delStmt, ...insStmts]);
        }

        return json({ success: true });
      }
      if (adminArtist && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM artists WHERE id = ?').bind(Number(adminArtist[1])).run();
        return json({ success: true });
      }

      // Users management
      if (pathname === '/api/admin/users' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
        ).all();
        return json(results);
      }

      // Promote user to artist
      const adminUserPromote = pathname.match(/^\/api\/admin\/users\/(\d+)\/promote$/);
      if (adminUserPromote && method === 'POST') {
        const userId = Number(adminUserPromote[1]);
        const body = await request.json<{
          bio?: string;
          specialties?: string;
          photo_url?: string;
        }>();

        const targetUser = await env.DB.prepare(
          'SELECT id, name, email, role FROM users WHERE id = ?',
        )
          .bind(userId)
          .first<{ id: number; name: string; email: string; role: string }>();
        if (!targetUser) return json({ error: 'User not found' }, 404);
        if (targetUser.role === 'artist') return json({ error: 'User is already an artist' }, 409);

        // If a linked artist record already exists but is inactive, reactivate it
        const existingLinked = await env.DB.prepare(
          'SELECT id, is_active, slug FROM artists WHERE user_id = ?',
        )
          .bind(userId)
          .first<{ id: number; is_active: number; slug: string | null }>();
        if (existingLinked) {
          // Backfill slug if missing
          if (!existingLinked.slug) {
            const slug = await uniqueSlug(env.DB, slugify(targetUser.name), existingLinked.id);
            await env.DB.prepare('UPDATE artists SET slug = ?, is_active = 1 WHERE id = ?')
              .bind(slug, existingLinked.id)
              .run();
          } else {
            await env.DB.prepare('UPDATE artists SET is_active = 1 WHERE id = ?')
              .bind(existingLinked.id)
              .run();
          }
          await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
            .bind('artist', userId)
            .run();
          return json({ success: true, artist_id: existingLinked.id });
        }

        // If a standalone artist shares the same email, link it instead of creating a duplicate
        const normalizedEmail = targetUser.email.toLowerCase().trim();
        const standaloneByEmail = await env.DB.prepare(
          'SELECT id, slug FROM artists WHERE LOWER(email) = ? AND user_id IS NULL',
        )
          .bind(normalizedEmail)
          .first<{ id: number; slug: string | null }>();
        if (standaloneByEmail) {
          if (!standaloneByEmail.slug) {
            const slug = await uniqueSlug(env.DB, slugify(targetUser.name), standaloneByEmail.id);
            await env.DB.prepare(
              'UPDATE artists SET user_id = ?, is_active = 1, slug = ? WHERE id = ?',
            )
              .bind(userId, slug, standaloneByEmail.id)
              .run();
          } else {
            await env.DB.prepare('UPDATE artists SET user_id = ?, is_active = 1 WHERE id = ?')
              .bind(userId, standaloneByEmail.id)
              .run();
          }
          await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
            .bind('artist', userId)
            .run();
          return json({ success: true, artist_id: standaloneByEmail.id, linked_existing: true });
        }

        // Create a new artist record linked to this user
        const slug = await uniqueSlug(env.DB, slugify(targetUser.name));
        const result = await env.DB.prepare(
          'INSERT INTO artists (name, email, password_hash, bio, specialties, photo_url, user_id, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            targetUser.name,
            normalizedEmail,
            '', // auth goes through users table; no standalone password needed
            body.bio ?? null,
            body.specialties ?? null,
            body.photo_url ?? null,
            userId,
            slug,
          )
          .run();
        await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind('artist', userId).run();
        return json({ success: true, artist_id: result.meta.last_row_id, slug }, 201);
      }

      const adminUser = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
      if (adminUser && method === 'PUT') {
        const body = await request.json<{ name?: string; role?: string }>();
        const allowed = ['user', 'artist'];
        if (body.role && !allowed.includes(body.role)) return json({ error: 'Invalid role' }, 400);
        await env.DB.prepare(
          'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role) WHERE id = ?',
        )
          .bind(body.name ?? null, body.role ?? null, Number(adminUser[1]))
          .run();
        // On demotion to regular user, soft-deactivate the linked artist profile
        if (body.role === 'user') {
          await env.DB.prepare('UPDATE artists SET is_active = 0 WHERE user_id = ?')
            .bind(Number(adminUser[1]))
            .run();
        }
        return json({ success: true });
      }

      if (adminUser && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(Number(adminUser[1])).run();
        return json({ success: true });
      }

      // ── Admin: service catalog ──────────────────────────────────────────────

      // Categories
      if (pathname === '/api/admin/service-catalog/categories' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, name, sort_order FROM service_categories ORDER BY sort_order, name',
        ).all();
        return json(results);
      }
      if (pathname === '/api/admin/service-catalog/categories' && method === 'POST') {
        const body = await request.json<{ name?: string; sort_order?: number }>();
        if (!body.name) return json({ error: 'name is required' }, 400);
        const r = await env.DB.prepare(
          'INSERT INTO service_categories (name, sort_order) VALUES (?, ?)',
        )
          .bind(body.name, body.sort_order ?? 0)
          .run();
        return json({ success: true, id: r.meta.last_row_id }, 201);
      }
      const adminCat = pathname.match(/^\/api\/admin\/service-catalog\/categories\/(\d+)$/);
      if (adminCat && method === 'PUT') {
        const body = await request.json<{ name?: string; sort_order?: number }>();
        await env.DB.prepare(
          'UPDATE service_categories SET name=COALESCE(?,name), sort_order=COALESCE(?,sort_order) WHERE id=?',
        )
          .bind(body.name ?? null, body.sort_order ?? null, Number(adminCat[1]))
          .run();
        return json({ success: true });
      }
      if (adminCat && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM service_categories WHERE id=?')
          .bind(Number(adminCat[1]))
          .run();
        return json({ success: true });
      }

      // Subcategories
      if (pathname === '/api/admin/service-catalog/subcategories' && method === 'GET') {
        const url2 = new URL(request.url);
        const catId = url2.searchParams.get('category_id');
        const { results } = catId
          ? await env.DB.prepare(
              'SELECT id, category_id, name, sort_order FROM service_subcategories WHERE category_id=? ORDER BY sort_order, name',
            )
              .bind(Number(catId))
              .all()
          : await env.DB.prepare(
              'SELECT id, category_id, name, sort_order FROM service_subcategories ORDER BY sort_order, name',
            ).all();
        return json(results);
      }
      if (pathname === '/api/admin/service-catalog/subcategories' && method === 'POST') {
        const body = await request.json<{
          category_id?: number;
          name?: string;
          sort_order?: number;
        }>();
        if (!body.category_id || !body.name)
          return json({ error: 'category_id and name are required' }, 400);
        const r = await env.DB.prepare(
          'INSERT INTO service_subcategories (category_id, name, sort_order) VALUES (?, ?, ?)',
        )
          .bind(body.category_id, body.name, body.sort_order ?? 0)
          .run();
        return json({ success: true, id: r.meta.last_row_id }, 201);
      }
      const adminSub = pathname.match(/^\/api\/admin\/service-catalog\/subcategories\/(\d+)$/);
      if (adminSub && method === 'PUT') {
        const body = await request.json<{
          name?: string;
          sort_order?: number;
          category_id?: number;
        }>();
        await env.DB.prepare(
          'UPDATE service_subcategories SET name=COALESCE(?,name), sort_order=COALESCE(?,sort_order), category_id=COALESCE(?,category_id) WHERE id=?',
        )
          .bind(
            body.name ?? null,
            body.sort_order ?? null,
            body.category_id ?? null,
            Number(adminSub[1]),
          )
          .run();
        return json({ success: true });
      }
      if (adminSub && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM service_subcategories WHERE id=?')
          .bind(Number(adminSub[1]))
          .run();
        return json({ success: true });
      }

      // Catalog services
      if (pathname === '/api/admin/service-catalog/services' && method === 'GET') {
        const url3 = new URL(request.url);
        const subId = url3.searchParams.get('subcategory_id');
        const { results } = subId
          ? await env.DB.prepare(
              'SELECT id, subcategory_id, name, description, price, duration_min, sort_order FROM catalog_services WHERE subcategory_id=? ORDER BY sort_order, name',
            )
              .bind(Number(subId))
              .all()
          : await env.DB.prepare(
              'SELECT id, subcategory_id, name, description, price, duration_min, sort_order FROM catalog_services ORDER BY sort_order, name',
            ).all();
        return json(results);
      }
      if (pathname === '/api/admin/service-catalog/services' && method === 'POST') {
        const body = await request.json<{
          subcategory_id?: number;
          name?: string;
          description?: string;
          price?: number;
          duration_min?: number;
          sort_order?: number;
        }>();
        if (!body.subcategory_id || !body.name)
          return json({ error: 'subcategory_id and name are required' }, 400);
        const r = await env.DB.prepare(
          'INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        )
          .bind(
            body.subcategory_id,
            body.name,
            body.description ?? null,
            body.price ?? null,
            body.duration_min ?? 60,
            body.sort_order ?? 0,
          )
          .run();
        return json({ success: true, id: r.meta.last_row_id }, 201);
      }
      const adminSvc = pathname.match(/^\/api\/admin\/service-catalog\/services\/(\d+)$/);
      if (adminSvc && method === 'PUT') {
        const body = await request.json<{
          name?: string;
          description?: string;
          price?: number;
          duration_min?: number;
          sort_order?: number;
          subcategory_id?: number;
        }>();
        if (!body.name) return json({ error: 'name is required' }, 400);
        await env.DB.prepare(
          'UPDATE catalog_services SET name=?, description=?, price=?, duration_min=?, sort_order=?, subcategory_id=COALESCE(?,subcategory_id) WHERE id=?',
        )
          .bind(
            body.name,
            body.description ?? null,
            body.price ?? null,
            body.duration_min ?? 60,
            body.sort_order ?? 0,
            body.subcategory_id ?? null,
            Number(adminSvc[1]),
          )
          .run();
        return json({ success: true });
      }
      if (adminSvc && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM catalog_services WHERE id=?')
          .bind(Number(adminSvc[1]))
          .run();
        return json({ success: true });
      }
    }

    // ── Public: approved reviews (for home page testimonials) ─────────────────

    if (pathname === '/api/reviews' && method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT id, name, service, rating, body, created_at
         FROM reviews WHERE approved = 1
         ORDER BY created_at DESC`,
      ).all();
      return json(results);
    }

    // ── Public: survey submission ─────────────────────────────────────────────

    const surveyTokenMatch = pathname.match(/^\/api\/surveys\/([a-f0-9]+)$/);
    if (surveyTokenMatch) {
      const token = surveyTokenMatch[1];

      if (method === 'GET') {
        const survey = await env.DB.prepare(
          `SELECT s.id, s.submitted_at, b.name, b.service, b.date
           FROM surveys s
           JOIN bookings b ON b.id = s.booking_id
           WHERE s.token = ?`,
        )
          .bind(token)
          .first<{
            id: number;
            submitted_at: string | null;
            name: string;
            service: string;
            date: string;
          }>();
        if (!survey) return json({ error: 'Survey not found' }, 404);
        return json({
          already_submitted: !!survey.submitted_at,
          name: survey.name,
          service: survey.service,
          date: survey.date,
        });
      }

      if (method === 'POST') {
        const body = await request.json<{ rating?: number; body?: string }>();
        if (!body.rating || body.rating < 1 || body.rating > 5) {
          return json({ error: 'Rating must be 1–5' }, 400);
        }
        const survey = await env.DB.prepare(
          `SELECT s.id, s.submitted_at, s.booking_id, b.email, b.name, b.service
           FROM surveys s
           JOIN bookings b ON b.id = s.booking_id
           WHERE s.token = ?`,
        )
          .bind(token)
          .first<{
            id: number;
            submitted_at: string | null;
            booking_id: number;
            email: string;
            name: string;
            service: string;
          }>();
        if (!survey) return json({ error: 'Survey not found' }, 404);
        if (survey.submitted_at) return json({ error: 'Already submitted' }, 409);

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        await env.DB.prepare(
          'UPDATE surveys SET submitted_at = ?, rating = ?, body = ? WHERE id = ?',
        )
          .bind(now, body.rating, body.body ?? null, survey.id)
          .run();

        await env.DB.prepare(
          `INSERT INTO reviews (booking_id, name, service, rating, body, approved) VALUES (?, ?, ?, ?, ?, 0)`,
        )
          .bind(survey.booking_id, survey.name, survey.service, body.rating, body.body ?? '')
          .run();

        if (body.rating >= 4) {
          const html = buildReviewRequestEmail(survey.name, env.GOOGLE_REVIEW_URL);
          const sent = await sendEmail(
            env,
            survey.email,
            'Share Your Experience — Thank You!',
            html,
          );
          if (sent) {
            await env.DB.prepare(
              'UPDATE surveys SET review_requested = 1, review_request_sent_at = ? WHERE id = ?',
            )
              .bind(now, survey.id)
              .run();
          }
        }

        return json({ success: true });
      }
    }

    // ── Admin: reviews ────────────────────────────────────────────────────────

    if (pathname.startsWith('/api/admin/')) {
      if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);

      if (pathname === '/api/admin/reviews' && method === 'GET') {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
        const limit = 50;
        const offset = (page - 1) * limit;
        const { results } = await env.DB.prepare(
          `SELECT r.id, r.name, r.service, r.rating, r.body, r.approved, r.created_at,
                  b.date AS booking_date, b.email AS booking_email
           FROM reviews r
           LEFT JOIN bookings b ON b.id = r.booking_id
           ORDER BY r.created_at DESC
           LIMIT ? OFFSET ?`,
        )
          .bind(limit, offset)
          .all();
        const countRow = await env.DB.prepare('SELECT COUNT(*) AS total FROM reviews').first<{
          total: number;
        }>();
        return json({ results, total: countRow?.total ?? 0, page, limit });
      }

      const adminReview = pathname.match(/^\/api\/admin\/reviews\/(\d+)$/);
      if (adminReview && method === 'PUT') {
        const body = await request.json<{
          approved?: number;
          name?: string;
          service?: string;
          body?: string;
          rating?: number;
        }>();
        await env.DB.prepare(
          `UPDATE reviews
           SET approved = COALESCE(?, approved),
               name     = COALESCE(?, name),
               service  = COALESCE(?, service),
               body     = COALESCE(?, body),
               rating   = COALESCE(?, rating)
           WHERE id = ?`,
        )
          .bind(
            body.approved ?? null,
            body.name ?? null,
            body.service ?? null,
            body.body ?? null,
            body.rating ?? null,
            Number(adminReview[1]),
          )
          .run();
        return json({ success: true });
      }

      if (adminReview && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(Number(adminReview[1])).run();
        return json({ success: true });
      }

      // ── Admin: surveys ──────────────────────────────────────────────────────

      if (pathname === '/api/admin/surveys' && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT s.id, s.token, s.sent_at, s.submitted_at, s.rating, s.body,
                  s.review_requested, s.review_request_sent_at,
                  b.id AS booking_id, b.name, b.email, b.service, b.date
           FROM surveys s
           JOIN bookings b ON b.id = s.booking_id
           ORDER BY s.sent_at DESC`,
        ).all();
        return json(results);
      }

      const adminSurveyResend = pathname.match(/^\/api\/admin\/surveys\/(\d+)\/resend$/);
      if (adminSurveyResend && method === 'POST') {
        const survey = await env.DB.prepare(
          `SELECT s.id, s.token, b.email, b.name, b.service
           FROM surveys s JOIN bookings b ON b.id = s.booking_id
           WHERE s.id = ?`,
        )
          .bind(Number(adminSurveyResend[1]))
          .first<{
            id: number;
            token: string;
            email: string;
            name: string;
            service: string;
          }>();
        if (!survey) return json({ error: 'Survey not found' }, 404);
        const surveyUrl = `${env.SITE_URL}/survey/${survey.token}`;
        const html = buildSurveyEmail(survey.name, survey.service, surveyUrl);
        const sent = await sendEmail(env, survey.email, 'We would love your feedback', html);
        if (!sent) return json({ error: 'Failed to send email' }, 500);
        await env.DB.prepare('UPDATE surveys SET sent_at = ? WHERE id = ?')
          .bind(new Date().toISOString().replace('T', ' ').slice(0, 19), survey.id)
          .run();
        return json({ success: true });
      }

      const adminSurveyReviewReq = pathname.match(/^\/api\/admin\/surveys\/(\d+)\/request-review$/);
      if (adminSurveyReviewReq && method === 'POST') {
        const survey = await env.DB.prepare(
          `SELECT s.id, b.email, b.name FROM surveys s
           JOIN bookings b ON b.id = s.booking_id
           WHERE s.id = ?`,
        )
          .bind(Number(adminSurveyReviewReq[1]))
          .first<{ id: number; email: string; name: string }>();
        if (!survey) return json({ error: 'Survey not found' }, 404);
        const html = buildReviewRequestEmail(survey.name, env.GOOGLE_REVIEW_URL);
        const sent = await sendEmail(env, survey.email, 'Share Your Experience!', html);
        if (!sent) return json({ error: 'Failed to send email' }, 500);
        const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
        await env.DB.prepare(
          'UPDATE surveys SET review_requested = 1, review_request_sent_at = ? WHERE id = ?',
        )
          .bind(ts, survey.id)
          .run();
        return json({ success: true });
      }
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    // Find bookings completed 55–75 minutes ago that haven't had a survey sent yet
    const now = new Date();
    const windowEnd = new Date(now.getTime() - 55 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
    const windowStart = new Date(now.getTime() - 75 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    const { results } = await env.DB.prepare(
      `SELECT b.id, b.email, b.name, b.service
       FROM bookings b
       WHERE b.status = 'completed'
         AND b.survey_sent = 0
         AND b.completed_at >= ?
         AND b.completed_at <= ?
       LIMIT 50`,
    )
      .bind(windowStart, windowEnd)
      .all<{ id: number; email: string; name: string; service: string }>();

    for (const booking of results) {
      const token = generateToken();
      try {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO surveys (booking_id, token, sent_at) VALUES (?, ?, datetime('now'))`,
        )
          .bind(booking.id, token)
          .run();

        const surveyUrl = `${env.SITE_URL}/survey/${token}`;
        const html = buildSurveyEmail(booking.name, booking.service, surveyUrl);
        const sent = await sendEmail(env, booking.email, 'How was your experience?', html);

        if (sent) {
          await env.DB.prepare('UPDATE bookings SET survey_sent = 1 WHERE id = ?')
            .bind(booking.id)
            .run();
        }
      } catch {
        // Continue processing others if one fails
      }
    }
  },
} satisfies ExportedHandler<Env>;
