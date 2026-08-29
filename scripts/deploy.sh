#!/usr/bin/env bash
# Déploiement Vignette : rebuild des fronts, rechargement Caddy si le
# Caddyfile a changé, purge du cache edge Cloudflare pour CE hostname
# uniquement (motif ~/minimachine/deploy.sh, indiqué par Orchestration).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Tests…"
pnpm test

echo "▶ Build web + admin…"
pnpm --filter @vignette/web build
pnpm --filter @vignette/admin build

echo "▶ Rechargement Caddy…"
docker compose -f supabase/docker-compose.yml restart caddy >/dev/null

echo "▶ Purge du cache Cloudflare (vignette.ulrichrozier.com)…"
TOK=$(cat ~/.cloudflare-api-token-admin)
ZID=17407e090731de0beb11c4e42a54b83e
curl -s -X POST -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$ZID/purge_cache" \
  --data '{"hosts":["vignette.ulrichrozier.com"]}' \
  | python3 -c "import sys,json;print('  purge:', json.load(sys.stdin).get('success'))"

echo "✓ Déployé. https://vignette.ulrichrozier.com"
