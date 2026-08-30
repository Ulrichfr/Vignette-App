import type { NoteColor } from '@vignette/core';

export interface ColorSpec {
  /** Fond de la note. */
  base: string;
  /** Bande latérale / onglet docké (plus saturée, plus sombre). */
  edge: string;
  /** Texte posé sur la note. */
  ink: string;
}

/** Palette pastel intégrée : valeurs de DESIGN.md avec dérivés précalculés. */
export const PALETTE: Record<string, ColorSpec> = {
  blue: { base: '#BCD9F8', edge: '#9FC4EE', ink: '#23384F' },
  mint: { base: '#BFE8CF', edge: '#A2D9B8', ink: '#1F3D2B' },
  lilac: { base: '#DDCFF6', edge: '#C7B2EE', ink: '#35284E' },
  yellow: { base: '#F8DF7C', edge: '#EDCB4F', ink: '#4A3B10' },
  coral: { base: '#F5A896', edge: '#EC8D75', ink: '#4E2317' },
  rose: { base: '#F7C8DC', edge: '#EFA9C8', ink: '#4A2136' },
  sand: { base: '#EBDCC4', edge: '#DFC9A5', ink: '#443722' },
  sky: { base: '#C3E8EC', edge: '#A4DAE0', ink: '#1D3F44' },
  lime: { base: '#DCEBAB', edge: '#C9E086', ink: '#3A431A' },
  peach: { base: '#FBD5AE', edge: '#F5C289', ink: '#4F3517' },
  grape: { base: '#C7C9F4', edge: '#ABAEEE', ink: '#2C2E56' },
  graphite: { base: '#D9D9D6', edge: '#C4C4C0', ink: '#303032' },
};

export const COLOR_NAMES = Object.keys(PALETTE);

/** Résout une couleur de note (nom de palette ou hex custom) en triplet utilisable. */
export function colorSpec(color: NoteColor): ColorSpec {
  const named = PALETTE[color];
  if (named) return named;
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    // Dérivés simples pour les hex custom (assombrissement linéaire).
    return { base: color, edge: shade(color, -0.12), ink: shade(color, -0.72) };
  }
  return PALETTE.blue!;
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, v * (1 + amount))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
