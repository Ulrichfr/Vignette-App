import { useSyncExternalStore } from 'react';
import {
  positionAtEnd,
  type ListStyle,
  type Note,
  type NoteColor,
  type Space,
  type NoteItem,
  type NoteStatus,
} from '@vignette/core';
import { isLocalMode, supabase } from './lib/supabase';
import { LocalStore } from './store-local';

export interface Invitation {
  noteId: string;
  title: string;
  ownerName: string;
  role: string;
}

export interface NoteMember {
  userId: string;
  displayName: string;
  role: string;
  accepted: boolean;
}

export interface AppState {
  notes: Note[];
  items: NoteItem[];
  spaces: Space[];
  invitations: Invitation[];
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
  space_id?: string | null;
  title: string;
  color: string;
  status: NoteStatus;
  list_style: ListStyle;
  dock_position: number | null;
  remind_at: string | null;
  remind_notified_at?: string | null;
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
  remind_at: string | null;
};

const rowToNote = (r: NoteRow): Note => ({
  id: r.id,
  ownerId: r.owner_id,
  spaceId: r.space_id ?? null,
  title: r.title,
  color: r.color,
  status: r.status,
  listStyle: r.list_style ?? 'dashes',
  remindAt: r.remind_at ?? null,
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
  remindAt: r.remind_at ?? null,
});

type Listener = () => void;

/**
 * Store synchronisé Supabase : mises à jour optimistes en local, écriture en
 * arrière-plan, et application des événements Realtime (partage multi-comptes).
 */
class Store {
  private state: AppState = { notes: [], items: [], spaces: [], invitations: [], ready: false };

  /** Espace actif côté UI : les créations de notes y atterrissent. */
  activeSpaceId: string | null = null;
  private listeners = new Set<Listener>();
  private userId: string | null = null;
  private channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  /** Écritures encore en vol (gestion d'erreur/resync). */
  private pending = 0;
  /** Lignes modifiées localement récemment : leurs échos Realtime sont ignorés
   *  ligne par ligne, sans bloquer les événements des co-éditeurs ailleurs. */
  private recent = new Map<string, number>();

  private touchRecent(...ids: string[]) {
    const t = Date.now();
    for (const id of ids) this.recent.set(id, t);
  }

  private isRecent(id: string | undefined): boolean {
    if (!id) return false;
    const t = this.recent.get(id);
    return t !== undefined && Date.now() - t < 4000;
  }

  getState = (): AppState => this.state;

  get currentUserId(): string | null {
    return this.userId;
  }

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
      this.commit({ notes: [], items: [], spaces: [], invitations: [], ready: false });
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

  async refetch(retry = true) {
    if (!supabase) return;
    const [notesRes, itemsRes, spacesRes, invRes] = await Promise.all([
      supabase.from('notes').select('*'),
      supabase.from('note_items').select('*'),
      supabase.from('spaces').select('*'),
      supabase.rpc('my_invitations'),
    ]);
    if (notesRes.error || itemsRes.error) {
      console.error('vignette: fetch failed', notesRes.error ?? itemsRes.error);
      // ex. PGRST303 « JWT issued at future » : iat arrondi à la seconde
      // suivante juste après le login, une seule relance suffit.
      if (retry) setTimeout(() => void this.refetch(false), 1500);
      return;
    }
    type InvRow = { note_id: string; title: string; owner_name: string; role: string };
    this.commit({
      notes: (notesRes.data as NoteRow[]).map(rowToNote),
      items: (itemsRes.data as ItemRow[]).map(rowToItem),
      spaces: ((spacesRes.data ?? []) as { id: string; name: string; position: number }[])
        .map((r) => ({ id: r.id, name: r.name, position: r.position }))
        .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
      invitations: ((invRes.data ?? []) as InvRow[]).map((r) => ({
        noteId: r.note_id,
        title: r.title,
        ownerName: r.owner_name,
        role: r.role,
      })),
      ready: true,
    });
  }

  /* ------------------------------------------------------------- partage */

  /** Invite par email ; renvoie null si OK, sinon un message d'erreur serveur. */
  async invite(noteId: string, email: string, role: 'viewer' | 'editor'): Promise<string | null> {
    if (!supabase) return 'offline';
    const { error } = await supabase.rpc('invite_to_note', {
      nid: noteId,
      invitee_email: email,
      share_role: role,
    });
    return error ? error.message : null;
  }

  async members(noteId: string): Promise<NoteMember[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('note_members', { nid: noteId });
    if (error) {
      console.error('vignette: note_members failed', error);
      return [];
    }
    type Row = { user_id: string; display_name: string; role: string; accepted: boolean };
    return (data as Row[]).map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      role: r.role,
      accepted: r.accepted,
    }));
  }

  async revoke(noteId: string, userId: string) {
    if (!supabase) return;
    await supabase.from('note_shares').delete().eq('note_id', noteId).eq('user_id', userId);
  }

  async respondInvitation(noteId: string, accept: boolean) {
    if (!supabase) return;
    this.commit({
      ...this.state,
      invitations: this.state.invitations.filter((i) => i.noteId !== noteId),
    });
    await supabase.rpc('respond_invitation', { nid: noteId, accept });
    await this.refetch();
  }

  private onNoteChange(event: string, next: NoteRow, prev: Partial<NoteRow>) {
    if (this.isRecent(event === 'DELETE' ? prev.id : next.id)) return; // écho local
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
    if (this.isRecent(event === 'DELETE' ? prev.id : next.id)) return; // écho local
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
    this.touchRecent(id);
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
      spaceId: this.activeSpaceId,
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
    this.touchRecent(id, item.id);
    this.commit({
      ...this.state,
      notes: [...this.state.notes, note],
      items: [...this.state.items, item],
    });
    // séquencé : l'item ne doit partir qu'après la note (RLS vérifie la parenté)
    this.push(async () => {
      const res = await supabase!.from('notes').insert({
        id,
        owner_id: userId,
        space_id: note.spaceId,
        title: '',
        color,
        status: 'active',
        dock_position: note.dockPosition,
      });
      if (res.error) return res;
      return supabase!
        .from('note_items')
        .insert({ id: item.id, note_id: id, position: item.position, text: '' });
    });
    return id;
  }

  rename(id: string, title: string) {
    this.patchNote(id, { title }, { title });
  }

  /* ------------------------------------------------------------- espaces */

  setNoteSpace(id: string, spaceId: string | null) {
    this.patchNote(id, { spaceId }, { space_id: spaceId });
  }

  createSpace(name: string): string {
    const userId = this.userId;
    if (!userId) return '';
    const id = crypto.randomUUID();
    const position = (this.state.spaces.at(-1)?.position ?? 0) + 1024;
    this.commit({
      ...this.state,
      spaces: [...this.state.spaces, { id, name, position }],
    });
    this.push(() =>
      supabase!.from('spaces').insert({ id, owner_id: userId, name, position }),
    );
    return id;
  }

  renameSpace(id: string, name: string) {
    this.commit({
      ...this.state,
      spaces: this.state.spaces.map((sp) => (sp.id === id ? { ...sp, name } : sp)),
    });
    this.push(() => supabase!.from('spaces').update({ name }).eq('id', id));
  }

  /** Supprime l'espace ; ses notes redeviennent « Personnel » (jamais de perte). */
  deleteSpace(id: string) {
    if (this.activeSpaceId === id) this.activeSpaceId = null;
    this.commit({
      ...this.state,
      spaces: this.state.spaces.filter((sp) => sp.id !== id),
      notes: this.state.notes.map((n) => (n.spaceId === id ? { ...n, spaceId: null } : n)),
    });
    this.push(() => supabase!.from('spaces').delete().eq('id', id));
  }

  setColor(id: string, color: NoteColor) {
    this.patchNote(id, { color }, { color });
  }

  setStatus(id: string, status: NoteStatus) {
    this.patchNote(id, { status }, { status });
  }

  setListStyle(id: string, listStyle: ListStyle) {
    this.patchNote(id, { listStyle }, { list_style: listStyle });
  }

  /** Pose ou retire le rappel « coin corné ». */
  setReminder(id: string, remindAt: string | null) {
    this.patchNote(id, { remindAt }, { remind_at: remindAt });
  }

  /** Réordonne le deck : positions régulières selon l'ordre donné. */
  reorderDeck(ids: string[]) {
    this.touchRecent(...ids);
    const pos = new Map(ids.map((id, i) => [id, (i + 1) * 1024]));
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) =>
        pos.has(n.id) ? { ...n, dockPosition: pos.get(n.id)! } : n,
      ),
    });
    this.push(async () => {
      for (const [id, p] of pos) {
        const r = await supabase!.from('notes').update({ dock_position: p }).eq('id', id);
        if (r.error) return r;
      }
      return { error: null };
    });
  }

  /** Crée une note complète (import) : titre + items, non dockée. */
  createNoteWithItems(
    title: string,
    entries: { text: string; checked: boolean }[],
    color: NoteColor = 'yellow',
  ): string | null {
    const userId = this.userId;
    if (!userId) return null;
    const id = crypto.randomUUID();
    const t = now();
    const note: Note = {
      id,
      ownerId: userId,
      spaceId: this.activeSpaceId,
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
    this.push(async () => {
      const res = await supabase!.from('notes').insert({
        id,
        owner_id: userId,
        space_id: note.spaceId,
        title,
        color,
        status: 'active',
        list_style: note.listStyle,
      });
      if (res.error || items.length === 0) return res;
      return supabase!.from('note_items').insert(
        items.map((i) => ({
          id: i.id,
          note_id: id,
          position: i.position,
          text: i.text,
          checked: i.checked,
        })),
      );
    });
    return id;
  }

  /** Restaure une sauvegarde : recrée notes et items (nouvelles identités). */
  importBackup(notes: Note[], items: NoteItem[]) {
    const userId = this.userId;
    if (!userId) return;
    const t = now();
    const idMap = new Map<string, string>();
    const newNotes: Note[] = notes.map((n) => {
      const id = crypto.randomUUID();
      idMap.set(n.id, id);
      return { ...n, id, ownerId: userId, spaceId: null, dockPosition: null, createdAt: t, updatedAt: t };
    });
    const newItems: NoteItem[] = items
      .filter((i) => idMap.has(i.noteId))
      .map((i) => ({ ...i, id: crypto.randomUUID(), noteId: idMap.get(i.noteId)! }));
    this.touchRecent(...newNotes.map((n) => n.id), ...newItems.map((i) => i.id));
    this.commit({
      ...this.state,
      notes: [...this.state.notes, ...newNotes],
      items: [...this.state.items, ...newItems],
    });
    this.push(async () => {
      const res = await supabase!.from('notes').insert(
        newNotes.map((n) => ({
          id: n.id,
          owner_id: userId,
          title: n.title,
          color: n.color,
          status: n.status,
          list_style: n.listStyle,
          remind_at: n.remindAt,
          deleted_at: n.deletedAt,
        })),
      );
      if (res.error || newItems.length === 0) return res;
      return supabase!.from('note_items').insert(
        newItems.map((i) => ({
          id: i.id,
          note_id: i.noteId,
          position: i.position,
          text: i.text,
          checked: i.checked,
          remind_at: i.remindAt,
        })),
      );
    });
  }

  /** Rappel griffonné à côté d'un item. */
  setItemReminder(id: string, remindAt: string | null) {
    this.touchRecent(id);
    this.commit({
      ...this.state,
      items: this.state.items.map((i) => (i.id === id ? { ...i, remindAt } : i)),
    });
    this.push(() =>
      supabase!.from('note_items').update({ remind_at: remindAt, remind_notified_at: null }).eq('id', id),
    );
  }

  markComplete(id: string) {
    this.touchRecent(id, ...this.state.items.filter((i) => i.noteId === id).map((i) => i.id));
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
    this.patchNote(id, { deletedAt: now(), dockPosition: null }, { deleted_at: now(), dock_position: null });
  }

  restore(id: string) {
    this.patchNote(id, { deletedAt: null }, { deleted_at: null });
  }

  purge(id: string) {
    this.commit({
      ...this.state,
      notes: this.state.notes.filter((n) => n.id !== id),
      items: this.state.items.filter((i) => i.noteId !== id),
    });
    this.push(() => supabase!.from('notes').delete().eq('id', id));
  }

  /** Duplique une note (titre + items), non dockée, décochée. */
  duplicate(id: string, copySuffix: string): string | null {
    const userId = this.userId;
    const src = this.state.notes.find((n) => n.id === id);
    if (!src || !userId) return null;
    const newId = crypto.randomUUID();
    const t = now();
    const copy: Note = {
      ...src,
      id: newId,
      ownerId: userId,
      title: `${src.title}${copySuffix}`,
      status: 'active',
      remindAt: null,
      dockPosition: null,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    const items = itemsOf(this.state, id).map((i, idx) => ({
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
    this.push(async () => {
      const res = await supabase!.from('notes').insert({
        id: newId,
        owner_id: userId,
        title: copy.title,
        color: copy.color,
        status: 'active',
        list_style: copy.listStyle,
      });
      if (res.error || items.length === 0) return res;
      return supabase!.from('note_items').insert(
        items.map((i) => ({ id: i.id, note_id: newId, position: i.position, text: i.text })),
      );
    });
    return newId;
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
    this.touchRecent(id);
    this.commit({
      ...this.state,
      items: [...this.state.items, { id, noteId, position, text: '', checked: false, remindAt: null }],
    });
    this.push(() =>
      supabase!.from('note_items').insert({ id, note_id: noteId, position, text: '' }),
    );
    return id;
  }

  updateItem(id: string, patch: Partial<Pick<NoteItem, 'text' | 'checked'>>) {
    this.touchRecent(id);
    this.commit({
      ...this.state,
      items: this.state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
    this.push(() => supabase!.from('note_items').update(patch).eq('id', id));
  }

  removeItem(id: string) {
    this.touchRecent(id);
    this.commit({ ...this.state, items: this.state.items.filter((i) => i.id !== id) });
    this.push(() => supabase!.from('note_items').delete().eq('id', id));
  }
}

export const store = isLocalMode() ? new LocalStore() : new Store();

export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, store.getState);
}

export function itemsOf(state: AppState, noteId: string): NoteItem[] {
  return state.items.filter((i) => i.noteId === noteId).sort((a, b) => a.position - b.position);
}
