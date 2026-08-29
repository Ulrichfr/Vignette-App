import { describe, expect, it } from 'vitest';
import {
  DOCK_GAP,
  deckNotes,
  needsRebalance,
  positionAtEnd,
  positionBetween,
  rebalance,
} from '../src/deck';
import type { Note } from '../src/types';

function note(partial: Partial<Note> & { id: string }): Note {
  return {
    ownerId: 'u1',
    title: partial.id,
    color: 'blue',
    status: 'active',
    listStyle: 'dashes',
    remindAt: null,
    dockPosition: null,
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
    deletedAt: null,
    ...partial,
  };
}

describe('deckNotes', () => {
  it('trie par position et exclut non-dockées, archivées et supprimées', () => {
    const notes = [
      note({ id: 'b', dockPosition: 2048 }),
      note({ id: 'a', dockPosition: 1024 }),
      note({ id: 'x', dockPosition: null }),
      note({ id: 'arch', dockPosition: 512, status: 'archived' }),
      note({ id: 'del', dockPosition: 256, deletedAt: '2026-08-29T11:00:00Z' }),
    ];
    expect(deckNotes(notes).map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('garde les notes completed dans le deck', () => {
    const notes = [note({ id: 'c', dockPosition: 1024, status: 'completed' })];
    expect(deckNotes(notes)).toHaveLength(1);
  });
});

describe('positionBetween / positionAtEnd', () => {
  it('deck vide → DOCK_GAP', () => {
    expect(positionBetween(null, null)).toBe(DOCK_GAP);
    expect(positionAtEnd([])).toBe(DOCK_GAP);
  });

  it('insère avant la première et après la dernière', () => {
    expect(positionBetween(null, 1024)).toBe(0);
    expect(positionBetween(2048, null)).toBe(2048 + DOCK_GAP);
  });

  it('insère au milieu de deux voisins', () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
  });

  it('positionAtEnd suit la dernière note dockée', () => {
    const notes = [note({ id: 'a', dockPosition: 1024 }), note({ id: 'b', dockPosition: 2048 })];
    expect(positionAtEnd(notes)).toBe(2048 + DOCK_GAP);
  });
});

describe('rebalance', () => {
  it('détecte les positions dégénérées puis renumérote', () => {
    const notes = [
      note({ id: 'a', dockPosition: 1 }),
      note({ id: 'b', dockPosition: 1 + 1e-9 }),
      note({ id: 'c', dockPosition: 2 }),
    ];
    expect(needsRebalance(notes)).toBe(true);
    const positions = rebalance(notes);
    expect(positions.get('a')).toBe(DOCK_GAP);
    expect(positions.get('b')).toBe(2 * DOCK_GAP);
    expect(positions.get('c')).toBe(3 * DOCK_GAP);
  });

  it('ne signale rien pour un deck sain', () => {
    const notes = [note({ id: 'a', dockPosition: 1024 }), note({ id: 'b', dockPosition: 2048 })];
    expect(needsRebalance(notes)).toBe(false);
  });
});
