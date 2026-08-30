/** Statut d'une note. `completed` reste visible dans All Notes jusqu'à archivage. */
export type NoteStatus = 'active' | 'completed' | 'archived';

/** Couleurs pastel intégrées (voir DESIGN.md). Une couleur custom est un hex. */
export type NoteColor =
  | 'blue'
  | 'mint'
  | 'lilac'
  | 'yellow'
  | 'coral'
  | 'rose'
  | 'sand'
  | (string & {});

/** Rendu des items : tirets manuscrits ou cases à cocher. */
export type ListStyle = 'dashes' | 'checks';

/** Espace de travail : Personnel, Pro, un projet… (organisation du propriétaire). */
export interface Space {
  id: string;
  name: string;
  position: number;
}

export interface Note {
  id: string;
  ownerId: string;
  /** Espace du propriétaire ; null = Personnel (l'espace implicite). */
  spaceId: string | null;
  title: string;
  color: NoteColor;
  status: NoteStatus;
  listStyle: ListStyle;
  /** Ordre dans le deck ; null = pas dockée. Fractionnaire pour insertion sans renumérotation. */
  dockPosition: number | null;
  /** Rappel « coin corné » : échéance optionnelle. */
  remindAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface NoteItem {
  id: string;
  noteId: string;
  position: number;
  text: string;
  checked: boolean;
  /** Rappel griffonné à côté de l'item (optionnel). */
  remindAt: string | null;
}

export type ShareRole = 'viewer' | 'editor';

export interface NoteShare {
  noteId: string;
  userId: string;
  role: ShareRole;
  invitedBy: string;
  acceptedAt: string | null;
}

export interface Profile {
  id: string;
  displayName: string;
  /** Couleurs custom de l'utilisateur (hex), en plus de la palette intégrée. */
  customColors: string[];
  isAdmin: boolean;
}
