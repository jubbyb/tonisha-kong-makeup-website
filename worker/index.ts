import { signJWT, verifyJWT, hashPassword, verifyPassword, type JWTPayload } from './auth';

interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
  JWT_SECRET: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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

    // ── Public: services, classes ────────────────────────────────────────────

    if (pathname === '/api/services' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM services ORDER BY id').all();
      return json(results);
    }

    if (pathname === '/api/classes' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM classes ORDER BY date').all();
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
      }>();
      if (!body.name || !body.email || !body.service || !body.date) {
        return json({ error: 'Missing required fields' }, 400);
      }
      await env.DB.prepare(
        'INSERT INTO bookings (name, email, phone, service, date, message) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(body.name, body.email, body.phone ?? null, body.service, body.date, body.message ?? null).run();
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
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
      if (existing) return json({ error: 'Email already registered' }, 409);
      const hash = await hashPassword(body.password);
      const result = await env.DB.prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
      ).bind(body.name, body.email, hash).run();
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
      const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(body.email)
        .first<{ id: number; name: string; email: string; password_hash: string }>();
      if (!user || !(await verifyPassword(body.password, user.password_hash))) {
        return json({ error: 'Invalid email or password' }, 401);
      }
      const token = await signJWT(
        { sub: String(user.id), email: user.email, name: user.name, role: 'user', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
        env.JWT_SECRET,
      );
      return json({ token, user: { id: String(user.id), name: user.name, email: user.email, role: 'user' } });
    }

    if (pathname === '/api/auth/artist-login' && method === 'POST') {
      const body = await request.json<{ email?: string; password?: string }>();
      if (!body.email || !body.password) return json({ error: 'Missing fields' }, 400);
      const artist = await env.DB.prepare('SELECT * FROM artists WHERE email = ? AND is_active = 1').bind(body.email)
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
      if (!auth || auth.role !== 'user') return json({ error: 'Authentication required' }, 401);

      const body = await request.json<{
        artist_id?: number; date?: string; start_time?: string; end_time?: string;
        service?: string; message?: string;
      }>();
      if (!body.artist_id || !body.date || !body.start_time || !body.end_time || !body.service) {
        return json({ error: 'Missing required fields' }, 400);
      }

      const user = await env.DB.prepare('SELECT name, email FROM users WHERE id = ?')
        .bind(Number(auth.sub)).first<{ name: string; email: string }>();
      if (!user) return json({ error: 'User not found' }, 404);

      // Check no existing confirmed booking for this artist+date+time
      const conflict = await env.DB.prepare(
        `SELECT 1 FROM bookings WHERE artist_id = ? AND date = ? AND start_time = ? AND status NOT IN ('cancelled')`
      ).bind(body.artist_id, body.date, body.start_time).first();
      if (conflict) return json({ error: 'This slot was just taken — please choose another.' }, 409);

      await env.DB.prepare(
        'INSERT INTO bookings (user_id, artist_id, name, email, service, date, start_time, end_time, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        Number(auth.sub), body.artist_id, user.name, user.email, body.service,
        body.date, body.start_time, body.end_time, body.message ?? null, 'pending'
      ).run();

      return json({ success: true }, 201);
    }

    if (pathname === '/api/bookings/mine' && method === 'GET') {
      const auth = await getAuth(request, env);
      if (!auth || auth.role !== 'user') return json({ error: 'Authentication required' }, 401);
      const { results } = await env.DB.prepare(`
        SELECT b.id, b.service, b.date, b.start_time, b.end_time,
               b.status, b.message, b.created_at,
               a.name as artist_name, a.photo_url as artist_photo
        FROM bookings b
        LEFT JOIN artists a ON a.id = b.artist_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `).bind(Number(auth.sub)).all();
      return json(results);
    }

    const cancelMine = pathname.match(/^\/api\/bookings\/mine\/(\d+)\/cancel$/);
    if (cancelMine && method === 'POST') {
      const auth = await getAuth(request, env);
      if (!auth || auth.role !== 'user') return json({ error: 'Authentication required' }, 401);
      await env.DB.prepare(
        `UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'`
      ).bind(Number(cancelMine[1]), Number(auth.sub)).run();
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
        await env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ? AND artist_id = ?')
          .bind(body.status, Number(bookingId[1]), artistId).run();
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
        const body = await request.json<{ name?: string; description?: string; date?: string; price?: number; certificate?: boolean; mentoring?: boolean }>();
        if (!body.name || !body.description || !body.date || body.price == null) return json({ error: 'Missing required fields' }, 400);
        const result = await env.DB.prepare(
          'INSERT INTO classes (name, description, date, price, certificate, mentoring) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(body.name, body.description, body.date, body.price, body.certificate ? 1 : 0, body.mentoring ? 1 : 0).run();
        return json({ success: true, id: result.meta.last_row_id }, 201);
      }
      const adminClass = pathname.match(/^\/api\/admin\/classes\/(\d+)$/);
      if (adminClass && method === 'PUT') {
        const body = await request.json<{ name?: string; description?: string; date?: string; price?: number; certificate?: boolean; mentoring?: boolean }>();
        if (!body.name || !body.description || !body.date || body.price == null) return json({ error: 'Missing required fields' }, 400);
        await env.DB.prepare(
          'UPDATE classes SET name=?, description=?, date=?, price=?, certificate=?, mentoring=? WHERE id=?'
        ).bind(body.name, body.description, body.date, body.price, body.certificate ? 1 : 0, body.mentoring ? 1 : 0, Number(adminClass[1])).run();
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
        const existing = await env.DB.prepare('SELECT id FROM artists WHERE email = ?').bind(body.email).first();
        if (existing) return json({ error: 'Email already registered' }, 409);
        const hash = await hashPassword(body.password);
        const result = await env.DB.prepare(
          'INSERT INTO artists (name, email, password_hash, bio, specialties, photo_url) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(body.name, body.email, hash, body.bio ?? null, body.specialties ?? null, body.photo_url ?? null).run();
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
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
