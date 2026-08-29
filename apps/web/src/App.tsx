import type { NotesFilter } from '@vignette/core';
import { useState } from 'react';
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
