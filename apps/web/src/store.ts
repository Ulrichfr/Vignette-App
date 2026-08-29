import { useSyncExternalStore } from 'react';
import {
  positionAtEnd,
  type Note,
  type NoteColor,
  type NoteItem,
  type NoteStatus,
} from '@vignette/core';

export interface AppState {
  notes: Note[];
  items: NoteItem[];
}

const STORAGE_KEY = 'vignette:v1';
const OWNER = 'local'; // remplacé par auth.uid() au branchement Supabase

function now(): string {
  return new Date().toISOString();
}

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // stockage indisponible ou corrompu → repartir propre
  }
  return seed();
}

/** Jeu de données de départ, calqué sur les maquettes. */
function seed(): AppState {
  const mk = (
    id: string,
    title: string,
    color: NoteColor,
    status: NoteStatus,
    dock: number | null,
    minutesAgo: number,
    lines: string[],
  ): { note: Note; items: NoteItem[] } => {
    const t = new Date(Date.now() - minutesAgo * 60_000).toISOString();
    return {
      note: {
        id,
        ownerId: OWNER,
        title,
        color,
        status,
        dockPosition: dock,
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
      },
      items: lines.map((text, i) => ({
        id: `${id}-${i}`,
        noteId: id,
        position: (i + 1) * 1024,
        text,
        checked: false,
      })),
    };
  };

  const seeds = [
    mk('n-office', 'Office', 'blue', 'active', 1024, 23, [
      'understand all the apis listed',
      'create tickets for PRD creation',
    ]),
    mk('n-groceries', 'Groceries', 'mint', 'active', 2048, 60, [
      'apple',
      '4x banana',
      'dry fruits',
      'peanuts',
    ]),
    mk('n-hold', 'hold my lid', 'lilac', 'active', 3072, 15 * 60, ['work on the clamshell']),
    mk('n-side', 'Side-projects', 'yellow', 'active', 4096, 65, [
      'understand the architecture of the backend api',
    ]),
    mk('n-supercmd', 'supercmd', 'blue', 'archived', null, 15 * 60, [
      'work on the custom extension',
    ]),
  ];

  return {
    notes: seeds.map((s) => s.note),
    items: seeds.flatMap((s) => s.items),
  };
}

type Listener = () => void;

class Store {
  private state: AppState = loadInitial();
  private listeners = new Set<Listener>();

  getState = (): AppState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private commit(next: AppState) {
    this.state = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best effort
    }
    this.listeners.forEach((fn) => fn());
  }

  private patchNote(id: string, patch: Partial<Note>) {
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: now() } : n,
      ),
    });
  }

  createNote(color: NoteColor = 'blue'): string {
    const id = crypto.randomUUID();
    const t = now();
    const note: Note = {
      id,
      ownerId: OWNER,
      title: '',
      color,
      status: 'active',
      dockPosition: positionAtEnd(this.state.notes),
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    const item: NoteItem = { id: crypto.randomUUID(), noteId: id, position: 1024, text: '', checked: false };
    this.commit({ notes: [...this.state.notes, note], items: [...this.state.items, item] });
    return id;
  }

  rename(id: string, title: string) {
    this.patchNote(id, { title });
  }

  setColor(id: string, color: NoteColor) {
    this.patchNote(id, { color });
  }

  setStatus(id: string, status: NoteStatus) {
    this.patchNote(id, { status });
  }

  /** Mark complete : coche tout et passe la note en completed. */
  markComplete(id: string) {
    this.commit({
      notes: this.state.notes.map((n) =>
        n.id === id ? { ...n, status: 'completed', updatedAt: now() } : n,
      ),
      items: this.state.items.map((i) => (i.noteId === id ? { ...i, checked: true } : i)),
    });
  }

  softDelete(id: string) {
    this.patchNote(id, { deletedAt: now(), dockPosition: null });
  }

  dock(id: string) {
    this.patchNote(id, { dockPosition: positionAtEnd(this.state.notes) });
  }

  undock(id: string) {
    this.patchNote(id, { dockPosition: null });
  }

  addItem(noteId: string, afterPosition?: number): string {
    const siblings = this.state.items.filter((i) => i.noteId === noteId);
    const maxPos = Math.max(0, ...siblings.map((i) => i.position));
    const position = afterPosition !== undefined ? afterPosition + 0.5 : maxPos + 1024;
    const id = crypto.randomUUID();
    this.commit({
      ...this.state,
      items: [...this.state.items, { id, noteId, position, text: '', checked: false }],
    });
    this.patchNote(noteId, {});
    return id;
  }

  updateItem(id: string, patch: Partial<Pick<NoteItem, 'text' | 'checked'>>) {
    const item = this.state.items.find((i) => i.id === id);
    this.commit({
      ...this.state,
      items: this.state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
    if (item) this.patchNote(item.noteId, {});
  }

  removeItem(id: string) {
    const item = this.state.items.find((i) => i.id === id);
    this.commit({ ...this.state, items: this.state.items.filter((i) => i.id !== id) });
    if (item) this.patchNote(item.noteId, {});
  }
}

export const store = new Store();

export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, store.getState);
}

export function itemsOf(state: AppState, noteId: string): NoteItem[] {
  return state.items.filter((i) => i.noteId === noteId).sort((a, b) => a.position - b.position);
}
