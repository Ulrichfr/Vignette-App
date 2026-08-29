# Auto-héberger Vignette

Il te faut **Docker**, **Node ≥ 20** et **pnpm**. Tout tient dans un
docker compose : Postgres 17, GoTrue (auth), PostgREST (API), Realtime
(websockets) et Caddy (routage + fichiers statiques). Pas de Kong, pas de
Studio : ~450 Mo de RAM au total.

## Installation

```bash
git clone https://github.com/Ulrichfr/Vignette-App.git && cd Vignette-App

# 1. secrets : mot de passe Postgres, secret JWT, clés anon/service_role
node supabase/scripts/gen-env.mjs

# 2. la stack (premier lancement : télécharge ~1,5 Go d'images)
docker compose -f supabase/docker-compose.yml up -d

# 3. le schéma applicatif (tables, RLS, realtime) — attends ~1 min que
#    le service auth soit healthy (docker compose ps)
./supabase/scripts/apply-migrations.sh

# 4. la clé anon côté front (affichée par gen-env.mjs)
printf 'VITE_SUPABASE_URL=http://127.0.0.1:8360\nVITE_SUPABASE_ANON_KEY=%s\n' "<ANON_KEY>" > apps/web/.env.local
cp apps/web/.env.local apps/admin/.env.local

# 5. build du front (web + admin)
pnpm install && pnpm build
```

Ouvre `http://127.0.0.1:8360` : le site vitrine à la racine, l'app sur `/app`,
le back office sur `/admin`.

## Premier compte et premier admin

Les inscriptions publiques sont fermées (`GOTRUE_DISABLE_SIGNUP`). Crée ton
compte en SQL puis passe-le admin :

```bash
# crée un utilisateur via l'API admin GoTrue (service_role dans supabase/.env)
source supabase/.env
curl -s -X POST http://127.0.0.1:8360/auth/v1/admin/users \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"toi@exemple.fr","password":"choisis-un-vrai-mdp","email_confirm":true}'

# promotion admin
docker exec vignette-db psql -U postgres -d postgres -c \
  "update public.profiles set is_admin = true where id in (select id from auth.users where email='toi@exemple.fr');"
```

Ensuite tout se fait depuis `/admin` : création des comptes de tes proches,
suppression, stats, état des sauvegardes.

## Exposer sur Internet

Caddy écoute en HTTP simple (port 8360) : mets ce que tu veux devant —
un tunnel Cloudflare, un reverse proxy TLS, Tailscale. Pense à mettre à jour
`SITE_URL` et `API_EXTERNAL_URL` dans `supabase/.env` avec ton URL publique
puis `docker compose up -d auth`.

## Sauvegardes

`scripts/backup-db.sh` fait un `pg_dump` gzippé dans `backups/` avec rotation
sur 14 jours. En cron :

```
40 3 * * * /chemin/vers/Vignette-App/scripts/backup-db.sh >> /chemin/vers/Vignette-App/backups/backup.log 2>&1
```

Restauration : `zcat backups/vignette-XXX.sql.gz | docker exec -i vignette-db psql -U postgres -d postgres`.
