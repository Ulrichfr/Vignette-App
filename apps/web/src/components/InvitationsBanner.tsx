import { useI18n } from '../i18n';
import { store, useAppState } from '../store';

/** Invitations en attente, affichées comme des petits post-its à accepter. */
export function InvitationsBanner() {
  const { t } = useI18n();
  const state = useAppState();
  if (state.invitations.length === 0) return null;

  return (
    <div className="invitations">
      {state.invitations.map((inv) => (
        <div key={inv.noteId} className="invitation">
          <span className="invitation-text hand">{t.invitationFrom(inv.ownerName, inv.title)}</span>
          <span className="invitation-actions">
            <button
              className="soft-btn"
              onClick={() => void store.respondInvitation(inv.noteId, true)}
            >
              {t.accept}
            </button>
            <button
              className="ghost-btn"
              onClick={() => void store.respondInvitation(inv.noteId, false)}
            >
              {t.decline}
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
