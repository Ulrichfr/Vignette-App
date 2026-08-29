import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';
import { store } from '../store';

export function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  // zone membre privée : les comptes se créent depuis le back office
  const [mode] = useState<'signin'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void store.setUser(session?.user.id ?? null);
  }, [session]);

  if (!supabase) {
    return (
      <div className="auth-screen">
        <p className="empty-hint">VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants.</p>
      </div>
    );
  }

  if (checking) return <div className="auth-screen" />;

  if (!session) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);
      const { error: err } =
        mode === 'signin'
          ? await supabase!.auth.signInWithPassword({ email, password })
          : await supabase!.auth.signUp({ email, password });
      setBusy(false);
      if (err) setError(t.authError);
    };

    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={submit}>
          <h1 className="auth-logo">Vignette</h1>
          <p className="auth-tagline hand">{t.tagline}</p>
          <label>
            {t.email}
            <input
              type="email"
              value={email}
              autoComplete="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            {t.password}
            <input
              type="password"
              value={password}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" disabled={busy} type="submit">
            {t.signIn}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

export function signOut() {
  void supabase?.auth.signOut();
}
