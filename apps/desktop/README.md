# Vignette : app native (Tauri v2)

Coque native autour de la web app (`apps/web`), une seule base de code pour
macOS, Windows, Linux, iOS et Android.

## Prérequis

- [Rust](https://rustup.rs) + les prérequis Tauri de ta plateforme
  (<https://tauri.app/start/prerequisites/>)
- macOS + Xcode pour iOS ; Android Studio + NDK pour Android

## Développer

```bash
pnpm install
cd apps/desktop
pnpm tauri dev          # desktop (lance aussi le dev server web)
pnpm tauri ios init && pnpm tauri ios dev        # iOS (sur Mac)
pnpm tauri android init && pnpm tauri android dev
```

Avant le premier build, génère les icônes natives depuis l'icône du projet :

```bash
pnpm tauri icon ../site/assets/icons/icon-1024.png
```

## Feuille de route native

- [ ] Fenêtres post-it dockées au bord de l'écran (frameless, always-on-top,
      `tauri-plugin-positioner`) : le geste signature, par-dessus le bureau
- [ ] Icône barre de menus / tray avec bascule du deck
- [ ] Raccourci global « nouvelle note »
- [ ] Notifications natives pour les rappels (plugin déjà branché)
- [ ] Updater signé
