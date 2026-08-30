/**
 * Configuration d'instance : où vivent les notes.
 * - 'builtin' : la web app servie par sa propre instance (clé baked au build)
 * - 'server'  : instance choisie au premier lancement (apps natives), l'app
 *               découvre la clé anon via GET <url>/admin-api/instance
 * - 'local'   : sans serveur, tout vit dans le stockage de l'appareil
 */

export const OFFICIAL_URL = 'https://vignette.ulrichrozier.com';

export interface InstanceConfig {
  mode: 'builtin' | 'server' | 'local';
  url?: string;
  anonKey?: string;
  /** false = l'instance n'a pas de serveur mail (masquer « mot de passe oublié »). */
  mail?: boolean;
}

const KEY = 'vignette:instance';

export function loadInstance(): InstanceConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as InstanceConfig;
  } catch {
    // stockage indisponible
  }
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (envKey) {
    return {
      mode: 'builtin',
      url: (import.meta.env.VITE_SUPABASE_URL as string) || window.location.origin,
      anonKey: envKey,
    };
  }
  return null; // premier lancement natif → onboarding
}

export function saveInstance(config: InstanceConfig) {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function clearInstance() {
  localStorage.removeItem(KEY);
}

/** Valide une URL d'instance et en découvre la clé anon. Jette si invalide. */
export async function probeInstance(url: string): Promise<InstanceConfig> {
  const base = url.replace(/\/+$/, '');
  const r = await fetch(`${base}/admin-api/instance`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = (await r.json()) as { anonKey?: string; mail?: boolean };
  if (!data.anonKey) throw new Error('instance sans clé');
  return { mode: 'server', url: base, anonKey: data.anonKey, mail: data.mail !== false };
}
