import { useI18n } from '../i18n';
import { colorSpec } from '../colors';
import { closeFloatingWindow } from '../lib/float';
import { isDesktopNative } from '../lib/update';
import { itemsOf, store, useAppState } from '../store';
import { ChecklistEditor } from './ChecklistEditor';

/**
 * Une note seule, rendue dans sa propre fenêtre frameless posée sur le bureau
 * (`?float=<id>`). La bande du haut sert de poignée de déplacement.
 */
export function FloatingNote({ noteId }: { noteId: string }) {
  const { t } = useI18n();
  const state = useAppState();
  const note = state.notes.find((n) => n.id === noteId && !n.deletedAt);

  if (!state.ready) return null;
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
