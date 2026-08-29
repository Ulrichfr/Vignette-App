import { describe, expect, it } from 'vitest';
import { noteToMarkdown, noteToText } from '../src/export';
import type { Note, NoteItem } from '../src/types';

const note: Note = {
  id: 'n1',
  ownerId: 'u1',
  title: 'Groceries',
  color: 'mint',
  status: 'active',
  dockPosition: 1024,
  createdAt: '2026-08-29T10:00:00Z',
  updatedAt: '2026-08-29T10:00:00Z',
  deletedAt: null,
};

const items: NoteItem[] = [
  { id: 'i2', noteId: 'n1', position: 2, text: 'dry fruits', checked: false },
  { id: 'i1', noteId: 'n1', position: 1, text: 'apple', checked: true },
];

describe('exports', () => {
  it('markdown : cases à cocher dans l’ordre des positions', () => {
    expect(noteToMarkdown(note, items)).toBe('# Groceries\n\n- [x] apple\n- [ ] dry fruits\n');
  });
  it('texte : ✓ pour coché, · sinon', () => {
    expect(noteToText(note, items)).toBe('Groceries\n✓ apple\n· dry fruits\n');
  });
});
