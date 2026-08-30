// Migration du mode local vers une instance.
//
// Quand l'app est branchée sur un serveur mais que l'appareil porte encore des
// notes du mode local (localStorage), on propose de les importer dans le
// compte. Les données locales ne sont JAMAIS effacées : après import, la clé
// est renommée en archive datée, récupérable tant qu'on ne vide pas le
// stockage du navigateur.

import type { Note, NoteItem } from '@vignette/core';

const KEY = 'vignette:local:v1';
const DISMISSED = 'vignette:local:migration-refusee';

export interface LocalPending {
  notes: Note[];
  items: NoteItem[];
}

/** Notes locales encore présentes sur l'appareil (hors corbeille), ou null. */
export function localNotesPending(): LocalPending | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { notes?: Note[]; items?: NoteItem[] };
    const notes = (data.notes ?? []).filter((n) => !n.deletedAt);
    if (notes.length === 0) return null;
    const ids = new Set(notes.map((n) => n.id));
    return { notes, items: (data.items ?? []).filter((i) => ids.has(i.noteId)) };
  } catch {
    return null;
  }
}

export function isMigrationDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED) === '1';
  } catch {
    return true;
  }
}

export function dismissMigration(): void {
  try {
    localStorage.setItem(DISMISSED, '1');
  } catch {
    // best effort
  }
}

/** Archive les données locales après import (renommage daté, pas d'effacement). */
export function archiveLocalData(): void {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      localStorage.setItem(`${KEY}:migre-${new Date().toISOString().slice(0, 10)}`, raw);
      localStorage.removeItem(KEY);
    }
    localStorage.removeItem(DISMISSED);
  } catch {
    // best effort
  }
}
