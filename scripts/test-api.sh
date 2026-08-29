#!/usr/bin/env bash
# Tests d'intégration API/RLS contre une stack locale qui tourne.
# Crée deux comptes jetables, déroule le scénario complet (CRUD, isolation,
# partage, droits editor), puis nettoie. Échoue au premier invariant violé.
set -euo pipefail

cd "$(dirname "$0")/.."
source supabase/.env
API=${API:-http://127.0.0.1:8360}
SFX=$RANDOM$RANDOM
A_EMAIL="test-a-$SFX@vignette.local"
B_EMAIL="test-b-$SFX@vignette.local"
PASS="motdepasse-test-api-1"
FAILED=0

svc=(-H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "Content-Type: application/json")

say() { printf '%-58s' "$1"; }
ok() { echo "ok"; }
ko() { echo "ÉCHEC ($1)"; FAILED=1; }

jqpy() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }

cleanup() {
  for id in ${A_ID:-} ${B_ID:-}; do
    curl -s -X DELETE "$API/auth/v1/admin/users/$id" "${svc[@]}" -o /dev/null || true
  done
}
trap cleanup EXIT

# comptes jetables (inscriptions publiques fermées → API admin)
A_ID=$(curl -s -X POST "$API/auth/v1/admin/users" "${svc[@]}" -d "{\"email\":\"$A_EMAIL\",\"password\":\"$PASS\",\"email_confirm\":true}" | jqpy 'd["id"]')
B_ID=$(curl -s -X POST "$API/auth/v1/admin/users" "${svc[@]}" -d "{\"email\":\"$B_EMAIL\",\"password\":\"$PASS\",\"email_confirm\":true}" | jqpy 'd["id"]')

login() {
  curl -s -X POST "$API/auth/v1/token?grant_type=password" -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$PASS\"}" | jqpy 'd["access_token"]'
}
TA=$(login "$A_EMAIL")
TB=$(login "$B_EMAIL")
ha=(-H "apikey: $ANON_KEY" -H "Authorization: Bearer $TA" -H "Content-Type: application/json")
hb=(-H "apikey: $ANON_KEY" -H "Authorization: Bearer $TB" -H "Content-Type: application/json")

say "insert note + RETURNING"
NID=$(curl -s -X POST "$API/rest/v1/notes" "${ha[@]}" -H "Prefer: return=representation" \
  -d "{\"owner_id\":\"$A_ID\",\"title\":\"note-test\",\"color\":\"mint\"}" | jqpy 'd[0]["id"]') && ok || ko "insert"

say "insert item"
IID=$(curl -s -X POST "$API/rest/v1/note_items" "${ha[@]}" -H "Prefer: return=representation" \
  -d "{\"note_id\":\"$NID\",\"position\":1024,\"text\":\"item-test\"}" | jqpy 'd[0]["id"]') && ok || ko "item"

say "isolation : B ne voit rien"
N=$(curl -s "$API/rest/v1/notes?select=id" "${hb[@]}" | jqpy 'len(d)')
[ "$N" = "0" ] && ok || ko "B voit $N note(s)"

say "B ne peut pas insérer chez A"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/rest/v1/notes" "${hb[@]}" \
  -d "{\"owner_id\":\"$A_ID\",\"title\":\"intrusion\"}")
[ "$CODE" = "403" ] || [ "$CODE" = "401" ] && ok || ko "http $CODE"

say "invitation (editor) via RPC"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/rest/v1/rpc/invite_to_note" "${ha[@]}" \
  -d "{\"nid\":\"$NID\",\"invitee_email\":\"$B_EMAIL\",\"share_role\":\"editor\"}")
[ "$CODE" = "204" ] || [ "$CODE" = "200" ] && ok || ko "http $CODE"

say "avant acceptation, B ne voit toujours rien"
N=$(curl -s "$API/rest/v1/notes?select=id" "${hb[@]}" | jqpy 'len(d)')
[ "$N" = "0" ] && ok || ko "B voit $N note(s)"

say "B accepte, voit la note"
curl -s -X POST "$API/rest/v1/rpc/respond_invitation" "${hb[@]}" -d "{\"nid\":\"$NID\",\"accept\":true}" -o /dev/null
N=$(curl -s "$API/rest/v1/notes?select=id" "${hb[@]}" | jqpy 'len(d)')
[ "$N" = "1" ] && ok || ko "B voit $N note(s)"

say "B (editor) modifie le titre"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$API/rest/v1/notes?id=eq.$NID" "${hb[@]}" -d '{"title":"modifiée par B"}')
[ "$CODE" = "204" ] && ok || ko "http $CODE"

say "B ne peut PAS supprimer la note"
curl -s -X DELETE "$API/rest/v1/notes?id=eq.$NID" "${hb[@]}" -o /dev/null
STILL=$(curl -s "$API/rest/v1/notes?id=eq.$NID&select=id" "${ha[@]}" | jqpy 'len(d)')
[ "$STILL" = "1" ] && ok || ko "note supprimée par un editor"

say "A voit la modification de B"
TITLE=$(curl -s "$API/rest/v1/notes?id=eq.$NID&select=title" "${ha[@]}" | jqpy 'd[0]["title"]')
[ "$TITLE" = "modifiée par B" ] && ok || ko "titre=$TITLE"

echo
if [ "$FAILED" = "0" ]; then
  echo "✓ Tous les invariants API/RLS tiennent."
else
  echo "✗ Au moins un invariant est violé."
  exit 1
fi
