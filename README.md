<p align="center">
  <img src="apps/site/assets/icons/icon-192.png" width="96" alt="Icône Vignette">
</p>

<h1 align="center">Vignette</h1>

<p align="center">
  <b>Tes listes, collées au bord de l'écran.</b><br>
  Des post-its numériques dockés en onglets pastel, synchronisés en temps réel,
  partageables par email, open source et auto-hébergés.
</p>

<p align="center">
  <a href="https://vignette.ulrichrozier.com">Site & démo</a> ·
  <a href="https://vignette.ulrichrozier.com/telechargements">Téléchargements</a> ·
  <a href="docs/DEMARRER.md">Démarrer</a> ·
  <a href="docs/MODES.md">Les trois modes</a> ·
  <a href="docs/AUTO-HEBERGEMENT.md">Auto-héberger</a> ·
  <a href="docs/PARTAGE.md">Partager</a>
</p>

![Démo : le deck en action](docs/captures/demo-deck.gif)

## Ce que fait Vignette

- **Le deck**, tes notes vivent en onglets pastel dockés au bord de l'écran et se
  déplient d'une pichenette, avec des animations à ressort.
- **Temps réel**, coche un item sur ton téléphone, il se barre instantanément sur
  ton Mac (Supabase Realtime, mises à jour optimistes).
- **Partage**, invite par email en lecture ou en édition ; l'invitation arrive
  comme un petit post-it jaune, à accepter ou refuser. La RLS Postgres garantit
  l'isolation entre comptes.
- **Rappels « coin corné »**, corne une note avec une échéance, écrite à la main
  sur le pli ; l'onglet frémit et une notification part quand c'est l'heure.
- **Listes vivantes**, tirets manuscrits ou cases à cocher, **gras**, *italique*,
  `code` et liens cliquables, duplication, archives, corbeille restaurable,
  exports Markdown/texte.
- **FR/EN, clair/sombre**, français par défaut, mode sombre où les post-its
  restent des post-its.
- **Trois modes**, l'instance officielle, la tienne (une URL suffit, l'app
  découvre le reste), ou le mode local pur, sans serveur ni compte
  ([docs/MODES.md](docs/MODES.md)).

![Une note dépliée depuis le deck](docs/captures/shot-deck.png)
![Vignette sur iPhone et Android](docs/captures/scene-mobile.png)

## Architecture

Monorepo pnpm :

| Dossier | Rôle |
| --- | --- |
| `packages/core` | Modèle métier TypeScript pur, testé (Vitest) |
| `apps/web` | Web app React + Vite + Framer Motion (zone membre, `/app`) |
| `apps/site` | Site vitrine statique (racine du domaine) |
| `apps/admin` | Back office (comptes, stats, sauvegardes, `/admin`) |
| `apps/admin-api` | API service-role zéro dépendance (Node) |
| `apps/desktop` | App native Tauri v2 (macOS/Windows/Linux, puis iOS/Android) |
| `supabase/` | Stack self-hosted (Postgres + GoTrue + PostgREST + Realtime + Caddy), migrations SQL + RLS |

Le backend est une stack Supabase self-hosted **taillée** : pas de Kong (Caddy
fait le routage et le CORS préflight), pas de Studio ni d'analytics, cinq
conteneurs, ~450 Mo de RAM.

## Démarrer

```bash
git clone https://github.com/Ulrichfr/Vignette-App.git && cd Vignette-App
node supabase/scripts/gen-env.mjs          # secrets (Postgres, JWT, clés)
docker compose -f supabase/docker-compose.yml up -d
./supabase/scripts/apply-migrations.sh     # schéma + RLS
pnpm install && pnpm build                 # web + admin
```

L'app est servie sur `http://127.0.0.1:8360` (site vitrine à la racine, app
membre sur `/app`, back office sur `/admin`). Les inscriptions publiques sont
fermées : crée le premier compte depuis le back office après avoir passé ton
profil en admin (voir [docs/AUTO-HEBERGEMENT.md](docs/AUTO-HEBERGEMENT.md)).

```bash
pnpm test        # tests unitaires du modèle
pnpm dev         # web app en dev (Vite, port 5183)
```

## Licence

[MIT](LICENSE), fait à la main, hébergé à la maison.
