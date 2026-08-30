# Les trois modes de Vignette

Au premier lancement d'une app native (macOS, Linux, Android, et bientôt iOS,
Windows), Vignette pose une seule question : **« Où vivent tes notes ? »**

## 1. Vignette officiel

L'instance publique du projet (`vignette.ulrichrozier.com`). Comptes sur
invitation. Tu te connectes, tout est déjà en place : synchro temps réel,
partage, rappels poussés.

## 2. Ma propre instance

Ton serveur auto-hébergé (voir [AUTO-HEBERGEMENT.md](AUTO-HEBERGEMENT.md)).
Donne son adresse à l'app : elle découvre toute seule la configuration via
l'endpoint public `GET /admin-api/instance` (qui expose la clé anon, publique
par conception, c'est la même que dans le bundle web). Une URL, et c'est
branché. Toutes les fonctionnalités du mode officiel, chez toi.

## 3. Local, sans serveur

Aucun compte, aucun serveur, aucune connexion. Les listes vivent dans le
stockage de l'appareil. Tout marche pareil, deck, rappels (notifications
locales), couleurs, corbeille, imports/exports, sauf le partage et la
synchro entre appareils, qui demandent un serveur.

Tu peux commencer en local et te connecter à une instance plus tard : au
premier lancement connecté, Vignette remarque les notes locales de l'appareil
et propose de **les importer dans le compte en un clic** (les données locales
sont archivées sur l'appareil, jamais effacées).

La web app, elle, est toujours servie par une instance : elle est en mode
« officiel/auto-hébergé » par nature.

## Déjà là (desktop)

- **Post-its sur le bureau** : « Épingler sur le bureau » sur n'importe quelle
  note ouvre une fenêtre sans bordure, toujours au premier plan, au bord de
  l'écran, déplaçable par sa poignée, synchronisée en direct avec l'app.
- **Mise à jour en place** : Réglages → Vérifier télécharge et installe la
  nouvelle version signée (AppImage, .app macOS), puis relance. Repli sur le
  téléchargement classique là où l'updater n'existe pas (deb, Android).

## Feuille de route

- **Synchro pair-à-pair sans serveur** : synchroniser le mode local entre ses
  propres appareils sans instance (CRDT + WebRTC/mDNS). Le grand chantier
  local-first.
- **Icônes alternatives natives** : le choix d'icône des Réglages s'applique au
  favicon et à la PWA ; sur macOS/iOS/Android il faudra les mécanismes de
  chaque plateforme (NSApp.applicationIconImage, activity-alias Android,
  alternate icons iOS).
- **Widgets OS** : épingler UNE de ses listes en widget (écran d'accueil
  iOS/Android, bureau/menu bar macOS), la liste choisie parmi toutes,
  cochable depuis le widget.
- **Chiffrement local** : chiffrer le corps des notes au repos en mode local
  (clé dans le trousseau de l'OS).
- **Import Stickies** : importer les fichiers `.stickies` de macOS en gardant
  couleurs et états.
- **iOS** (l'init attend Homebrew/xcodegen sur le Mac) et **Windows**.
