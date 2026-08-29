# Vignette

Post-its numériques dockés au bord de l'écran — listes de choses à faire,
multi-compte, partageables et synchronisées. Web + macOS d'abord.

- Design : voir `DESIGN.md` (source de vérité).
- Monorepo pnpm : `packages/core` (modèle métier), `packages/ui` (composants),
  `apps/web` (vignette.ulrichrozier.com), `apps/desktop` (Tauri v2),
  `apps/admin` (back office), `supabase/` (migrations + stack self-hosted).

## Dev

```bash
pnpm install
pnpm test        # tests unitaires
pnpm dev         # web app en local
```
