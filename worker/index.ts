import { signJWT, verifyJWT, hashPassword, verifyPassword, type JWTPayload } from './auth';

interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  SITE_URL: string;
  FROM_EMAIL: string;
  GOOGLE_REVIEW_URL: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
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
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Tonisha Kong Makeup</p>
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
  <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;margin-bottom:24px;">Tonisha Kong Makeup</p>
  <h1 style="font-size:28px;font-weight:300;font-style:italic;color:#f5f0e8;margin-bottom:16px;">We're glad you loved it, ${clientName}!</h1>
  <p style="color:#a09890;line-height:1.7;">Your kind words mean the world. Would you mind sharing your experience on Google? It helps other clients discover us.</p>
  <div style="margin:32px 0;">
    <a href="${googleUrl}" style="display:inline-block;padding:14px 40px;border:1px solid #c9a96e;color:#c9a96e;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
      Leave a Google Review
    </a>
  </div>
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

// ─── Main handler ─────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    // ── Public: classes ───────────────────────────────────────────────────────

    if (pathname === '/api/classes' && method === 'GET') {
      const { results } = await env.DB.prepare(`
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
      `).all();
      return json(results);
    }

    // ── Public: artists directory ─────────────────────────────────────────────

    if (pathname === '/api/artists' && method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, name, bio, specialties, photo_url FROM artists WHERE is_active = 1 ORDER BY name'
      ).all();
      return json(results);
    }

    const artistById = pathname.match(/^\/api\/artists\/(\d+)$/);
    if (artistById && method === 'GET') {
      const artist = await env.DB.prepare(
        'SELECT id, name, bio, specialties, photo_url FROM artists WHERE id = ? AND is_active = 1'
      ).bind(Number(artistById[1])).first();
      if (!artist) return json({ error: 'Artist not found' }, 404);
      return json(artist);
    }

    // ── Public: service catalog (full hierarchy) ─────────────────────────────
    // GET /api/service-catalog

    if (pathname === '/api/service-catalog' && method === 'GET') {
      const { results: cats } = await env.DB.prepare(
        'SELECT id, name, sort_order FROM service_categories ORDER BY sort_order, name'
      ).all<{ id: number; name: string; sort_order: number }>();

      const { results: subs } = await env.DB.prepare(
        'SELECT id, category_id, name, sort_order FROM service_subcategories ORDER BY sort_order, name'
      ).all<{ id: number; category_id: number; name: string; sort_order: number }>();

      const { results: svcs } = await env.DB.prepare(
        'SELECT id, subcategory_id, name, description, price, duration_min, sort_order FROM catalog_services ORDER BY sort_order, name'
      ).all<{ id: number; subcategory_id: number; name: string; description: string | null; price: number | null; duration_min: number; sort_order: number }>();

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
      const { results } = await env.DB.prepare(`
        SELECT cs.id, cs.name, cs.description, cs.price, cs.duration_min,
               ss.id AS subcategory_id, ss.name AS subcategory_name,
               sc.id AS category_id, sc.name AS category_name
        FROM artist_services ar
        JOIN catalog_services cs ON cs.id = ar.service_id
        JOIN service_subcategories ss ON ss.id = cs.subcategory_id
        JOIN service_categories sc ON sc.id = ss.category_id
        WHERE ar.artist_id = ?
        ORDER BY sc.sort_order, ss.sort_order, cs.sort_order, cs.name
      `).bind(artistId).all();
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

      // Working hours
      const { results: hoursRows } = await env.DB.prepare(
        'SELECT day_of_week, start_time, end_time, slot_duration FROM artist_hours WHERE artist_id = ?'
      ).bind(artistId).all<{ day_of_week: number; start_time: string; end_time: string; slot_duration: number }>();

      if (hoursRows.length === 0) return json([]); // no schedule set yet

      const hoursByDay = new Map(hoursRows.map((h) => [h.day_of_week, h]));

      // Blocks in range
      const { results: blockRows } = await env.DB.prepare(
        'SELECT date, start_time, end_time FROM artist_blocks WHERE artist_id = ? AND date >= ? AND date <= ?'
      ).bind(artistId, from, to).all<{ date: string; start_time: string | null; end_time: string | null }>();

      const blocksByDate = new Map<string, typeof blockRows>();
      for (const b of blockRows) {
        if (!blocksByDate.has(b.date)) blocksByDate.set(b.date, []);
        blocksByDate.get(b.date)!.push(b);
      }

      // Booked start times in range
      const { results: bookedRows } = await env.DB.prepare(
        `SELECT date, start_time FROM bookings
         WHERE artist_id = ? AND date >= ? AND date <= ?
         AND start_time IS NOT NULL AND status NOT IN ('cancelled')`
      ).bind(artistId, from, to).all<{ date: string; start_time: string }>();

      const bookedByDate = new Map<string, Set<string>>();
      for (const b of bookedRows) {
        if (!bookedByDate.has(b.date)) bookedByDate.set(b.date, new Set());
        bookedByDate.get(b.date)!.add(b.start_time);
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
        const dayBooked = bookedByDate.get(date) ?? new Set();

        // Full-day block?
        if (dayBlocks.some((b) => !b.start_time)) continue;

        for (const slot of generateSlots(start_time, end_time, slot_duration)) {
          if (dayBooked.has(slot.start)) continue;
          if (isBlocked(slot.start, slot.end, dayBlocks)) continue;
          result.push({ date, ...slot });
        }
      }

      return json(result);
    }

    // ── Public: legacy anonymous booking ─────────────────────────────────────

    if (pathname === '/api/bookings' && method === 'POST') {
      const body = await request.json<{
        name?: string; email?: string; phone?: string;
        service?: string; date?: string; message?: string;
        artist_id?: number; start_time?: string; end_time?: string;
      }>();
      if (!body.name || !body.email || !body.service || !body.date) {
        return json({ error: 'Missing required fields' }, 400);
      }
      // Conflict check when an artist + time slot is specified
      if (body.artist_id && body.start_time) {
        const conflict = await env.DB.prepare(
          `SELECT 1 FROM bookings WHERE artist_id = ? AND date = ? AND start_time = ? AND status NOT IN ('cancelled')`
        ).bind(body.artist_id, body.date, body.start_time).first();
        if (conflict) return json({ error: 'This slot was just taken — please choose another.' }, 409);
      }
      await env.DB.prepare(
        'INSERT INTO bookings (name, email, phone, service, date, start_time, end_time, artist_id, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        body.name, body.email, body.phone ?? null, body.service, body.date,
        body.start_time ?? null, body.end_time ?? null, body.artist_id ?? null, body.message ?? null
      ).run();
      return json({ success: true }, 201);
    }

    // ── Public: contact ───────────────────────────────────────────────────────

    if (pathname === '/api/contact' && method === 'POST') {
      const body = await request.json<{
        name?: string; email?: string; phone?: string; subject?: string; message?: string;
      }>();
      if (!body.name || !body.email || !body.subject || !body.message) {
        return json({ error: 'Missing required fields' }, 400);
      }
      await env.DB.prepare(
        'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
      ).bind(body.name, body.email, body.phone ?? null, body.subject, body.message).run();
      return json({ success: true }, 201);
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    if (pathname === '/api/auth/signup' && method === 'POST') {
      const body = await request.json<{ name?: string; email?: string; password?: string }>();
      if (!body.name || !body.email || !body.password) return json({ error: 'Missing required fields' }, 400);
      const normalizedEmail = body.email.toLowerCase().trim();
      const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(normalizedEmail).first();
      if (existing) return json({ error: 'Email already registered' }, 409);
      const hash = await hashPassword(body.password);
      const result = await env.DB.prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
      ).bind(body.name, normalizedEmail, hash).run();
      const id = String(result.meta.last_row_id);
      const token = await signJWT(
        { sub: id, email: body.email, name: body.name, role: 'user', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
        env.JWT_SECRET,
      );
      return json({ token, user: { id, name: body.name, email: body.email, role: 'user' } }, 201);
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await request.json<{ email?: string; password?: string }>();
      if (!body.email || !body.password) return json({ error: 'Missing fields' }, 400);
      const normalizedEmail = body.email.toLowerCase().trim();

      // Check users table first
      const user = await env.DB.prepare('SELECT * FROM users WHERE LOWER(email) = ?').bind(normalizedEmail)
        .first<{ id: number; name: string; email: string; password_hash: string; role: string }>();
      if (user && (await verifyPassword(body.password, user.password_hash))) {
        const role = user.role === 'artist' ? 'artist' : 'user';
        const token = await signJWT(
          { sub: String(user.id), email: user.email, name: user.name, role, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
          env.JWT_SECRET,
        );
        return json({ token, user: { id: String(user.id), name: user.name, email: user.email, role } });
      }

      // Fallback: check artists table (artist logging in via client screen)
      const artist = await env.DB.prepare('SELECT * FROM artists WHERE LOWER(email) = ? AND is_active = 1').bind(normalizedEmail)
        .first<{ id: number; name: string; email: string; password_hash: string }>();
      if (!artist || !(await verifyPassword(body.password, artist.password_hash))) {
        return json({ error: 'Invalid email or password' }, 401);
      }
      const token = await signJWT(
        { sub: String(artist.id), email: artist.email, name: artist.name, role: 'artist', artist_id: String(artist.id), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
        env.JWT_SECRET,
      );
      return json({ token, user: { id: String(artist.id), name: artist.name, email: artist.email, role: 'artist' } });
    }

    if (pathname === '/api/auth/artist-login' && method === 'POST') {
      const body = await request.json<{ email?: string; password?: string }>();
      if (!body.email || !body.password) return json({ error: 'Missing fields' }, 400);
      const normalizedEmail = body.email.toLowerCase().trim();
      const artist = await env.DB.prepare('SELECT * FROM artists WHERE LOWER(email) = ? AND is_active = 1').bind(normalizedEmail)
        .first<{ id: number; name: string; email: string; password_hash: string }>();
      if (!artist || !(await verifyPassword(body.password, artist.password_hash))) {
        return json({ error: 'Invalid email or password' }, 401);
      }
      const token = await signJWT(
        { sub: String(artist.id), email: artist.email, name: artist.name, role: 'artist', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 24 * 3600 },
        env.JWT_SECRET,
      );
      return json({ token, user: { id: String(artist.id), name: artist.name, email: artist.email, role: 'artist' } });
    }

    // ── User bookings (JWT role=user) ─────────────────────────────────────────

    if (pathname === '/api/bookings/new' && method === 'POST') {
      const auth = await getAuth(request, env);
      if (!auth) return json({ error: 'Authentication required' }, 401);

      const body = await request.json<{
        artist_id?: number; date?: string; start_time?: string; end_time?: string;
        service?: string; message?: string;
      }>();
      if (!body.artist_id || !body.date || !body.start_time || !body.end_time || !body.service) {
        return json({ error: 'Missing required fields' }, 400);
      }

      // For users: look up name/email from users table. For artists logging in via client tab: use JWT claims.
      let clientName = auth.name;
      let clientEmail = auth.email;
      let userId: number | null = null;

      if (!auth.artist_id) {
        // Logged in as a regular user (or a user with artist role in users table)
        const user = await env.DB.prepare('SELECT name, email FROM users WHERE id = ?')
          .bind(Number(auth.sub)).first<{ name: string; email: string }>();
        if (!user) return json({ error: 'User not found' }, 404);
        clientName = user.name;
        clientEmail = user.email;
        userId = Number(auth.sub);
      }

      // Check no existing confirmed booking for this artist+date+time
      const conflict = await env.DB.prepare(
        `SELECT 1 FROM bookings WHERE artist_id = ? AND date = ? AND start_time = ? AND status NOT IN ('cancelled')`
      ).bind(body.artist_id, body.date, body.start_time).first();
      if (conflict) return json({ error: 'This slot was just taken — please choose another.' }, 409);

      await env.DB.prepare(
        'INSERT INTO bookings (user_id, artist_id, name, email, service, date, start_time, end_time, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        userId, body.artist_id, clientName, clientEmail, body.service,
        body.date, body.start_time, body.end_time, body.message ?? null, 'pending'
      ).run();

      return json({ success: true }, 201);
    }

    if (pathname === '/api/bookings/mine' && method === 'GET') {
      const auth = await getAuth(request, env);
      if (!auth) return json({ error: 'Authentication required' }, 401);
      let results;
      if (auth.artist_id) {
        // Artist logged in via client tab — find bookings by email
        ({ results } = await env.DB.prepare(`
          SELECT b.id, b.service, b.date, b.start_time, b.end_time,
                 b.status, b.message, b.created_at,
                 a.name as artist_name, a.photo_url as artist_photo
          FROM bookings b
          LEFT JOIN artists a ON a.id = b.artist_id
          WHERE b.email = ? AND (b.user_id IS NULL OR b.artist_id != ?)
          ORDER BY b.created_at DESC
        `).bind(auth.email, Number(auth.artist_id)).all());
      } else {
        ({ results } = await env.DB.prepare(`
          SELECT b.id, b.service, b.date, b.start_time, b.end_time,
                 b.status, b.message, b.created_at,
                 a.name as artist_name, a.photo_url as artist_photo
          FROM bookings b
          LEFT JOIN artists a ON a.id = b.artist_id
          WHERE b.user_id = ?
          ORDER BY b.created_at DESC
        `).bind(Number(auth.sub)).all());
      }
      return json(results);
    }

    const cancelMine = pathname.match(/^\/api\/bookings\/mine\/(\d+)\/cancel$/);
    if (cancelMine && method === 'POST') {
      const auth = await getAuth(request, env);
      if (!auth) return json({ error: 'Authentication required' }, 401);
      if (auth.artist_id) {
        await env.DB.prepare(
          `UPDATE bookings SET status = 'cancelled' WHERE id = ? AND email = ? AND status = 'pending'`
        ).bind(Number(cancelMine[1]), auth.email).run();
      } else {
        await env.DB.prepare(
          `UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'`
        ).bind(Number(cancelMine[1]), Number(auth.sub)).run();
      }
      return json({ success: true });
    }

    // ── Artist dashboard (JWT role=artist) ────────────────────────────────────

    if (pathname.startsWith('/api/artist/')) {
      const auth = await getAuth(request, env);
      if (!auth || auth.role !== 'artist') return json({ error: 'Artist authentication required' }, 401);
      const artistId = Number(auth.sub);

      // Bookings
      if (pathname === '/api/artist/bookings' && method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT b.id, b.name, b.email, b.phone, b.service, b.date,
                 b.start_time, b.end_time, b.message, b.status, b.created_at
          FROM bookings b
          WHERE b.artist_id = ?
          ORDER BY b.date DESC, b.start_time DESC
        `).bind(artistId).all();
        return json(results);
      }

      const bookingId = pathname.match(/^\/api\/artist\/bookings\/(\d+)$/);
      if (bookingId && method === 'PUT') {
        const body = await request.json<{ status?: string }>();
        const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!body.status || !allowed.includes(body.status)) return json({ error: 'Invalid status' }, 400);
        const completedAt = body.status === 'completed'
          ? new Date().toISOString().replace('T', ' ').slice(0, 19)
          : null;
        await env.DB.prepare(
          'UPDATE bookings SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ? AND artist_id = ?'
        ).bind(body.status, completedAt, Number(bookingId[1]), artistId).run();
        return json({ success: true });
      }

      // Working hours
      if (pathname === '/api/artist/hours' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT day_of_week, start_time, end_time, slot_duration FROM artist_hours WHERE artist_id = ? ORDER BY day_of_week'
        ).bind(artistId).all();
        return json(results);
      }

      const hourDay = pathname.match(/^\/api\/artist\/hours\/([0-6])$/);
      if (hourDay && method === 'PUT') {
        const body = await request.json<{ start_time?: string; end_time?: string; slot_duration?: number; enabled?: boolean }>();
        if (body.enabled === false) {
          await env.DB.prepare('DELETE FROM artist_hours WHERE artist_id = ? AND day_of_week = ?')
            .bind(artistId, Number(hourDay[1])).run();
        } else {
          if (!body.start_time || !body.end_time) return json({ error: 'Missing times' }, 400);
          await env.DB.prepare(
            `INSERT INTO artist_hours (artist_id, day_of_week, start_time, end_time, slot_duration)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(artist_id, day_of_week)
             DO UPDATE SET start_time = excluded.start_time, end_time = excluded.end_time, slot_duration = excluded.slot_duration`
          ).bind(artistId, Number(hourDay[1]), body.start_time, body.end_time, body.slot_duration ?? 60).run();
        }
        return json({ success: true });
      }

      // Blocks
      if (pathname === '/api/artist/blocks' && method === 'GET') {
        const today = new Date().toISOString().split('T')[0];
        const { results } = await env.DB.prepare(
          'SELECT id, date, start_time, end_time FROM artist_blocks WHERE artist_id = ? AND date >= ? ORDER BY date, start_time'
        ).bind(artistId, today).all();
        return json(results);
      }

      if (pathname === '/api/artist/blocks' && method === 'POST') {
        const body = await request.json<{ date?: string; date_to?: string; start_time?: string; end_time?: string }>();
        if (!body.date) return json({ error: 'Date is required' }, 400);
        const dates = body.date_to && body.date_to >= body.date
          ? datesInRange(body.date, body.date_to)
          : [body.date];
        const stmt = env.DB.prepare(
          'INSERT INTO artist_blocks (artist_id, date, start_time, end_time) VALUES (?, ?, ?, ?)'
        );
        for (const d of dates) {
          await stmt.bind(artistId, d, body.start_time ?? null, body.end_time ?? null).run();
        }
        return json({ success: true, count: dates.length }, 201);
      }

      const blockId = pathname.match(/^\/api\/artist\/blocks\/(\d+)$/);
      if (blockId && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM artist_blocks WHERE id = ? AND artist_id = ?')
          .bind(Number(blockId[1]), artistId).run();
        return json({ success: true });
      }

      // Artist's offered services
      if (pathname === '/api/artist/services' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT service_id FROM artist_services WHERE artist_id = ?'
        ).bind(artistId).all<{ service_id: number }>();
        return json(results.map((r) => r.service_id));
      }

      if (pathname === '/api/artist/services' && method === 'PUT') {
        const body = await request.json<{ service_ids?: number[] }>();
        if (!Array.isArray(body.service_ids)) return json({ error: 'service_ids must be an array' }, 400);
        await env.DB.prepare('DELETE FROM artist_services WHERE artist_id = ?').bind(artistId).run();
        for (const sid of body.service_ids) {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO artist_services (artist_id, service_id) VALUES (?, ?)'
          ).bind(artistId, sid).run();
        }
        return json({ success: true });
      }

      // Profile
      if (pathname === '/api/artist/profile' && method === 'GET') {
        const artist = await env.DB.prepare(
          'SELECT id, name, email, bio, specialties, photo_url FROM artists WHERE id = ?'
        ).bind(artistId).first();
        return json(artist);
      }

      if (pathname === '/api/artist/profile' && method === 'PUT') {
        const body = await request.json<{ name?: string; bio?: string; specialties?: string; photo_url?: string }>();
        await env.DB.prepare(
          'UPDATE artists SET name = COALESCE(?, name), bio = COALESCE(?, bio), specialties = COALESCE(?, specialties), photo_url = COALESCE(?, photo_url) WHERE id = ?'
        ).bind(body.name ?? null, body.bio ?? null, body.specialties ?? null, body.photo_url ?? null, artistId).run();
        return json({ success: true });
      }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    if (pathname === '/api/admin/login' && method === 'POST') {
      const body = await request.json<{ password?: string }>();
      if (!body.password || body.password !== env.ADMIN_SECRET) return json({ error: 'Invalid password' }, 401);
      return json({ success: true });
    }

    if (pathname.startsWith('/api/admin/')) {
      if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);

      if (pathname === '/api/admin/bookings' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
        return json(results);
      }
      const adminBooking = pathname.match(/^\/api\/admin\/bookings\/(\d+)$/);
      if (adminBooking && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(Number(adminBooking[1])).run();
        return json({ success: true });
      }

      if (pathname === '/api/admin/classes' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM classes ORDER BY date').all();
        return json(results);
      }
      if (pathname === '/api/admin/classes' && method === 'POST') {
        const body = await request.json<{ name?: string; description?: string; date?: string; price?: number; certificate?: boolean; mentoring?: boolean; host_artist_id?: number | null; total_slots?: number; duration_min?: number }>();
        if (!body.name || !body.description || !body.date || body.price == null) return json({ error: 'Missing required fields' }, 400);
        const result = await env.DB.prepare(
          'INSERT INTO classes (name, description, date, price, certificate, mentoring, host_artist_id, total_slots, duration_min) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(body.name, body.description, body.date, body.price, body.certificate ? 1 : 0, body.mentoring ? 1 : 0, body.host_artist_id ?? null, body.total_slots ?? 0, body.duration_min ?? 60).run();
        return json({ success: true, id: result.meta.last_row_id }, 201);
      }
      const adminClass = pathname.match(/^\/api\/admin\/classes\/(\d+)$/);
      if (adminClass && method === 'PUT') {
        const body = await request.json<{ name?: string; description?: string; date?: string; price?: number; certificate?: boolean; mentoring?: boolean; host_artist_id?: number | null; total_slots?: number; duration_min?: number }>();
        if (!body.name || !body.description || !body.date || body.price == null) return json({ error: 'Missing required fields' }, 400);
        await env.DB.prepare(
          'UPDATE classes SET name=?, description=?, date=?, price=?, certificate=?, mentoring=?, host_artist_id=?, total_slots=?, duration_min=? WHERE id=?'
        ).bind(body.name, body.description, body.date, body.price, body.certificate ? 1 : 0, body.mentoring ? 1 : 0, body.host_artist_id ?? null, body.total_slots ?? 0, body.duration_min ?? 60, Number(adminClass[1])).run();
        return json({ success: true });
      }
      if (adminClass && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM classes WHERE id = ?').bind(Number(adminClass[1])).run();
        return json({ success: true });
      }

      if (pathname === '/api/admin/artists' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, name, email, bio, specialties, photo_url, is_active, created_at FROM artists ORDER BY name'
        ).all();
        return json(results);
      }
      if (pathname === '/api/admin/artists' && method === 'POST') {
        const body = await request.json<{ name?: string; email?: string; password?: string; bio?: string; specialties?: string; photo_url?: string }>();
        if (!body.name || !body.email || !body.password) return json({ error: 'Missing required fields' }, 400);
        const normalizedEmail = body.email.toLowerCase().trim();
        const existing = await env.DB.prepare('SELECT id FROM artists WHERE LOWER(email) = ?').bind(normalizedEmail).first();
        if (existing) return json({ error: 'Email already registered' }, 409);
        const hash = await hashPassword(body.password);
        const result = await env.DB.prepare(
          'INSERT INTO artists (name, email, password_hash, bio, specialties, photo_url) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(body.name, normalizedEmail, hash, body.bio ?? null, body.specialties ?? null, body.photo_url ?? null).run();
        return json({ success: true, id: result.meta.last_row_id }, 201);
      }
      const adminArtist = pathname.match(/^\/api\/admin\/artists\/(\d+)$/);
      if (adminArtist && method === 'PUT') {
        const body = await request.json<{ name?: string; bio?: string; specialties?: string; photo_url?: string; is_active?: boolean }>();
        await env.DB.prepare(
          'UPDATE artists SET name=COALESCE(?,name), bio=COALESCE(?,bio), specialties=COALESCE(?,specialties), photo_url=COALESCE(?,photo_url), is_active=COALESCE(?,is_active) WHERE id=?'
        ).bind(body.name ?? null, body.bio ?? null, body.specialties ?? null, body.photo_url ?? null, body.is_active != null ? (body.is_active ? 1 : 0) : null, Number(adminArtist[1])).run();
        return json({ success: true });
      }
      if (adminArtist && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM artists WHERE id = ?').bind(Number(adminArtist[1])).run();
        return json({ success: true });
      }

      // Users management
      if (pathname === '/api/admin/users' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        ).all();
        return json(results);
      }

      const adminUser = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
      if (adminUser && method === 'PUT') {
        const body = await request.json<{ name?: string; role?: string }>();
        const allowed = ['user', 'artist'];
        if (body.role && !allowed.includes(body.role)) return json({ error: 'Invalid role' }, 400);
        await env.DB.prepare(
          'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role) WHERE id = ?'
        ).bind(body.name ?? null, body.role ?? null, Number(adminUser[1])).run();
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
          'SELECT id, name, sort_order FROM service_categories ORDER BY sort_order, name'
        ).all();
        return json(results);
      }
      if (pathname === '/api/admin/service-catalog/categories' && method === 'POST') {
        const body = await request.json<{ name?: string; sort_order?: number }>();
        if (!body.name) return json({ error: 'name is required' }, 400);
        const r = await env.DB.prepare(
          'INSERT INTO service_categories (name, sort_order) VALUES (?, ?)'
        ).bind(body.name, body.sort_order ?? 0).run();
        return json({ success: true, id: r.meta.last_row_id }, 201);
      }
      const adminCat = pathname.match(/^\/api\/admin\/service-catalog\/categories\/(\d+)$/);
      if (adminCat && method === 'PUT') {
        const body = await request.json<{ name?: string; sort_order?: number }>();
        await env.DB.prepare(
          'UPDATE service_categories SET name=COALESCE(?,name), sort_order=COALESCE(?,sort_order) WHERE id=?'
        ).bind(body.name ?? null, body.sort_order ?? null, Number(adminCat[1])).run();
        return json({ success: true });
      }
      if (adminCat && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM service_categories WHERE id=?').bind(Number(adminCat[1])).run();
        return json({ success: true });
      }

      // Subcategories
      if (pathname === '/api/admin/service-catalog/subcategories' && method === 'GET') {
        const url2 = new URL(request.url);
        const catId = url2.searchParams.get('category_id');
        const { results } = catId
          ? await env.DB.prepare('SELECT id, category_id, name, sort_order FROM service_subcategories WHERE category_id=? ORDER BY sort_order, name').bind(Number(catId)).all()
          : await env.DB.prepare('SELECT id, category_id, name, sort_order FROM service_subcategories ORDER BY sort_order, name').all();
        return json(results);
      }
      if (pathname === '/api/admin/service-catalog/subcategories' && method === 'POST') {
        const body = await request.json<{ category_id?: number; name?: string; sort_order?: number }>();
        if (!body.category_id || !body.name) return json({ error: 'category_id and name are required' }, 400);
        const r = await env.DB.prepare(
          'INSERT INTO service_subcategories (category_id, name, sort_order) VALUES (?, ?, ?)'
        ).bind(body.category_id, body.name, body.sort_order ?? 0).run();
        return json({ success: true, id: r.meta.last_row_id }, 201);
      }
      const adminSub = pathname.match(/^\/api\/admin\/service-catalog\/subcategories\/(\d+)$/);
      if (adminSub && method === 'PUT') {
        const body = await request.json<{ name?: string; sort_order?: number; category_id?: number }>();
        await env.DB.prepare(
          'UPDATE service_subcategories SET name=COALESCE(?,name), sort_order=COALESCE(?,sort_order), category_id=COALESCE(?,category_id) WHERE id=?'
        ).bind(body.name ?? null, body.sort_order ?? null, body.category_id ?? null, Number(adminSub[1])).run();
        return json({ success: true });
      }
      if (adminSub && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM service_subcategories WHERE id=?').bind(Number(adminSub[1])).run();
        return json({ success: true });
      }

      // Catalog services
      if (pathname === '/api/admin/service-catalog/services' && method === 'GET') {
        const url3 = new URL(request.url);
        const subId = url3.searchParams.get('subcategory_id');
        const { results } = subId
          ? await env.DB.prepare('SELECT id, subcategory_id, name, description, price, duration_min, sort_order FROM catalog_services WHERE subcategory_id=? ORDER BY sort_order, name').bind(Number(subId)).all()
          : await env.DB.prepare('SELECT id, subcategory_id, name, description, price, duration_min, sort_order FROM catalog_services ORDER BY sort_order, name').all();
        return json(results);
      }
      if (pathname === '/api/admin/service-catalog/services' && method === 'POST') {
        const body = await request.json<{ subcategory_id?: number; name?: string; description?: string; price?: number; duration_min?: number; sort_order?: number }>();
        if (!body.subcategory_id || !body.name) return json({ error: 'subcategory_id and name are required' }, 400);
        const r = await env.DB.prepare(
          'INSERT INTO catalog_services (subcategory_id, name, description, price, duration_min, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(body.subcategory_id, body.name, body.description ?? null, body.price ?? null, body.duration_min ?? 60, body.sort_order ?? 0).run();
        return json({ success: true, id: r.meta.last_row_id }, 201);
      }
      const adminSvc = pathname.match(/^\/api\/admin\/service-catalog\/services\/(\d+)$/);
      if (adminSvc && method === 'PUT') {
        const body = await request.json<{ name?: string; description?: string; price?: number; duration_min?: number; sort_order?: number; subcategory_id?: number }>();
        if (!body.name) return json({ error: 'name is required' }, 400);
        await env.DB.prepare(
          'UPDATE catalog_services SET name=?, description=?, price=?, duration_min=?, sort_order=?, subcategory_id=COALESCE(?,subcategory_id) WHERE id=?'
        ).bind(body.name, body.description ?? null, body.price ?? null, body.duration_min ?? 60, body.sort_order ?? 0, body.subcategory_id ?? null, Number(adminSvc[1])).run();
        return json({ success: true });
      }
      if (adminSvc && method === 'DELETE') {
        await env.DB.prepare('DELETE FROM catalog_services WHERE id=?').bind(Number(adminSvc[1])).run();
        return json({ success: true });
      }
    }

    // ── Public: approved reviews (for home page testimonials) ─────────────────

    if (pathname === '/api/reviews' && method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT id, name, service, rating, body, created_at
         FROM reviews WHERE approved = 1
         ORDER BY created_at DESC`
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
           WHERE s.token = ?`
        ).bind(token).first<{ id: number; submitted_at: string | null; name: string; service: string; date: string }>();
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
           WHERE s.token = ?`
        ).bind(token).first<{
          id: number; submitted_at: string | null; booking_id: number;
          email: string; name: string; service: string;
        }>();
        if (!survey) return json({ error: 'Survey not found' }, 404);
        if (survey.submitted_at) return json({ error: 'Already submitted' }, 409);

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        await env.DB.prepare(
          'UPDATE surveys SET submitted_at = ?, rating = ?, body = ? WHERE id = ?'
        ).bind(now, body.rating, body.body ?? null, survey.id).run();

        await env.DB.prepare(
          `INSERT INTO reviews (booking_id, name, service, rating, body, approved) VALUES (?, ?, ?, ?, ?, 0)`
        ).bind(survey.booking_id, survey.name, survey.service, body.rating, body.body ?? '').run();

        if (body.rating >= 4) {
          const html = buildReviewRequestEmail(survey.name, env.GOOGLE_REVIEW_URL);
          const sent = await sendEmail(env, survey.email, 'Share Your Experience — Thank You!', html);
          if (sent) {
            await env.DB.prepare(
              'UPDATE surveys SET review_requested = 1, review_request_sent_at = ? WHERE id = ?'
            ).bind(now, survey.id).run();
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
           LIMIT ? OFFSET ?`
        ).bind(limit, offset).all();
        const countRow = await env.DB.prepare('SELECT COUNT(*) AS total FROM reviews').first<{ total: number }>();
        return json({ results, total: countRow?.total ?? 0, page, limit });
      }

      const adminReview = pathname.match(/^\/api\/admin\/reviews\/(\d+)$/);
      if (adminReview && method === 'PUT') {
        const body = await request.json<{ approved?: number; name?: string; service?: string; body?: string; rating?: number }>();
        await env.DB.prepare(
          `UPDATE reviews
           SET approved = COALESCE(?, approved),
               name     = COALESCE(?, name),
               service  = COALESCE(?, service),
               body     = COALESCE(?, body),
               rating   = COALESCE(?, rating)
           WHERE id = ?`
        ).bind(
          body.approved ?? null,
          body.name ?? null,
          body.service ?? null,
          body.body ?? null,
          body.rating ?? null,
          Number(adminReview[1])
        ).run();
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
           ORDER BY s.sent_at DESC`
        ).all();
        return json(results);
      }

      const adminSurveyResend = pathname.match(/^\/api\/admin\/surveys\/(\d+)\/resend$/);
      if (adminSurveyResend && method === 'POST') {
        const survey = await env.DB.prepare(
          `SELECT s.id, s.token, b.email, b.name, b.service
           FROM surveys s JOIN bookings b ON b.id = s.booking_id
           WHERE s.id = ?`
        ).bind(Number(adminSurveyResend[1])).first<{
          id: number; token: string; email: string; name: string; service: string;
        }>();
        if (!survey) return json({ error: 'Survey not found' }, 404);
        const surveyUrl = `${env.SITE_URL}/survey/${survey.token}`;
        const html = buildSurveyEmail(survey.name, survey.service, surveyUrl);
        const sent = await sendEmail(env, survey.email, 'We would love your feedback', html);
        if (!sent) return json({ error: 'Failed to send email' }, 500);
        await env.DB.prepare('UPDATE surveys SET sent_at = ? WHERE id = ?')
          .bind(new Date().toISOString().replace('T', ' ').slice(0, 19), survey.id).run();
        return json({ success: true });
      }

      const adminSurveyReviewReq = pathname.match(/^\/api\/admin\/surveys\/(\d+)\/request-review$/);
      if (adminSurveyReviewReq && method === 'POST') {
        const survey = await env.DB.prepare(
          `SELECT s.id, b.email, b.name FROM surveys s
           JOIN bookings b ON b.id = s.booking_id
           WHERE s.id = ?`
        ).bind(Number(adminSurveyReviewReq[1])).first<{ id: number; email: string; name: string }>();
        if (!survey) return json({ error: 'Survey not found' }, 404);
        const html = buildReviewRequestEmail(survey.name, env.GOOGLE_REVIEW_URL);
        const sent = await sendEmail(env, survey.email, 'Share Your Experience!', html);
        if (!sent) return json({ error: 'Failed to send email' }, 500);
        const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
        await env.DB.prepare(
          'UPDATE surveys SET review_requested = 1, review_request_sent_at = ? WHERE id = ?'
        ).bind(ts, survey.id).run();
        return json({ success: true });
      }
    }

    return new Response(null, { status: 404 });
  },

  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    // Find bookings completed 55–75 minutes ago that haven't had a survey sent yet
    const now = new Date();
    const windowEnd = new Date(now.getTime() - 55 * 60 * 1000)
      .toISOString().replace('T', ' ').slice(0, 19);
    const windowStart = new Date(now.getTime() - 75 * 60 * 1000)
      .toISOString().replace('T', ' ').slice(0, 19);

    const { results } = await env.DB.prepare(
      `SELECT b.id, b.email, b.name, b.service
       FROM bookings b
       WHERE b.status = 'completed'
         AND b.survey_sent = 0
         AND b.completed_at >= ?
         AND b.completed_at <= ?
       LIMIT 50`
    ).bind(windowStart, windowEnd).all<{ id: number; email: string; name: string; service: string }>();

    for (const booking of results) {
      const token = generateToken();
      try {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO surveys (booking_id, token, sent_at) VALUES (?, ?, datetime('now'))`
        ).bind(booking.id, token).run();

        const surveyUrl = `${env.SITE_URL}/survey/${token}`;
        const html = buildSurveyEmail(booking.name, booking.service, surveyUrl);
        const sent = await sendEmail(env, booking.email, 'How was your experience?', html);

        if (sent) {
          await env.DB.prepare('UPDATE bookings SET survey_sent = 1 WHERE id = ?')
            .bind(booking.id).run();
        }
      } catch {
        // Continue processing others if one fails
      }
    }
  },
} satisfies ExportedHandler<Env>;
