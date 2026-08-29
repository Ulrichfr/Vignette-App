# Vignette — Design System

Source de vérité du design. Toute décision visuelle nouvelle se prend ici d'abord.

## Intention

Des post-its numériques qui donnent envie de les toucher : papier pastel, écriture
manuscrite, et un geste signature — les notes vivent **dockées au bord de l'écran
comme des onglets** et se déplient d'une pichenette. Rendu premium et « natif » :
peu de chrome, beaucoup de matière, des animations physiques (springs), jamais de
transition linéaire.

## Palette

### Couleurs de notes (pastel, d'après les maquettes)

| Token          | Hex       | Usage                     |
| -------------- | --------- | ------------------------- |
| `note-blue`    | `#BCD9F8` | bleu ciel (défaut)        |
| `note-mint`    | `#BFE8CF` | vert menthe               |
| `note-lilac`   | `#DDCFF6` | lilas                     |
| `note-yellow`  | `#F8DF7C` | jaune post-it             |
| `note-coral`   | `#F5A896` | corail                    |
| `note-rose`    | `#F7C8DC` | rose                      |
| `note-sand`    | `#EBDCC4` | sable                     |

Chaque couleur a deux dérivés calculés : `-edge` (bande latérale / onglet, saturée
+8 %, assombrie 6 %) et `-ink` (texte sur la note : mélange 80 % `ink` + 20 % teinte).
L'utilisateur peut définir des couleurs custom ; les dérivés sont calculés en OKLCH
pour rester harmonieux.

### Neutres

| Token        | Clair     | Sombre    | Usage                          |
| ------------ | --------- | --------- | ------------------------------ |
| `paper`      | `#F2EFE8` | `#1E1E22` | fond des panneaux (crème)      |
| `paper-2`    | `#E9E5DC` | `#28282E` | fonds secondaires, recherche   |
| `ink`        | `#26262B` | `#ECEAE4` | texte principal                |
| `ink-soft`   | `#6E6C66` | `#9C9AA0` | texte secondaire, méta         |
| `line`       | `#DCD8CD` | `#36363E` | séparateurs, hairlines         |

Les couleurs de notes ne changent **pas** en thème sombre (un post-it reste un
post-it) ; seul leur `-ink` s'ajuste.

## Typographie

- **UI** : `Inter` (embarquée), fallback system-ui. Titres de notes en 600,
  libellés d'onglets en 600 + `letter-spacing: 0.08em` + petites capitales.
- **Contenu manuscrit** : `Caveat` (embarquée), 1.35rem minimum — c'est la voix
  du produit, tout le contenu saisi par l'utilisateur est rendu en manuscrit.
- Méta (badges ACTIVE/ARCHIVED, timestamps) : UI 11px, 500, `ink-soft`.

## Formes & matière

- Rayons : notes 16px, panneaux 20px, badges/boutons 8px.
- Ombres : deux couches douces (`0 1px 2px rgb(0 0 0 / .06), 0 8px 24px rgb(0 0 0 / .10)`),
  jamais d'ombre dure. Une note « soulevée » (drag) passe à 32px de flou.
- L'onglet docké porte une **ligne de perforation** (pointillés verticaux) entre
  le bord-libellé et le corps de la note — signature visuelle des maquettes.

## Motion

Physique par défaut : spring `stiffness 420, damping 34, mass 0.9` (via Framer Motion).

- **Dépliage d'un onglet** : la note glisse depuis le bord avec un léger
  dépassement (spring), le libellé vertical reste solidaire (effet « tirette »).
- **Peel** (création/suppression) : rotation 2-3° + scale 0.96 → 1, origine dans
  le coin supérieur du bord docké.
- **Réordonnancement du deck** : les onglets s'écartent en spring pendant le drag.
- **Survol** : un onglet docké sort de 8px (teaser) en 120ms ease-out — seule
  exception non-spring.
- Respecter `prefers-reduced-motion` : tout passe en fondu 150ms.

## Voix de l'interface

Sobre et concrète (« Mark complete », « In the deck »), bilingue FR/EN à terme,
jamais d'exclamation. Les états vides invitent au geste (« Glissez une note sur
le bord pour la garder sous la main »).
