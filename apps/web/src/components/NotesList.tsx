import { filterNotes, relativeAge, type Note, type NotesFilter } from '@vignette/core';
import { colorSpec } from '../colors';
import { setLang, useI18n, type Strings } from '../i18n';
import { cycleTheme, useTheme } from '../theme';
import { itemsOf, useAppState } from '../store';
import { signOut } from './AuthGate';

interface Props {
  filter: NotesFilter;
  query: string;
  selectedId: string | null;
  onFilter: (f: NotesFilter) => void;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
}

function statusBadge(note: Note, t: Strings): { label: string; className: string } {
  if (note.status === 'archived') return { label: t.badgeArchived, className: 'badge archived' };
  if (note.status === 'completed') return { label: t.badgeDone, className: 'badge done' };
  return { label: t.badgeActive, className: 'badge active' };
}

const THEME_ICON = { system: '◐', light: '☀', dark: '☾' } as const;

export function NotesList({ filter, query, selectedId, onFilter, onQuery, onSelect }: Props) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const state = useAppState();
  const notes = filterNotes(state.notes, filter, query);
  const total = state.notes.filter((n) => !n.deletedAt).length;

  const FILTERS: { key: NotesFilter; label: string }[] = [
    { key: 'all', label: t.filterAll },
    { key: 'active', label: t.filterActive },
    { key: 'archived', label: t.filterArchived },
  ];

  return (
    <section className="list-pane">
      <header className="list-header">
        <h1>{t.allNotes}</h1>
        <span className="header-tools">
          <button
            className="ghost-btn icon-btn"
            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button className="ghost-btn icon-btn" title={`Theme: ${theme}`} onClick={cycleTheme}>
            {THEME_ICON[theme]}
          </button>
          <button className="ghost-btn icon-btn" title={t.signOut} onClick={signOut}>
            ⎋
          </button>
        </span>
      </header>

      <div className="search-row">
        <span className="search-icon">⌕</span>
        <input
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <span className="notes-count">{t.notesCount(total)}</span>
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
          const badge = statusBadge(note, t);
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
                  <span className="row-title">{note.title || t.untitled}</span>
                  <span className={badge.className}>{badge.label}</span>
                  <span className="row-age">
                    {relativeAge(note.updatedAt, new Date(), t.ageUnits)}
                  </span>
                </span>
                <span className="row-preview hand">{preview || '…'}</span>
              </span>
            </button>
          );
        })}
        {notes.length === 0 && <p className="empty-hint">{t.emptyList}</p>}
      </div>
    </section>
  );
}
