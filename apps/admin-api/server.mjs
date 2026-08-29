// API back office Vignette — zéro dépendance.
// Vérifie le JWT de l'appelant (HS256), exige profiles.is_admin, puis pilote
// GoTrue admin + PostgREST avec la clé service_role (jamais exposée au client).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';

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
  const [profiles, notes, items, shares] = await Promise.all([
    count('profiles'),
    count('notes'),
    count('note_items'),
    count('note_shares'),
  ]);
  return { profiles, notes, items, shares };
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
