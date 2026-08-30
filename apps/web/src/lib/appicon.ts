/**
 * Icône d'app au choix (réglages) : bascule le favicon, l'icône d'écran
 * d'accueil iOS (apple-touch-icon) et le manifest PWA. Le navigateur lit ces
 * balises au moment de l'installation — l'icône choisie devient celle de
 * l'app installée. (Icônes alternatives des apps NATIVES : feuille de route.)
 */

export const ICON_COLORS = ['blue', 'mint', 'lilac', 'yellow', 'coral', 'rose', 'sand'] as const;
export type IconColor = (typeof ICON_COLORS)[number];

const KEY = 'vignette:appicon';

export function getAppIcon(): IconColor {
  try {
    const saved = localStorage.getItem(KEY) as IconColor | null;
    if (saved && (ICON_COLORS as readonly string[]).includes(saved)) return saved;
  } catch {
    // stockage indisponible
  }
  return 'yellow';
}

function setLink(rel: string, href: string, type?: string) {
  let link = document.querySelector<HTMLLinkElement>(
    type ? `link[rel="${rel}"][type="${type}"]` : `link[rel="${rel}"]`,
  );
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    if (type) link.type = type;
    document.head.appendChild(link);
  }
  link.href = href;
}

export function applyAppIcon(color: IconColor = getAppIcon()) {
  const base = import.meta.env.BASE_URL;
  setLink('icon', `${base}icons/${color}.svg`, 'image/svg+xml');
  setLink('apple-touch-icon', `${base}icons/${color}-180.png`);
  // le manifest par couleur n'existe que côté web (base /app/)
  if (base === '/app/') setLink('manifest', `${base}manifest-${color}.webmanifest`);
}

export function setAppIcon(color: IconColor) {
  try {
    localStorage.setItem(KEY, color);
  } catch {
    // best effort
  }
  applyAppIcon(color);
}
