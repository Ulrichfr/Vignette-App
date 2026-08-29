# Vignette — consignes pour les agents

App de post-its dockés au bord de l'écran : listes, synchro temps réel,
partage, rappels. **En production sur https://vignette.ulrichrozier.com**
(vitrine `/`, app `/app`, admin `/admin`, API Supabase `/auth|/rest|/realtime`,
API maison `/admin-api`). Le dépôt public est `Ulrichfr/Vignette-App` — pousser
sur `origin` ET `public` à chaque commit. Identité git du repo : Ulrichfr.

## Ce qui fait loi

- `DESIGN.md` : palette, typo (Caveat manuscrit + Inter), springs, la métaphore
  papier. Tout nouveau visuel s'y conforme. Pas d'emojis dans l'UI : des SVG
  maison (`apps/web/src/components/icons.tsx`).
- `docs/MODES.md` : les trois modes (officiel / instance perso / local pur) et
  la feuille de route (synchro p2p CRDT, migration locale→instance, widgets OS,
  fenêtres post-its sur le bureau, iOS, Windows).
- Interface FR par défaut, EN en bascule — toute chaîne passe par
  `apps/web/src/i18n.ts` (les deux langues, toujours).

## Commandes

```bash
pnpm test                    # tests unitaires du core (rapides, toujours avant commit)
./scripts/test-api.sh        # 10 invariants API/RLS contre la stack locale (comptes jetables)
./scripts/deploy.sh          # tests + build web/admin + reload caddy + purge cache Cloudflare
./scripts/backup-db.sh       # dump SQL (aussi en cron à 3h40)
```

Un déploiement SANS `deploy.sh` laisse le cache edge Cloudflare servir de
vieux fichiers aux visiteurs — c'est arrivé, ne pas recommencer.

## Architecture rapide

- `packages/core` : logique pure testée (deck fractionnaire, statuts, richtext,
  import/export). Toute règle métier nouvelle naît ici, avec ses tests.
- `apps/web` : React/Vite. `store.ts` (instance serveur, optimiste + Realtime)
  ou `store-local.ts` (mode local) derrière la même interface — choisi par
  `lib/supabase.ts` selon `lib/instance.ts`. Trois builds : `build` (web,
  clé baked via .env.local), `build:desktop` (RIEN de baked, base `./` —
  l'onboarding trois modes fait le reste), `build:dev-url`.
- `apps/admin-api/server.mjs` : zéro dépendance sauf web-push. Sert aussi
  `GET /instance` (découverte pour les apps natives) et le scanner de rappels
  poussés (60 s).
- `supabase/` : stack self-hosted SANS Kong (Caddy route et fait le CORS
  préflight). Migrations numérotées, appliquées par `scripts/apply-migrations.sh`.
- `apps/desktop` : Tauri v2 (desktop + Android ; iOS bloqué sur l'outillage du
  Mac). Keystore Android dans `apps/desktop/keystore/` (HORS git, précieux :
  toutes les mises à jour doivent être signées avec).

## Pièges payés cash (ne pas repayer)

1. **Caddy** : `rewrite` s'exécute AVANT `uri` ; un seul `uri path_regexp` pour
   composer. Le Caddyfile monté ne se recharge qu'au `restart` du conteneur.
   Un `backdrop-filter` sur un élément en fait le containing block des `fixed`.
2. **RLS** : les policies de `notes` utilisent des expressions directes sur la
   ligne — un lookup de la table dans sa propre policy ne voit pas la ligne en
   cours d'`INSERT…RETURNING`. Écritures liées (note puis items) : séquencées,
   jamais parallèles.
3. **Builds natifs** : base `./` obligatoire (sinon fenêtre blanche, assets
   introuvables sous `tauri://`) ; `tauri-plugin-positioner` est desktop-only ;
   la preuve d'un build est une CAPTURE de la fenêtre (Xvfb + import), jamais
   un exit 0.
4. **SMTP iCloud** : l'identifiant est l'adresse `@icloud.com` du compte, pas
   l'Apple ID gmail — sinon un 550 trompeur à l'envoi. Expéditeur = adresse
   déclarée dans le domaine iCloud.
5. **supabase/postgres** : la version d'image doit matcher celles des services
   (gotrue/realtime) du compose officiel.
6. **PostgREST** : juste après un login, `PGRST303 JWT issued at future`
   (arrondi de seconde) — le store réessaie une fois, ne pas « corriger ».
7. **pnpm 10** bloque les scripts d'install : `pnpm.onlyBuiltDependencies`
   dans le package.json racine (esbuild y est déjà).

## Multi-sessions (machine partagée)

- Les modifications d'ingress du tunnel Cloudflare passent par UNE session à la
  fois — demander à celle qui a le contexte chaud (Orchestration). La purge de
  cache par hostname, elle, est sans danger (dans deploy.sh).
- Tout ce qui touche les Mac/iPhone d'Ulrich passe par la session `ul-ia-cc`
  (tmux macOS). Elle applique « preuve de vie, pas exit 0 » — l'imiter.
- Déclarer ses effets de bord (conteneurs, ports, crons, RAM) avant qu'une
  autre session ne les découvre. Port de Vignette : 8360 sur 172.17.0.1+lo.

## Secrets

`supabase/.env` (mode 600) : jamais dans git, jamais dans un log. Le mot de
passe SMTP est un mot de passe d'application Apple révocable sur
appleid.apple.com. La clé ANON est publique par conception ; la SERVICE_ROLE
ne sort jamais du serveur. Sauvegardes : dump 3h40 + NAS 4h30 + GDrive hebdo.
