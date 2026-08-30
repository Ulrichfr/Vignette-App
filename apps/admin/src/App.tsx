import { createClient, type Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || window.location.origin;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = anonKey ? createClient(url, anonKey) : null;

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  displayName: string;
  isAdmin: boolean;
  notes: number;
  trashed: number;
}

interface Stats {
  profiles: number;
  notes: number;
  items: number;
  shares: number;
  pushSubs: number;
}

interface Backup {
  file: string;
  size: number;
  mtime: string;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const fmtSize = (bytes: number) =>
  bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [newEmail, setNewEmail] = useState('');
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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const r = await fetch(`/admin-api${path}`, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (r.status === 403) {
        setForbidden(true);
        throw new Error('forbidden');
      }
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    },
    [session],
  );

  const reload = useCallback(() => {
    if (!session) return;
    void api('/stats').then(setStats).catch(() => {});
    void api('/users').then(setUsers).catch(() => {});
    void api('/backups').then(setBackups).catch(() => {});
  }, [api, session]);

  useEffect(reload, [reload]);

  if (!supabase) return <main className="center">VITE_SUPABASE_ANON_KEY manquant.</main>;
  if (checking) return <main className="center" />;

  if (!session) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const { error: err } = await supabase!.auth.signInWithPassword({ email, password });
      if (err) setError('Connexion impossible.');
    };
    return (
      <main className="center">
        <form className="login" onSubmit={submit}>
          <h1>Vignette · back office</h1>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="err">{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="center">
        <div className="login">
          <h1>Accès réservé</h1>
          <p>Ce compte n'est pas administrateur.</p>
          <button onClick={() => supabase!.auth.signOut()}>Se déconnecter</button>
        </div>
      </main>
    );
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/users', { method: 'POST', body: JSON.stringify({ email: newEmail, password: newPassword }) });
      setNewEmail('');
      setNewPassword('');
      reload();
    } catch {
      alert('Création impossible (email déjà pris ? mot de passe trop court ?)');
    }
  };

  const resetPassword = async (u: AdminUser) => {
    const password = prompt(`Nouveau mot de passe pour ${u.email} (≥ 8 caractères) :`);
    if (!password) return;
    try {
      await api(`/users/${u.id}/password`, { method: 'PUT', body: JSON.stringify({ password }) });
      alert('Mot de passe remplacé. Transmets-le par un canal sûr.');
    } catch {
      alert('Échec (trop court ?).');
    }
  };

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(`Supprimer définitivement le compte ${u.email} et toutes ses notes ?`)) return;
    try {
      await api(`/users/${u.id}`, { method: 'DELETE' });
      reload();
    } catch {
      alert('Suppression impossible.');
    }
  };

  return (
    <main className="dash">
      <header>
        <h1>Vignette · back office</h1>
        <button className="ghost" onClick={() => supabase!.auth.signOut()}>Se déconnecter</button>
      </header>

      <div className="cards">
        <div className="card" style={{ background: '#bcd9f8' }}><b>{stats?.profiles ?? '…'}</b><span>comptes</span></div>
        <div className="card" style={{ background: '#bfe8cf' }}><b>{stats?.notes ?? '…'}</b><span>notes</span></div>
        <div className="card" style={{ background: '#ddcff6' }}><b>{stats?.items ?? '…'}</b><span>items</span></div>
        <div className="card" style={{ background: '#f8df7c' }}><b>{stats?.shares ?? '…'}</b><span>partages</span></div>
        <div className="card" style={{ background: '#f5a896' }}><b>{stats?.pushSubs ?? '…'}</b><span>abonnements push</span></div>
      </div>

      <section>
        <h2>Comptes</h2>
        <form className="create" onSubmit={createUser}>
          <input type="email" placeholder="email@exemple.fr" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          <input type="text" placeholder="mot de passe (≥ 8)" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <button type="submit">Créer le compte</button>
        </form>
        <table>
          <thead>
            <tr><th>Email</th><th>Nom</th><th>Notes</th><th>Créé</th><th>Dernière connexion</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email} {u.isAdmin && <em className="tag">admin</em>}</td>
                <td>{u.displayName}</td>
                <td>{u.notes}{u.trashed > 0 ? ` (${u.trashed} corbeille)` : ''}</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td>{fmtDate(u.lastSignInAt)}</td>
                <td>
                  <button className="ghost" onClick={() => void resetPassword(u)}>Mot de passe</button>
                  {!u.isAdmin && <button className="danger" onClick={() => void deleteUser(u)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Sauvegardes</h2>
        {backups.length === 0 ? (
          <p className="muted">Aucun dump dans <code>backups/</code> pour l'instant (cron à 3h40).</p>
        ) : (
          <table>
            <thead><tr><th>Fichier</th><th>Taille</th><th>Date</th></tr></thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.file}><td>{b.file}</td><td>{fmtSize(b.size)}</td><td>{fmtDate(b.mtime)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
