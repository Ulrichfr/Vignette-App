#!/usr/bin/env bash
# Applique les migrations SQL de supabase/migrations/ dans l'ordre, via le conteneur db.
# À lancer une fois la stack up ET le service auth healthy (le schéma auth doit exister).
set -euo pipefail

cd "$(dirname "$0")/.."

for f in migrations/*.sql; do
  echo "→ $f"
  docker exec -i vignette-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <"$f"
done
echo "Migrations appliquées."
