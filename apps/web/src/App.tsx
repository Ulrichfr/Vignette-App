import type { NotesFilter } from '@vignette/core';
import { useState } from 'react';
import { Deck } from './components/Deck';
import { NoteDetail } from './components/NoteDetail';
import { NotesList } from './components/NotesList';
import { useAppState } from './store';

export default function App() {
  const state = useAppState();
  const [filter, setFilter] = useState<NotesFilter>('all');
  const [query, setQuery] = useState('');
  const firstNote = state.notes.find((n) => !n.deletedAt);
  const [selectedId, setSelectedId] = useState<string | null>(firstNote?.id ?? null);

  return (
    <div className="app">
      <main className="window">
        <NotesList
          filter={filter}
          query={query}
          selectedId={selectedId}
          onFilter={setFilter}
          onQuery={setQuery}
          onSelect={setSelectedId}
        />
        {selectedId ? (
          <NoteDetail noteId={selectedId} onDeleted={() => setSelectedId(null)} />
        ) : (
          <section className="detail-pane empty">
            <p className="empty-hint">Select a note, or peel a new one from the deck →</p>
          </section>
        )}
      </main>
      <Deck />
    </div>
  );
}
