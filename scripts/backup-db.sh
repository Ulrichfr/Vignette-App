#!/usr/bin/env bash
# Dump applicatif quotidien de la base Vignette (comme hook/plume).
# En plus du snapshot global ~/backup-full-to-nas.sh qui capte le conteneur.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
mkdir -p "$DIR"

STAMP="$(date +%Y%m%d-%H%M)"
docker exec vignette-db pg_dump -U postgres -d postgres --no-owner \
  | gzip > "$DIR/vignette-$STAMP.sql.gz"

# rotation : garde les 14 derniers dumps
ls -1t "$DIR"/vignette-*.sql.gz | tail -n +15 | xargs -r rm --

echo "dump ok : $DIR/vignette-$STAMP.sql.gz"
