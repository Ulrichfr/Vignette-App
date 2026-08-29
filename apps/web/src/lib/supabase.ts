import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null si l'environnement n'est pas configuré (VITE_SUPABASE_URL / _ANON_KEY). */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
