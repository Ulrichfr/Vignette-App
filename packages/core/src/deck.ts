import type { Note } from './types';

/** Écart par défaut entre deux positions de deck. */
export const DOCK_GAP = 1024;

/** Notes affichées dans le deck, dans l'ordre. Exclut archivées et supprimées. */
export function deckNotes(notes: Note[]): Note[] {
  return notes
    .filter((n) => n.dockPosition !== null && n.status !== 'archived' && !n.deletedAt)
    .sort((a, b) => (a.dockPosition as number) - (b.dockPosition as number));
}

/** Position pour insérer entre deux voisins (l'un ou l'autre peut manquer aux extrémités). */
export function positionBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return DOCK_GAP;
  if (before === null) return (after as number) - DOCK_GAP;
  if (after === null) return before + DOCK_GAP;
  return (before + after) / 2;
}

/** Position pour ajouter en fin de deck. */
export function positionAtEnd(notes: Note[]): number {
  const deck = deckNotes(notes);
  const last = deck[deck.length - 1];
  return positionBetween(last?.dockPosition ?? null, null);
}

/**
 * Vrai si les positions sont trop serrées (flottants dégénérés) et méritent
 * une renumérotation en pas de DOCK_GAP.
 */
export function needsRebalance(notes: Note[], epsilon = 1e-6): boolean {
  const deck = deckNotes(notes);
  for (let i = 1; i < deck.length; i++) {
    const prev = deck[i - 1]!.dockPosition as number;
    const cur = deck[i]!.dockPosition as number;
    if (cur - prev < epsilon) return true;
  }
  return false;
}

/** Nouvelles positions régulières pour l'ordre courant du deck. */
export function rebalance(notes: Note[]): Map<string, number> {
  const out = new Map<string, number>();
  deckNotes(notes).forEach((n, i) => out.set(n.id, (i + 1) * DOCK_GAP));
  return out;
}
