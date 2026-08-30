// API back office Vignette : zéro dépendance.
// Vérifie le JWT de l'appelant (HS256), exige profiles.is_admin, puis pilote
// GoTrue admin + PostgREST avec la clé service_role (jamais exposée au client).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import webpush from 'web-push';

const PORT = 3005;
const JWT_SECRET = process.env.JWT_SECRET;
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY;
const AUTH_URL = process.env.AUTH_URL ?? 'http://auth:9999';
const REST_URL = process.env.REST_URL ?? 'http://rest:3000';
const BACKUPS_DIR = process.env.BACKUPS_DIR ?? '/backups';

if (!JWT_SECRET || !SERVICE_KEY) {
  console.error('JWT_SECRET / SERVICE_ROLE_KEY manquants');
  process.exit(1);
}

const svc = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

/* ------------------------------------------------ web push (rappels) */

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const PUSH_ENABLED = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
if (PUSH_ENABLED) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:u@ulrichrozier.com', VAPID_PUBLIC, VAPID_PRIVATE);
}

async function subsFor(userIds) {
  if (userIds.length === 0) return [];
  const list = userIds.map((u) => `"${u}"`).join(',');
  const r = await fetch(`${REST_URL}/push_subscriptions?user_id=in.(${list})`, { headers: svc });
  return r.json();
}

async function recipientsOf(note) {
  const shares = await (
    await fetch(
      `${REST_URL}/note_shares?note_id=eq.${note.id}&accepted_at=not.is.null&select=user_id`,
      { headers: svc },
    )
  ).json();
  return [note.owner_id, ...shares.map((s) => s.user_id)];
}

async function pushTo(userIds, title, body) {
  const subs = await subsFor(userIds);
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body }),
        { TTL: 3600 },
      );
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // abonnement mort : on le retire
        await fetch(`${REST_URL}/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, {
          method: 'DELETE',
          headers: svc,
        });
      } else {
        console.error('push:', err.statusCode ?? err.message);
      }
    }
  }
  return subs.length;
}

/** Scanner : pousse chaque rappel échu une seule fois (notes puis items). */
async function scanReminders() {
  const nowIso = new Date().toISOString();
  try {
    const dueNotes = await (
      await fetch(
        `${REST_URL}/notes?remind_at=lte.${nowIso}&remind_notified_at=is.null&deleted_at=is.null&status=neq.archived&select=id,owner_id,title`,
        { headers: svc },
      )
    ).json();
    for (const n of dueNotes) {
      const count = await pushTo(await recipientsOf(n), `Vignette · ${n.title || 'Une note'}`, 'C’est l’heure !');
      await fetch(`${REST_URL}/notes?id=eq.${n.id}`, {
        method: 'PATCH',
        headers: svc,
        body: JSON.stringify({ remind_notified_at: nowIso }),
      });
      if (count) console.log(`rappel note "${n.title}" → ${count} abonnement(s)`);
    }

    const dueItems = await (
      await fetch(
        `${REST_URL}/note_items?remind_at=lte.${nowIso}&remind_notified_at=is.null&checked=eq.false&select=id,text,note_id`,
        { headers: svc },
      )
    ).json();
    for (const i of dueItems) {
      const notes = await (
        await fetch(
          `${REST_URL}/notes?id=eq.${i.note_id}&deleted_at=is.null&status=neq.archived&select=id,owner_id,title`,
          { headers: svc },
        )
      ).json();
      if (notes[0]) {
        const count = await pushTo(
          await recipientsOf(notes[0]),
          `Vignette · ${i.text || 'Une tâche'}`,
          `C’est l’heure ! (${notes[0].title || 'note'})`,
        );
        if (count) console.log(`rappel item "${i.text}" → ${count} abonnement(s)`);
      }
      await fetch(`${REST_URL}/note_items?id=eq.${i.id}`, {
        method: 'PATCH',
        headers: svc,
        body: JSON.stringify({ remind_notified_at: nowIso }),
      });
    }
  } catch (err) {
    console.error('scanReminders:', err.message);
  }
}

if (PUSH_ENABLED) {
  setInterval(scanReminders, 60_000);
  setTimeout(scanReminders, 5_000);
  console.log('scanner de rappels actif (60 s)');
}

function verifyJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest();
  let given;
  try {
    given = Buffer.from(parts[2], 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  if (payload.exp && payload.exp < Date.now() / 1000) return null;
  return payload;
}

async function isAdmin(userId) {
  const r = await fetch(`${REST_URL}/profiles?id=eq.${userId}&select=is_admin`, { headers: svc });
  const rows = await r.json();
  return rows[0]?.is_admin === true;
}

async function listUsers() {
  const [usersRes, notesRes, profilesRes] = await Promise.all([
    fetch(`${AUTH_URL}/admin/users?per_page=1000`, { headers: svc }),
    fetch(`${REST_URL}/notes?select=owner_id,deleted_at`, { headers: svc }),
    fetch(`${REST_URL}/profiles?select=id,display_name,is_admin`, { headers: svc }),
  ]);
  const users = (await usersRes.json()).users ?? [];
  const notes = await notesRes.json();
  const profiles = new Map((await profilesRes.json()).map((p) => [p.id, p]));
  const counts = {};
  for (const n of notes) {
    counts[n.owner_id] = counts[n.owner_id] ?? { total: 0, trashed: 0 };
    counts[n.owner_id].total += 1;
    if (n.deleted_at) counts[n.owner_id].trashed += 1;
  }
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    displayName: profiles.get(u.id)?.display_name ?? '',
    isAdmin: profiles.get(u.id)?.is_admin ?? false,
    notes: counts[u.id]?.total ?? 0,
    trashed: counts[u.id]?.trashed ?? 0,
  }));
}

async function stats() {
  const count = async (table) => {
    const r = await fetch(`${REST_URL}/${table}?select=id`, {
      method: 'HEAD',
      headers: { ...svc, Prefer: 'count=exact' },
    });
    return Number(r.headers.get('content-range')?.split('/')[1] ?? 0);
  };
  const [profiles, notes, items, shares, pushSubs] = await Promise.all([
    count('profiles'),
    count('notes'),
    count('note_items'),
    count('note_shares'),
    count('push_subscriptions'),
  ]);
  return { profiles, notes, items, shares, pushSubs };
}

function backups() {
  try {
    return readdirSync(BACKUPS_DIR)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((f) => {
        const s = statSync(`${BACKUPS_DIR}/${f}`);
        return { file: f, size: s.size, mtime: s.mtime.toISOString() };
      })
      .sort((a, b) => b.mtime.localeCompare(a.mtime))
      .slice(0, 14);
  } catch {
    return [];
  }
}

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') return json(res, 200, { ok: true });
    // clé publique VAPID : nécessaire au navigateur pour s'abonner, non secrète
    if (url.pathname === '/vapid-public') {
      return json(res, 200, { key: PUSH_ENABLED ? VAPID_PUBLIC : null });
    }
    // découverte d'instance : permet aux apps natives de se connecter à
    // n'importe quel serveur Vignette avec sa seule URL (la clé anon est
    // publique par conception : elle est dans le bundle web de toute façon)
    if (url.pathname === '/instance') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return json(res, 200, {
        name: 'Vignette',
        version: '0.1.0',
        anonKey: process.env.ANON_KEY ?? null,
        // pas de serveur mail → les apps masquent « mot de passe oublié »
        // (le back office sait réinitialiser un mot de passe à la place)
        mail: Boolean(process.env.SMTP_HOST),
      });
    }

    const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
    const payload = verifyJwt(token);
    if (!payload?.sub || !(await isAdmin(payload.sub))) {
      return json(res, 403, { error: 'admin uniquement' });
    }

    if (req.method === 'GET' && url.pathname === '/stats') return json(res, 200, await stats());
    if (req.method === 'GET' && url.pathname === '/users') return json(res, 200, await listUsers());
    if (req.method === 'GET' && url.pathname === '/backups') return json(res, 200, backups());

    if (req.method === 'POST' && url.pathname === '/users') {
      const { email, password } = await readBody(req);
      if (!email || !password) return json(res, 400, { error: 'email et mot de passe requis' });
      const r = await fetch(`${AUTH_URL}/admin/users`, {
        method: 'POST',
        headers: svc,
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      return json(res, r.status, await r.json());
    }

    const upd = url.pathname.match(/^\/users\/([0-9a-f-]{36})\/password$/);
    if (req.method === 'PUT' && upd) {
      const { password } = await readBody(req);
      if (!password || password.length < 8) {
        return json(res, 400, { error: 'mot de passe trop court (≥ 8)' });
      }
      const r = await fetch(`${AUTH_URL}/admin/users/${upd[1]}`, {
        method: 'PUT',
        headers: svc,
        body: JSON.stringify({ password }),
      });
      return json(res, r.status, r.status < 300 ? { ok: true } : await r.json());
    }

    const del = url.pathname.match(/^\/users\/([0-9a-f-]{36})$/);
    if (req.method === 'DELETE' && del) {
      if (del[1] === payload.sub) return json(res, 400, { error: 'impossible de se supprimer soi-même' });
      const r = await fetch(`${AUTH_URL}/admin/users/${del[1]}`, { method: 'DELETE', headers: svc });
      return json(res, r.status, r.status < 300 ? { ok: true } : await r.json());
    }

    json(res, 404, { error: 'inconnu' });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: 'erreur interne' });
  }
}).listen(PORT, () => console.log(`admin-api sur :${PORT}`));
