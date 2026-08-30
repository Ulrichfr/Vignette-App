#!/usr/bin/env node
// Génère supabase/.env avec des secrets frais (Postgres, JWT, clés anon/service_role).
// Idempotent : refuse d'écraser un .env existant sans --force.

import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '..', '.env');

if (existsSync(envPath) && !process.argv.includes('--force')) {
  console.error(`${envPath} existe déjà : utilise --force pour régénérer (invalide toutes les sessions).`);
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function signJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

const jwtSecret = randomBytes(32).toString('hex');
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 20 * 365 * 24 * 3600; // 20 ans, comme les clés self-hosted officielles

const anonKey = signJwt({ role: 'anon', iss: 'supabase', iat, exp }, jwtSecret);
const serviceKey = signJwt({ role: 'service_role', iss: 'supabase', iat, exp }, jwtSecret);

const site = process.env.VIGNETTE_SITE_URL ?? 'http://localhost:5183';
const api = process.env.VIGNETTE_API_URL ?? 'http://127.0.0.1:8360';

const env = `# Généré par scripts/gen-env.mjs : NE PAS COMMITTER
POSTGRES_PASSWORD=${randomBytes(24).toString('hex')}
JWT_SECRET=${jwtSecret}
JWT_EXPIRY=3600
ANON_KEY=${anonKey}
SERVICE_ROLE_KEY=${serviceKey}
SECRET_KEY_BASE=${randomBytes(48).toString('hex')}
REALTIME_DB_ENC_KEY=${randomBytes(8).toString('hex')}
SITE_URL=${site}
API_EXTERNAL_URL=${api}
ADDITIONAL_REDIRECT_URLS=
`;

writeFileSync(envPath, env, { mode: 0o600 });
console.log(`Écrit ${envPath}`);
console.log(`ANON_KEY=${anonKey}`);
