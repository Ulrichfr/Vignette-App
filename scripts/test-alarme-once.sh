#!/usr/bin/env bash
# Test UNIQUE de la chaîne d'alerte (validé avec Orchestration) :
# 1) faux « ECHEC test-api » dans le journal → la revue doit sonner (Telegram)
# 2) retrait → la revue doit redevenir silencieuse
# Puis ce script retire sa propre entrée cron. Journal : backups/test-alarme.log
set -uo pipefail

LOG=/home/ul-ia/vignette/backups/test-api.log
OUT=/home/ul-ia/vignette/backups/test-alarme.log

{
  echo "=== test d'alarme $(date) ==="
  echo "$(date) ECHEC test-api (TEST D'ALARME VOLONTAIRE : ignorer, retiré dans 2 min)" >> "$LOG"
  echo "-- revue avec faux échec :"
  bash /home/ul-ia/ulia-ops/revue-invariants.sh 2>&1
  sleep 120
  # retrait de la ligne de test
  grep -v 'TEST D'"'"'ALARME VOLONTAIRE' "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
  echo "-- revue après retrait (doit être silencieuse) :"
  bash /home/ul-ia/ulia-ops/revue-invariants.sh 2>&1
  echo "=== fin du test ==="
} >> "$OUT" 2>&1

# auto-retrait du cron one-shot
crontab -l | grep -v test-alarme-once | crontab -
