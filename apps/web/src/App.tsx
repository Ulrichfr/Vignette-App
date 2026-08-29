import { isDue, isItemDue, type NotesFilter } from '@vignette/core';
import { useEffect, useRef, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { Deck } from './components/Deck';
import { InvitationsBanner } from './components/InvitationsBanner';
import { NoteDetail } from './components/NoteDetail';
import { NotesList } from './components/NotesList';
import { useI18n } from './i18n';
import { useAppState } from './store';

function Workspace() {
  const { t } = useI18n();
  const state = useAppState();
  const [filter, setFilter] = useState<NotesFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ?? state.notes.find((n) => !n.deletedAt)?.id ?? null;

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
            onDeleted={() => setSelectedId(null)}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <section className="detail-pane empty">
            <p className="empty-hint">{t.emptyDetail}</p>
          </section>
        )}
      </main>
      <Deck />
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
