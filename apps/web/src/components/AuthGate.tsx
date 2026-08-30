import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { bootMode, instanceConfig, supabase } from '../lib/supabase';
import { Onboarding } from './Onboarding';
import { store } from '../store';

export function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  // mode local : pas de compte, pas d'auth, on entre directement
  if (bootMode === 'local') return <>{children}</>;
  // premier lancement natif : choisir son instance
  if (bootMode === 'onboarding') return <Onboarding />;
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  // zone membre privée : les comptes se créent depuis le back office
  const [mode] = useState<'signin'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // vrai après un clic sur le lien « mot de passe oublié » reçu par email
  const [recovery, setRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void store.setUser(session?.user.id ?? null);
  }, [session]);


  if (checking) return <div className="auth-screen" />;

  // formulaire « nouveau mot de passe » après clic sur le lien de l'email
  if (recovery && session) {
    const save = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);
      const { error: err } = await supabase!.auth.updateUser({ password: newPassword });
      setBusy(false);
      if (err) setError(err.message);
      else {
        setInfo(t.passwordSaved);
        setRecovery(false);
      }
    };
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={save}>
          <h1 className="auth-logo"><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />Vignette</h1>
          <p className="auth-tagline hand">{t.tagline}</p>
          <label>
            {t.newPassword}
            <input
              type="password"
              value={newPassword}
              autoComplete="new-password"
              required
              minLength={8}
              autoFocus
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" disabled={busy} type="submit">
            {t.savePassword}
          </button>
        </form>
      </div>
    );
  }

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
          <h1 className="auth-logo"><img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />Vignette</h1>
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
          {info && <p className="auth-info">{info}</p>}
          <button className="auth-submit" disabled={busy} type="submit">
            {t.signIn}
          </button>
          {instanceConfig?.mail !== false && (
            <button
              type="button"
              className="auth-switch"
              onClick={async () => {
                if (!email) {
                  setError(t.authError);
                  return;
                }
                setError(null);
                const { error: err } = await supabase!.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/app/`,
                });
                if (err) setError(err.message);
                else setInfo(t.resetSent);
              }}
            >
              {t.forgotPassword}
            </button>
          )}
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

export function signOut() {
  void supabase?.auth.signOut();
}
