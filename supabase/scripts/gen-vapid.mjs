#!/usr/bin/env node
// Ajoute une paire de clés VAPID (web push) à supabase/.env si absente.
// Format attendu par web-push : base64url du point public non compressé (65 o)
// et du scalaire privé d (32 o).

import { generateKeyPairSync } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
const env = readFileSync(envPath, 'utf8');
if (env.includes('VAPID_PUBLIC_KEY=')) {
  console.log('VAPID déjà présent : rien à faire.');
  process.exit(0);
}

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const jwk = privateKey.export({ format: 'jwk' });
const b64u = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// point public non compressé : 0x04 || x || y
const raw = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(jwk.x, 'base64url'),
  Buffer.from(jwk.y, 'base64url'),
]);

appendFileSync(
  envPath,
  `\n# Web push (rappels app fermée) : générés par gen-vapid.mjs\nVAPID_PUBLIC_KEY=${b64u(raw.toString('base64'))}\nVAPID_PRIVATE_KEY=${jwk.d}\nVAPID_SUBJECT=mailto:u@ulrichrozier.com\n`,
);
console.log('Clés VAPID ajoutées à supabase/.env');
