import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { store, type NoteMember } from '../store';

/** Panneau de partage (propriétaire) : invitation par email + membres actuels. */
export function SharePanel({ noteId }: { noteId: string }) {
  const { t } = useI18n();
  const [members, setMembers] = useState<NoteMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => void store.members(noteId).then(setMembers);

  useEffect(reload, [noteId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await store.invite(noteId, email, role);
    setBusy(false);
    if (err) {
      setError(t.shareError);
    } else {
      setEmail('');
      reload();
    }
  };

  return (
    <div className="share-panel">
      <form className="share-form" onSubmit={submit}>
        <input
          type="email"
          required
          placeholder={t.shareEmailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}>
          <option value="editor">{t.roleEditor}</option>
          <option value="viewer">{t.roleViewer}</option>
        </select>
        <button className="soft-btn" disabled={busy} type="submit">
          {t.invite}
        </button>
      </form>
      {error && <p className="share-error">{error}</p>}
      {members.length > 0 && (
        <ul className="share-members">
          {members.map((m) => (
            <li key={m.userId}>
              <span className="share-name">{m.displayName}</span>
              <span className="share-role">
                {m.role === 'editor' ? t.roleEditor : t.roleViewer}
                {!m.accepted && ` · ${t.pending}`}
              </span>
              <button
                className="share-revoke"
                onClick={() => {
                  void store.revoke(noteId, m.userId).then(reload);
                }}
              >
                {t.revoke}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
