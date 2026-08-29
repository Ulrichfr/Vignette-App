import type { Note, NoteItem } from '@vignette/core';

/** Sauvegarde complète : toutes les notes (corbeille comprise) et leurs items. */

export interface Backup {
  app: 'vignette';
  version: 1;
  exportedAt: string;
  notes: Note[];
  items: NoteItem[];
}

export function buildBackup(notes: Note[], items: NoteItem[]): string {
  const backup: Backup = {
    app: 'vignette',
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
    items,
  };
  return JSON.stringify(backup, null, 2);
}

/** Parse et valide un fichier de sauvegarde ; jette si le format est inconnu. */
export function parseBackup(raw: string): Backup {
  const data = JSON.parse(raw) as Partial<Backup>;
  if (data.app !== 'vignette' || !Array.isArray(data.notes) || !Array.isArray(data.items)) {
    throw new Error('format de sauvegarde inconnu');
  }
  return data as Backup;
}
