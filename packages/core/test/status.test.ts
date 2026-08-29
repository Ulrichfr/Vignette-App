import { describe, expect, it } from 'vitest';
import { canTransition, filterNotes, isNoteComplete, relativeAge } from '../src/status';
import type { Note, NoteItem } from '../src/types';

function note(partial: Partial<Note> & { id: string }): Note {
  return {
    ownerId: 'u1',
    title: partial.id,
    color: 'blue',
    status: 'active',
    dockPosition: null,
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
    deletedAt: null,
    ...partial,
  };
}

const item = (checked: boolean, i = 0): NoteItem => ({
  id: `i${i}`,
  noteId: 'n1',
  position: i,
  text: 'x',
  checked,
});

describe('canTransition', () => {
  it('autorise les allers-retours prévus', () => {
    expect(canTransition('active', 'completed')).toBe(true);
    expect(canTransition('completed', 'active')).toBe(true);
    expect(canTransition('archived', 'active')).toBe(true);
  });
  it('interdit archived → completed', () => {
    expect(canTransition('archived', 'completed')).toBe(false);
  });
});

describe('isNoteComplete', () => {
  it('vide → incomplète, tous cochés → complète', () => {
    expect(isNoteComplete([])).toBe(false);
    expect(isNoteComplete([item(true), item(false, 1)])).toBe(false);
    expect(isNoteComplete([item(true), item(true, 1)])).toBe(true);
  });
});

describe('relativeAge', () => {
  const now = new Date('2026-08-29T12:00:00Z');
  it('minutes, heures, jours', () => {
    expect(relativeAge('2026-08-29T11:37:00Z', now)).toBe('23m');
    expect(relativeAge('2026-08-29T09:00:00Z', now)).toBe('3h');
    expect(relativeAge('2026-08-26T12:00:00Z', now)).toBe('3d');
    expect(relativeAge('2026-08-29T11:59:40Z', now)).toBe('now');
  });
});

describe('filterNotes', () => {
  const notes = [
    note({ id: 'Office', status: 'active', updatedAt: '2026-08-29T11:00:00Z' }),
    note({ id: 'Groceries', status: 'completed', updatedAt: '2026-08-29T10:00:00Z' }),
    note({ id: 'Old', status: 'archived', updatedAt: '2026-08-28T10:00:00Z' }),
    note({ id: 'Gone', deletedAt: '2026-08-29T09:00:00Z' }),
  ];

  it('all exclut seulement les supprimées, tri par updatedAt desc', () => {
    expect(filterNotes(notes, 'all').map((n) => n.id)).toEqual(['Office', 'Groceries', 'Old']);
  });
  it('active inclut completed, archived isole les archivées', () => {
    expect(filterNotes(notes, 'active').map((n) => n.id)).toEqual(['Office', 'Groceries']);
    expect(filterNotes(notes, 'archived').map((n) => n.id)).toEqual(['Old']);
  });
  it('recherche insensible à la casse sur le titre', () => {
    expect(filterNotes(notes, 'all', 'groc').map((n) => n.id)).toEqual(['Groceries']);
  });
});
