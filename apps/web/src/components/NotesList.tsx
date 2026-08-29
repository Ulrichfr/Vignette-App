import { filterNotes, relativeAge, type Note, type NotesFilter } from '@vignette/core';
import { colorSpec } from '../colors';
import { itemsOf, useAppState } from '../store';

interface Props {
  filter: NotesFilter;
  query: string;
  selectedId: string | null;
  onFilter: (f: NotesFilter) => void;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
}

const FILTERS: { key: NotesFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
];

function statusBadge(note: Note): { label: string; className: string } {
  if (note.status === 'archived') return { label: 'ARCHIVED', className: 'badge archived' };
  if (note.status === 'completed') return { label: 'DONE', className: 'badge done' };
  return { label: 'ACTIVE', className: 'badge active' };
}

export function NotesList({ filter, query, selectedId, onFilter, onQuery, onSelect }: Props) {
  const state = useAppState();
  const notes = filterNotes(state.notes, filter, query);
  const total = state.notes.filter((n) => !n.deletedAt).length;

  return (
    <section className="list-pane">
      <header className="list-header">
        <h1>All Notes</h1>
        <button className="ghost-btn" title="Import (coming soon)">
          ⤒ Import…
        </button>
      </header>

      <div className="search-row">
        <span className="search-icon">⌕</span>
        <input
          placeholder="Search all notes"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <span className="notes-count">
          {total} note{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'selected' : ''}`}
            onClick={() => onFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="note-rows">
        {notes.map((note) => {
          const spec = colorSpec(note.color);
          const badge = statusBadge(note);
          const preview = itemsOf(state, note.id)
            .map((i) => `- ${i.text}`)
            .join('  ')
            .trim();
          return (
            <button
              key={note.id}
              className={`note-row ${selectedId === note.id ? 'selected' : ''}`}
              onClick={() => onSelect(note.id)}
            >
              <span className="row-check" aria-hidden />
              <span className="row-bar" style={{ background: spec.edge }} />
              <span className="row-main">
                <span className="row-top">
                  <span className="row-title">{note.title || 'Untitled note'}</span>
                  <span className={badge.className}>{badge.label}</span>
                  <span className="row-age">{relativeAge(note.updatedAt)}</span>
                </span>
                <span className="row-preview hand">{preview || '…'}</span>
              </span>
            </button>
          );
        })}
        {notes.length === 0 && <p className="empty-hint">Nothing here — create a note from the deck.</p>}
      </div>
    </section>
  );
}
