import type { Note, NoteItem, NoteStatus } from './types';

/** Transitions autorisées. `completed` peut revenir en `active` (décocher). */
const TRANSITIONS: Record<NoteStatus, NoteStatus[]> = {
  active: ['completed', 'archived'],
  completed: ['active', 'archived'],
  archived: ['active'],
};

export function canTransition(from: NoteStatus, to: NoteStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Une note est complète si elle a des items et qu'ils sont tous cochés. */
export function isNoteComplete(items: NoteItem[]): boolean {
  return items.length > 0 && items.every((i) => i.checked);
}

/** Libellé de fraîcheur relative ("23m", "1h", "3d"), pour "edited il y a X". */
export function relativeAge(iso: string, now: Date = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60_000));
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/** Filtre de la vue All Notes. */
export type NotesFilter = 'all' | 'active' | 'archived';

export function filterNotes(notes: Note[], filter: NotesFilter, query = ''): Note[] {
  const q = query.trim().toLowerCase();
  return notes
    .filter((n) => !n.deletedAt)
    .filter((n) => {
      if (filter === 'active') return n.status === 'active' || n.status === 'completed';
      if (filter === 'archived') return n.status === 'archived';
      return true;
    })
    .filter((n) => (q ? n.title.toLowerCase().includes(q) : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
