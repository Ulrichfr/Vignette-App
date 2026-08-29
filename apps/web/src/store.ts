import { useSyncExternalStore } from 'react';
import {
  positionAtEnd,
  type Note,
  type NoteColor,
  type NoteItem,
  type NoteStatus,
} from '@vignette/core';
import { supabase } from './lib/supabase';

export interface AppState {
  notes: Note[];
  items: NoteItem[];
  /** false tant que le premier fetch n'est pas terminé. */
  ready: boolean;
}

function now(): string {
  return new Date().toISOString();
}

/* ---------------------------------------------------------- mapping SQL */

type NoteRow = {
  id: string;
  owner_id: string;
  title: string;
  color: string;
  status: NoteStatus;
  dock_position: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ItemRow = {
  id: string;
  note_id: string;
  position: number;
  text: string;
  checked: boolean;
};

const rowToNote = (r: NoteRow): Note => ({
  id: r.id,
  ownerId: r.owner_id,
  title: r.title,
  color: r.color,
  status: r.status,
  dockPosition: r.dock_position,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

const rowToItem = (r: ItemRow): NoteItem => ({
  id: r.id,
  noteId: r.note_id,
  position: r.position,
  text: r.text,
  checked: r.checked,
});

type Listener = () => void;

/**
 * Store synchronisé Supabase : mises à jour optimistes en local, écriture en
 * arrière-plan, et application des événements Realtime (partage multi-comptes).
 */
class Store {
  private state: AppState = { notes: [], items: [], ready: false };
  private listeners = new Set<Listener>();
  private userId: string | null = null;
  private channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  /** Écritures encore en vol, pour ne pas écraser l'optimiste avec un écho périmé. */
  private pending = 0;

  getState = (): AppState => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private commit(next: AppState) {
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }

  /* ------------------------------------------------------ session & sync */

  async setUser(userId: string | null) {
    if (userId === this.userId) return;
    this.userId = userId;
    if (this.channel) {
      void supabase?.removeChannel(this.channel);
      this.channel = null;
    }
    if (!userId || !supabase) {
      this.commit({ notes: [], items: [], ready: false });
      return;
    }
    await this.refetch();
    this.channel = supabase
      .channel('vignette-db')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (p) =>
        this.onNoteChange(p.eventType, p.new as NoteRow, p.old as Partial<NoteRow>),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_items' }, (p) =>
        this.onItemChange(p.eventType, p.new as ItemRow, p.old as Partial<ItemRow>),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_shares' }, () => {
        // un partage accepté/révoqué change l'ensemble visible : refetch simple
        void this.refetch();
      })
      .subscribe();
  }

  async refetch() {
    if (!supabase) return;
    const [notesRes, itemsRes] = await Promise.all([
      supabase.from('notes').select('*').is('deleted_at', null),
      supabase.from('note_items').select('*'),
    ]);
    if (notesRes.error || itemsRes.error) {
      console.error('vignette: fetch failed', notesRes.error ?? itemsRes.error);
      return;
    }
    this.commit({
      notes: (notesRes.data as NoteRow[]).map(rowToNote),
      items: (itemsRes.data as ItemRow[]).map(rowToItem),
      ready: true,
    });
  }

  private onNoteChange(event: string, next: NoteRow, prev: Partial<NoteRow>) {
    if (this.pending > 0) return; // nos propres écritures : l'optimiste fait foi
    if (event === 'DELETE') {
      this.commit({ ...this.state, notes: this.state.notes.filter((n) => n.id !== prev.id) });
      return;
    }
    const note = rowToNote(next);
    const exists = this.state.notes.some((n) => n.id === note.id);
    this.commit({
      ...this.state,
      notes: exists
        ? this.state.notes.map((n) => (n.id === note.id ? note : n))
        : [...this.state.notes, note],
    });
  }

  private onItemChange(event: string, next: ItemRow, prev: Partial<ItemRow>) {
    if (this.pending > 0) return;
    if (event === 'DELETE') {
      this.commit({ ...this.state, items: this.state.items.filter((i) => i.id !== prev.id) });
      return;
    }
    const item = rowToItem(next);
    const exists = this.state.items.some((i) => i.id === item.id);
    this.commit({
      ...this.state,
      items: exists
        ? this.state.items.map((i) => (i.id === item.id ? item : i))
        : [...this.state.items, item],
    });
  }

  /** Écriture arrière-plan : trace l'en-vol et resynchronise en cas d'échec. */
  private push(op: () => PromiseLike<{ error: unknown }>) {
    if (!supabase) return;
    this.pending += 1;
    Promise.resolve(op()).then(
      ({ error }) => {
        this.pending -= 1;
        if (error) {
          console.error('vignette: write failed, resync', error);
          void this.refetch();
        }
      },
      (err) => {
        this.pending -= 1;
        console.error('vignette: write failed, resync', err);
        void this.refetch();
      },
    );
  }

  /* ------------------------------------------------------------- actions */

  private patchNote(id: string, patch: Partial<Note>, row: Partial<NoteRow>) {
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
    });
    this.push(() => supabase!.from('notes').update(row).eq('id', id));
  }

  createNote(color: NoteColor = 'blue'): string {
    const userId = this.userId;
    if (!userId) return '';
    const id = crypto.randomUUID();
    const t = now();
    const note: Note = {
      id,
      ownerId: userId,
      title: '',
      color,
      status: 'active',
      dockPosition: positionAtEnd(this.state.notes),
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    const item: NoteItem = {
      id: crypto.randomUUID(),
      noteId: id,
      position: 1024,
      text: '',
      checked: false,
    };
    this.commit({
      ...this.state,
      notes: [...this.state.notes, note],
      items: [...this.state.items, item],
    });
    this.push(() =>
      supabase!.from('notes').insert({
        id,
        owner_id: userId,
        title: '',
        color,
        status: 'active',
        dock_position: note.dockPosition,
      }),
    );
    this.push(() =>
      supabase!.from('note_items').insert({ id: item.id, note_id: id, position: item.position, text: '' }),
    );
    return id;
  }

  rename(id: string, title: string) {
    this.patchNote(id, { title }, { title });
  }

  setColor(id: string, color: NoteColor) {
    this.patchNote(id, { color }, { color });
  }

  setStatus(id: string, status: NoteStatus) {
    this.patchNote(id, { status }, { status });
  }

  markComplete(id: string) {
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) =>
        n.id === id ? { ...n, status: 'completed', updatedAt: now() } : n,
      ),
      items: this.state.items.map((i) => (i.noteId === id ? { ...i, checked: true } : i)),
    });
    this.push(() => supabase!.from('notes').update({ status: 'completed' }).eq('id', id));
    this.push(() => supabase!.from('note_items').update({ checked: true }).eq('note_id', id));
  }

  softDelete(id: string) {
    this.commit({ ...this.state, notes: this.state.notes.filter((n) => n.id !== id) });
    this.push(() =>
      supabase!.from('notes').update({ deleted_at: now(), dock_position: null }).eq('id', id),
    );
  }

  dock(id: string) {
    const pos = positionAtEnd(this.state.notes);
    this.patchNote(id, { dockPosition: pos }, { dock_position: pos });
  }

  undock(id: string) {
    this.patchNote(id, { dockPosition: null }, { dock_position: null });
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
    this.push(() =>
      supabase!.from('note_items').insert({ id, note_id: noteId, position, text: '' }),
    );
    return id;
  }

  updateItem(id: string, patch: Partial<Pick<NoteItem, 'text' | 'checked'>>) {
    this.commit({
      ...this.state,
      items: this.state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
    this.push(() => supabase!.from('note_items').update(patch).eq('id', id));
  }

  removeItem(id: string) {
    this.commit({ ...this.state, items: this.state.items.filter((i) => i.id !== id) });
    this.push(() => supabase!.from('note_items').delete().eq('id', id));
  }
}

export const store = new Store();

export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, store.getState);
}

export function itemsOf(state: AppState, noteId: string): NoteItem[] {
  return state.items.filter((i) => i.noteId === noteId).sort((a, b) => a.position - b.position);
}
