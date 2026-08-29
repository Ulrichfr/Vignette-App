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

export interface AgeUnits {
  now: string;
  m: string;
  h: string;
  d: string;
}

const EN_UNITS: AgeUnits = { now: 'now', m: 'm', h: 'h', d: 'd' };

/** Libellé de fraîcheur relative ("23m", "1h", "3d"), unités localisables. */
export function relativeAge(iso: string, now: Date = new Date(), units: AgeUnits = EN_UNITS): string {
  const ms = now.getTime() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60_000));
  if (min < 1) return units.now;
  if (min < 60) return `${min}${units.m}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}${units.h}`;
  const d = Math.floor(h / 24);
  return `${d}${units.d}`;
}

/** Vrai si le rappel de la note est échu (et la note encore vivante). */
export function isDue(note: Note, now: Date = new Date()): boolean {
  return (
    note.remindAt !== null &&
    !note.deletedAt &&
    note.status !== 'archived' &&
    new Date(note.remindAt).getTime() <= now.getTime()
  );
}

/** Vrai si le rappel d'un item est échu (item non coché). */
export function isItemDue(item: NoteItem, now: Date = new Date()): boolean {
  return item.remindAt !== null && !item.checked && new Date(item.remindAt).getTime() <= now.getTime();
}

/** Filtre de la vue All Notes. `trash` = notes soft-supprimées, restaurables. */
export type NotesFilter = 'all' | 'active' | 'archived' | 'trash';

export function filterNotes(notes: Note[], filter: NotesFilter, query = ''): Note[] {
  const q = query.trim().toLowerCase();
  return notes
    .filter((n) => (filter === 'trash' ? n.deletedAt !== null : !n.deletedAt))
    .filter((n) => {
      if (filter === 'active') return n.status === 'active' || n.status === 'completed';
      if (filter === 'archived') return n.status === 'archived';
      return true;
    })
    .filter((n) => (q ? n.title.toLowerCase().includes(q) : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
