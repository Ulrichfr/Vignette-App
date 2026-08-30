import { isDue, isItemDue, type NotesFilter } from '@vignette/core';
import { useEffect, useRef, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { Deck } from './components/Deck';
import { InvitationsBanner } from './components/InvitationsBanner';
import { MigrationBanner } from './components/MigrationBanner';
import { NoteDetail } from './components/NoteDetail';
import { NotesList } from './components/NotesList';
import { useI18n } from './i18n';
import { ensurePushSubscription } from './lib/push';
import { checkForUpdate, isDesktopNative, isNative, openExternal, type UpdateInfo } from './lib/update';
import { store, useAppState } from './store';

function Workspace() {
  const { t } = useI18n();
  const state = useAppState();
  const [filter, setFilter] = useState<NotesFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [undoNoteId, setUndoNoteId] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selected = selectedId ?? state.notes.find((n) => !n.deletedAt)?.id ?? null;

  const noteDeleted = (id: string) => {
    setSelectedId(null);
    setUndoNoteId(id);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoNoteId(null), 8000);
  };

  // tray / raccourci global natif : « nouvelle note » depuis n'importe où
  useEffect(() => {
    if (!isDesktopNative) return;
    let unlisten: (() => void) | undefined;
    void import('@tauri-apps/api/event').then(({ listen }) =>
      listen('vignette://nouvelle-note', () => setSelectedId(store.createNote())).then((u) => {
        unlisten = u;
      }),
    );
    return () => unlisten?.();
  }, []);

  // nouvelle version publiée ? (démarrage différé + toutes les 6 h, silencieux si injoignable)
  useEffect(() => {
    const check = () => checkForUpdate().then(setUpdateInfo).catch(() => {});
    const first = setTimeout(check, 8_000);
    const id = setInterval(check, 6 * 3_600_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  // raccourcis clavier : n = nouvelle note, / = recherche, Échap = fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing =
        el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
      if (e.key === 'Escape') {
        if (typing) el.blur();
        else setSelectedId(null);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'n') {
        e.preventDefault();
        setSelectedId(store.createNote());
      } else if (e.key === '/') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('.search-row input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // abonnement push (rappels app fermée) dès que la permission est là
  useEffect(() => {
    if (state.ready && store.currentUserId) {
      void ensurePushSubscription(store.currentUserId);
    }
  }, [state.ready]);

  // rappels échus → une notification système par note (tant que l'app est ouverte)
  const notified = useRef(new Set<string>());
  useEffect(() => {
    const tick = () => {
      const alive = new Set(
        state.notes.filter((n) => !n.deletedAt && n.status !== 'archived').map((n) => n.id),
      );
      for (const n of state.notes) {
        if (isDue(n) && !notified.current.has(n.id)) {
          notified.current.add(n.id);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Vignette — ${n.title || '…'}`, { body: t.reminderDue });
          }
        }
      }
      for (const i of state.items) {
        if (alive.has(i.noteId) && isItemDue(i) && !notified.current.has(i.id)) {
          notified.current.add(i.id);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Vignette — ${i.text || '…'}`, { body: t.reminderDue });
          }
        }
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [state.notes, t]);

  return (
    <div className={`app ${selectedId ? 'detail-open' : ''}`}>
      <InvitationsBanner />
      <MigrationBanner />
      <main className="window">
        <NotesList
          filter={filter}
          query={query}
          selectedId={selected}
          onFilter={setFilter}
          onQuery={setQuery}
          onSelect={setSelectedId}
        />
        {selected ? (
          <NoteDetail
            noteId={selected}
            onDeleted={() => noteDeleted(selected)}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <section className="detail-pane empty">
            <p className="empty-hint">{t.emptyDetail}</p>
          </section>
        )}
      </main>
      <Deck />
      {updateInfo && !updateDismissed && !undoNoteId && (
        <div className="undo-toast update-toast" role="status">
          <span>{t.updateAvailable(updateInfo.version)}</span>
          <button
            onClick={() =>
              isNative ? void openExternal(updateInfo.url) : window.location.reload()
            }
          >
            {isNative ? t.updateDownload : t.updateReload}
          </button>
          <button aria-label="✕" onClick={() => setUpdateDismissed(true)}>
            ✕
          </button>
        </div>
      )}
      {undoNoteId && (
        <div className="undo-toast" role="status">
          <span>{t.deletedToast}</span>
          <button
            onClick={() => {
              store.restore(undoNoteId);
              setSelectedId(undoNoteId);
              setUndoNoteId(null);
            }}
          >
            {t.undo}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <Workspace />
    </AuthGate>
  );
}
