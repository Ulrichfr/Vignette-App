// Vérification de mise à jour.
//
// Le site officiel publie un manifeste statique `/dl/latest.json` (version,
// URLs par plateforme, notes). Les apps natives le consultent au démarrage et
// depuis les Réglages ; la web app s'en sert pour proposer un rechargement.
// La mise à jour EN PLACE (updater Tauri signé) est en feuille de route ;
// ici on détecte, on informe et on mène au bon binaire.

export const APP_VERSION: string = __APP_VERSION__;

const LATEST_URL = 'https://vignette.ulrichrozier.com/dl/latest.json';

export interface UpdateInfo {
  version: string;
  date?: string;
  notes?: { fr?: string; en?: string };
  url: string; // téléchargement pour CETTE plateforme (ou page de téléchargements)
}

interface LatestManifest {
  version: string;
  date?: string;
  notes?: { fr?: string; en?: string };
  page?: string;
  platforms?: Record<string, { url: string }>;
}

export const isNative = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Desktop natif = updater en place possible (pas de support Android). */
export const isDesktopNative = isNative && !/Android/i.test(navigator.userAgent);

export interface InPlaceUpdate {
  version: string;
  body?: string;
  install: (onProgress: (pct: number | null) => void) => Promise<void>;
  restart: () => Promise<void>;
}

/**
 * Mise à jour EN PLACE via l'updater Tauri signé (AppImage, .app macOS).
 * Jette si indisponible (deb, plateforme absente du manifeste…), l'appelant
 * se replie alors sur le flux latest.json + téléchargement.
 */
export async function checkForUpdateInPlace(): Promise<InPlaceUpdate | null> {
  const { check } = await import('@tauri-apps/plugin-updater');
  const update = await check();
  if (!update) return null;
  return {
    version: update.version,
    body: update.body ?? undefined,
    install: async (onProgress) => {
      let total = 0;
      let got = 0;
      await update.downloadAndInstall((e) => {
        if (e.event === 'Started') total = e.data.contentLength ?? 0;
        else if (e.event === 'Progress') {
          got += e.data.chunkLength;
          onProgress(total ? Math.round((got / total) * 100) : null);
        } else if (e.event === 'Finished') onProgress(100);
      });
    },
    restart: async () => {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    },
  };
}

/** `1.2.10` > `1.2.9` ; tolère des longueurs différentes. */
export function newerThan(candidate: string, current: string): boolean {
  const a = candidate.split('.').map((x) => parseInt(x, 10) || 0);
  const b = current.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

function platformKey(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/Mac/i.test(ua)) return 'macos';
  if (/Win/i.test(ua)) return 'windows';
  return 'linux-appimage';
}

/** null si à jour (ou manifeste injoignable, on ne dérange jamais pour ça). */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const r = await fetch(`${LATEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  const m = (await r.json()) as LatestManifest;
  if (!m.version || !newerThan(m.version, APP_VERSION)) return null;
  const page = m.page ?? 'https://vignette.ulrichrozier.com/telechargements.html';
  return {
    version: m.version,
    date: m.date,
    notes: m.notes,
    url: m.platforms?.[platformKey()]?.url ?? page,
  };
}

/** Ouvre un lien hors de l'app : plugin opener en natif, nouvel onglet sur le web. */
export async function openExternal(url: string): Promise<void> {
  if (isNative) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
