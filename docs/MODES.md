# Les trois modes de Vignette

Au premier lancement d'une app native (macOS, Linux, Android — et bientôt iOS,
Windows), Vignette pose une seule question : **« Où vivent tes notes ? »**

## 1. Vignette officiel

L'instance publique du projet (`vignette.ulrichrozier.com`). Comptes sur
invitation. Tu te connectes, tout est déjà en place : synchro temps réel,
partage, rappels poussés.

## 2. Ma propre instance

Ton serveur auto-hébergé (voir [AUTO-HEBERGEMENT.md](AUTO-HEBERGEMENT.md)).
Donne son adresse à l'app : elle découvre toute seule la configuration via
l'endpoint public `GET /admin-api/instance` (qui expose la clé anon — publique
par conception, c'est la même que dans le bundle web). Une URL, et c'est
branché. Toutes les fonctionnalités du mode officiel, chez toi.

## 3. Local, sans serveur

Aucun compte, aucun serveur, aucune connexion. Les listes vivent dans le
stockage de l'appareil. Tout marche pareil — deck, rappels (notifications
locales), couleurs, corbeille, imports/exports — sauf le partage et la
synchro entre appareils, qui demandent un serveur.

Tu peux commencer en local et te connecter à une instance plus tard : tes
notes locales restent sur l'appareil (l'import Markdown permet de les
transvaser en attendant une migration en un clic, prévue).

La web app, elle, est toujours servie par une instance : elle est en mode
« officiel/auto-hébergé » par nature.

## Feuille de route

- **Synchro pair-à-pair sans serveur** : synchroniser le mode local entre ses
  propres appareils sans instance (CRDT + WebRTC/mDNS). Le grand chantier
  local-first.
- **Migration locale → instance en un clic** : envoyer ses notes locales vers
  un compte fraîchement connecté.
- **Widgets OS** : épingler UNE de ses listes en widget (écran d'accueil
  iOS/Android, bureau/menu bar macOS) — la liste choisie parmi toutes,
  cochable depuis le widget.
- **Fenêtres post-its sur le bureau** (desktop) : chaque note dockée devient
  une vraie fenêtre frameless always-on-top au bord de l'écran.
- **iOS** (l'init attend Homebrew/xcodegen sur le Mac) et **Windows**.
