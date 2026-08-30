import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadInstance, type InstanceConfig } from './instance';

/** Client Supabase de l'instance active, null en mode local ou avant onboarding. */
export let supabase: SupabaseClient | null = null;

export let instanceConfig: InstanceConfig | null = null;

export type BootMode = 'ready' | 'local' | 'onboarding';

/** À appeler avant le rendu React. Synchronement, depuis la config stockée. */
export function initSupabase(): BootMode {
  instanceConfig = loadInstance();
  if (!instanceConfig) return 'onboarding';
  if (instanceConfig.mode === 'local') return 'local';
  if (instanceConfig.url && instanceConfig.anonKey) {
    supabase = createClient(instanceConfig.url, instanceConfig.anonKey);
    return 'ready';
  }
  return 'onboarding';
}

export function isLocalMode(): boolean {
  return instanceConfig?.mode === 'local';
}

/** Évalué au chargement du module, avant le store et le rendu. */
export const bootMode: BootMode = initSupabase();
