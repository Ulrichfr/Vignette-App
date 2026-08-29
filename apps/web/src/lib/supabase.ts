import { createClient } from '@supabase/supabase-js';

// En prod, la web app est servie par le même Caddy que l'API : l'origine
// courante suffit. VITE_SUPABASE_URL n'est utile qu'en dev (Vite ≠ Caddy).
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || window.location.origin;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null si l'environnement n'est pas configuré (VITE_SUPABASE_ANON_KEY). */
export const supabase = anonKey ? createClient(url, anonKey) : null;
