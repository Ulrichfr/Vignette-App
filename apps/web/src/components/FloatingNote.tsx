import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { colorSpec } from '../colors';
import { closeFloatingWindow } from '../lib/float';
import { isDesktopNative } from '../lib/update';
import { supabase } from '../lib/supabase';
import { itemsOf, store, useAppState } from '../store';
import { ChecklistEditor } from './ChecklistEditor';

/**
 * Une note seule, rendue dans sa propre fenêtre frameless posée sur le bureau
 * (`?float=<id>`). La bande du haut sert de poignée de déplacement.
 */
export function FloatingNote({ noteId }: { noteId: string }) {
  const { t } = useI18n();
  const state = useAppState();
  const [slow, setSlow] = useState(false);
  const note = state.notes.find((n) => n.id === noteId && !n.deletedAt);

  // cette fenêtre ne passe pas par AuthGate : elle amorce la session elle-même
  // (le mode local est prêt d'office ; en mode serveur, sans ça le store ne
  // démarre jamais et la fenêtre resterait vide — bogue payé cash sur macOS)
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getSession()
      .then(({ data }) => store.setUser(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_e, sess) => void store.setUser(sess?.user.id ?? null),
    );
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (!state.ready) {
    return (
      <div className="float-note float-missing">
        <p className="empty-hint hand">{slow ? t.floatNoSession : t.floatConnecting}</p>
        {isDesktopNative && (
          <button className="ghost-btn" onClick={() => void closeFloatingWindow()}>
            ✕
          </button>
        )}
      </div>
    );
  }
  if (!note) {
    return (
      <div className="float-note float-missing">
        <p className="empty-hint">{t.emptyDetail}</p>
        {isDesktopNative && (
          <button className="ghost-btn" onClick={() => void closeFloatingWindow()}>
            ✕
          </button>
        )}
      </div>
    );
  }

  const spec = colorSpec(note.color);
  return (
    <div className="float-note" style={{ background: spec.base, color: spec.ink }}>
      <header className="float-head" data-tauri-drag-region>
        <input
          className="float-title"
          value={note.title}
          placeholder={t.untitled}
          style={{ color: spec.ink }}
          onChange={(e) => store.rename(note.id, e.target.value)}
        />
        {isDesktopNative && (
          <button
            className="float-close"
            aria-label="✕"
            onClick={() => void closeFloatingWindow()}
          >
            ✕
          </button>
        )}
      </header>
      <div className="float-body">
        <ChecklistEditor
          noteId={note.id}
          items={itemsOf(state, note.id)}
          ink={spec.ink}
          listStyle={note.listStyle}
        />
      </div>
    </div>
  );
}
