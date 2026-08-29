import {
  positionAtEnd,
  type ListStyle,
  type Note,
  type NoteColor,
  type NoteItem,
  type NoteStatus,
} from '@vignette/core';
import type { AppState, NoteMember } from './store';

/**
 * Mode local : mêmes gestes, zéro serveur. Tout vit dans localStorage.
 * Le partage n'existe pas ici (pas de comptes) — les méthodes de partage
 * répondent poliment qu'elles ne sont pas disponibles.
 */

const STORAGE_KEY = 'vignette:local:v1';
const LOCAL_USER = 'local';

function now(): string {
  return new Date().toISOString();
}

type Persisted = Pick<AppState, 'notes' | 'items'>;

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    // stockage indisponible ou corrompu
  }
  return { notes: [], items: [] };
}

export class LocalStore {
  private state: AppState = { ...load(), invitations: [], ready: true };
  private listeners = new Set<() => void>();

  getState = (): AppState => this.state;

  get currentUserId(): string | null {
    return LOCAL_USER;
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private commit(next: AppState) {
    this.state = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: next.notes, items: next.items }));
    } catch {
      // best effort
    }
    this.listeners.forEach((fn) => fn());
  }

  /* --- cycle de vie (no-ops en local) --- */

  async setUser(_userId: string | null) {
    // rien : l'utilisateur local est toujours là
  }

  async refetch(_retry = true) {
    // rien : la vérité est déjà locale
  }

  /* --- partage : indisponible sans serveur --- */

  async invite(_noteId: string, _email: string, _role: 'viewer' | 'editor'): Promise<string | null> {
    return 'local';
  }

  async members(_noteId: string): Promise<NoteMember[]> {
    return [];
  }

  async revoke(_noteId: string, _userId: string) {}

  async respondInvitation(_noteId: string, _accept: boolean) {}

  /* --- notes --- */

  private patchNote(id: string, patch: Partial<Note>) {
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
    });
  }

  createNote(color: NoteColor = 'blue'): string {
    const id = crypto.randomUUID();
    const t = now();
    const note: Note = {
      id,
      ownerId: LOCAL_USER,
      title: '',
      color,
      status: 'active',
      listStyle: 'dashes',
      remindAt: null,
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
      remindAt: null,
    };
    this.commit({
      ...this.state,
      notes: [...this.state.notes, note],
      items: [...this.state.items, item],
    });
    return id;
  }

  createNoteWithItems(
    title: string,
    entries: { text: string; checked: boolean }[],
    color: NoteColor = 'yellow',
  ): string | null {
    const id = crypto.randomUUID();
    const t = now();
    const note: Note = {
      id,
      ownerId: LOCAL_USER,
      title,
      color,
      status: 'active',
      listStyle: entries.some((e) => e.checked) ? 'checks' : 'dashes',
      remindAt: null,
      dockPosition: null,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    const items: NoteItem[] = entries.map((e, i) => ({
      id: crypto.randomUUID(),
      noteId: id,
      position: (i + 1) * 1024,
      text: e.text,
      checked: e.checked,
      remindAt: null,
    }));
    this.commit({
      ...this.state,
      notes: [...this.state.notes, note],
      items: [...this.state.items, ...items],
    });
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

  setListStyle(id: string, listStyle: ListStyle) {
    this.patchNote(id, { listStyle });
  }

  setReminder(id: string, remindAt: string | null) {
    this.patchNote(id, { remindAt });
  }

  setItemReminder(id: string, remindAt: string | null) {
    this.commit({
      ...this.state,
      items: this.state.items.map((i) => (i.id === id ? { ...i, remindAt } : i)),
    });
  }

  markComplete(id: string) {
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) =>
        n.id === id ? { ...n, status: 'completed', updatedAt: now() } : n,
      ),
      items: this.state.items.map((i) => (i.noteId === id ? { ...i, checked: true } : i)),
    });
  }

  softDelete(id: string) {
    this.patchNote(id, { deletedAt: now(), dockPosition: null });
  }

  restore(id: string) {
    this.patchNote(id, { deletedAt: null });
  }

  purge(id: string) {
    this.commit({
      ...this.state,
      notes: this.state.notes.filter((n) => n.id !== id),
      items: this.state.items.filter((i) => i.noteId !== id),
    });
  }

  dock(id: string) {
    this.patchNote(id, { dockPosition: positionAtEnd(this.state.notes) });
  }

  undock(id: string) {
    this.patchNote(id, { dockPosition: null });
  }

  duplicate(id: string, copySuffix: string): string | null {
    const src = this.state.notes.find((n) => n.id === id);
    if (!src) return null;
    const newId = crypto.randomUUID();
    const t = now();
    const copy: Note = {
      ...src,
      id: newId,
      title: `${src.title}${copySuffix}`,
      status: 'active',
      remindAt: null,
      dockPosition: null,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    const items = this.state.items
      .filter((i) => i.noteId === id)
      .sort((a, b) => a.position - b.position)
      .map((i, idx) => ({
        id: crypto.randomUUID(),
        noteId: newId,
        position: (idx + 1) * 1024,
        text: i.text,
        checked: false,
        remindAt: null,
      }));
    this.commit({
      ...this.state,
      notes: [...this.state.notes, copy],
      items: [...this.state.items, ...items],
    });
    return newId;
  }

  reorderDeck(ids: string[]) {
    const pos = new Map(ids.map((id, i) => [id, (i + 1) * 1024]));
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) =>
        pos.has(n.id) ? { ...n, dockPosition: pos.get(n.id)! } : n,
      ),
    });
  }

  importBackup(notes: Note[], items: NoteItem[]) {
    const t = now();
    const idMap = new Map<string, string>();
    const newNotes: Note[] = notes.map((n) => {
      const id = crypto.randomUUID();
      idMap.set(n.id, id);
      return { ...n, id, ownerId: LOCAL_USER, dockPosition: null, createdAt: t, updatedAt: t };
    });
    const newItems: NoteItem[] = items
      .filter((i) => idMap.has(i.noteId))
      .map((i) => ({ ...i, id: crypto.randomUUID(), noteId: idMap.get(i.noteId)! }));
    this.commit({
      ...this.state,
      notes: [...this.state.notes, ...newNotes],
      items: [...this.state.items, ...newItems],
    });
  }

  /* --- items --- */

  addItem(noteId: string, afterPosition?: number): string {
    const siblings = this.state.items.filter((i) => i.noteId === noteId);
    const maxPos = Math.max(0, ...siblings.map((i) => i.position));
    const position = afterPosition !== undefined ? afterPosition + 0.5 : maxPos + 1024;
    const id = crypto.randomUUID();
    this.commit({
      ...this.state,
      items: [...this.state.items, { id, noteId, position, text: '', checked: false, remindAt: null }],
    });
    return id;
  }

  updateItem(id: string, patch: Partial<Pick<NoteItem, 'text' | 'checked'>>) {
    this.commit({
      ...this.state,
      items: this.state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }

  removeItem(id: string) {
    this.commit({ ...this.state, items: this.state.items.filter((i) => i.id !== id) });
  }
}
