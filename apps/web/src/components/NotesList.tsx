import {
  filterNotes,
  parseImport,
  relativeAge,
  stripInline,
  type Note,
  type NotesFilter,
} from '@vignette/core';
import { useRef } from 'react';
import { colorSpec } from '../colors';
import { setLang, useI18n, type Strings } from '../i18n';
import { cycleTheme, useTheme } from '../theme';
import { itemsOf, store, useAppState } from '../store';
import { signOut } from './AuthGate';
import { IcExport, IcImport, IcMoon, IcSearch, IcSignOut, IcSun, IcSystem } from './icons';
import { buildBackup, parseBackup } from '../lib/backup';

interface Props {
  filter: NotesFilter;
  query: string;
  selectedId: string | null;
  onFilter: (f: NotesFilter) => void;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
}

function statusBadge(note: Note, t: Strings): { label: string; className: string } {
  if (note.deletedAt) return { label: t.badgeTrash, className: 'badge trash' };
  if (note.status === 'archived') return { label: t.badgeArchived, className: 'badge archived' };
  if (note.status === 'completed') return { label: t.badgeDone, className: 'badge done' };
  return { label: t.badgeActive, className: 'badge active' };
}

const THEME_ICON = { system: <IcSystem />, light: <IcSun />, dark: <IcMoon /> } as const;

export function NotesList({ filter, query, selectedId, onFilter, onQuery, onSelect }: Props) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const state = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);

  const importFiles = async (files: FileList | null) => {
    if (!files) return;
    let lastId: string | null = null;
    for (const file of Array.from(files)) {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const backup = parseBackup(text);
          store.importBackup(backup.notes, backup.items);
        } catch {
          console.warn('vignette: sauvegarde illisible', file.name);
        }
        continue;
      }
      const parsed = parseImport(text, file.name.replace(/\.(md|txt)$/i, ''));
      lastId = store.createNoteWithItems(parsed.title, parsed.items);
    }
    if (lastId) onSelect(lastId);
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportAll = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(
      new Blob([buildBackup(state.notes, state.items)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `vignette-sauvegarde-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const notes = filterNotes(state.notes, filter, query, state.items);
  const total = state.notes.filter((n) => !n.deletedAt).length;

  const trashCount = state.notes.filter((n) => n.deletedAt).length;
  const FILTERS: { key: NotesFilter; label: string }[] = [
    { key: 'all', label: t.filterAll },
    { key: 'active', label: t.filterActive },
    { key: 'archived', label: t.filterArchived },
    ...(trashCount > 0 ? [{ key: 'trash' as NotesFilter, label: t.filterTrash }] : []),
  ];

  return (
    <section className="list-pane">
      <header className="list-header">
        <h1>{t.allNotes}</h1>
        <span className="header-tools">
          <button className="ghost-btn icon-btn" title={t.import} onClick={() => fileRef.current?.click()}>
            <IcImport />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt,.json,text/markdown,text/plain,application/json"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => void importFiles(e.target.files)}
          />
          <button className="ghost-btn icon-btn" title={t.backupExport} onClick={exportAll}>
            <IcExport />
          </button>
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
            <IcSignOut />
          </button>
        </span>
      </header>

      <div className="search-row">
        <span className="search-icon"><IcSearch /></span>
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
            .map((i) => `- ${stripInline(i.text)}`)
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
