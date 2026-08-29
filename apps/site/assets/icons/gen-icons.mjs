#!/usr/bin/env node
// Génère l'icône Vignette (post-it au coin décollé + lignes manuscrites)
// déclinée dans les couleurs de la palette (DESIGN.md). Sortie : SVG par couleur.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const PALETTE = {
  blue: { base: '#BCD9F8', edge: '#9FC4EE', ink: '#23384F' },
  mint: { base: '#BFE8CF', edge: '#A2D9B8', ink: '#1F3D2B' },
  lilac: { base: '#DDCFF6', edge: '#C7B2EE', ink: '#35284E' },
  yellow: { base: '#F8DF7C', edge: '#EDCB4F', ink: '#4A3B10' },
  coral: { base: '#F5A896', edge: '#EC8D75', ink: '#4E2317' },
  rose: { base: '#F7C8DC', edge: '#EFA9C8', ink: '#4A2136' },
  sand: { base: '#EBDCC4', edge: '#DFC9A5', ink: '#443722' },
};

const mix = (hex, other, t) => {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(other.slice(1), 16);
  const ch = (sa, sb) => Math.round(sa + (sb - sa) * t);
  const r = ch((a >> 16) & 255, (b >> 16) & 255);
  const g = ch((a >> 8) & 255, (b >> 8) & 255);
  const bl = ch(a & 255, b & 255);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
};

function svg({ base, edge, ink }) {
  const light = mix(base, '#ffffff', 0.22);
  const foldA = mix(edge, '#ffffff', 0.28);
  const foldB = mix(edge, '#000000', 0.06);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="1" stop-color="${base}"/>
    </linearGradient>
    <linearGradient id="fold" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${foldA}"/>
      <stop offset="1" stop-color="${foldB}"/>
    </linearGradient>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g transform="rotate(-3 512 512)" filter="url(#drop)">
    <path fill="url(#paper)" d="M262 112 H762 Q912 112 912 262 V642 L642 912 H262 Q112 912 112 762 V262 Q112 112 262 112 Z"/>
    <path fill="url(#fold)" d="M912 642 L642 912 C652 770 770 652 912 642 Z"/>
    <g stroke="${ink}" stroke-width="32" stroke-linecap="round" fill="none" opacity="0.92">
      <path d="M268 372 q 22 -10 46 -5"/>
      <path d="M394 366 q 100 -16 190 -7 t 148 10"/>
      <path d="M268 518 q 22 -10 46 -5"/>
      <path d="M394 512 q 84 -14 152 -6 t 110 9"/>
      <path d="M262 664 l 30 34 l 52 -62"/>
      <path d="M394 658 q 64 -12 112 -5 t 70 8" opacity="0.55"/>
    </g>
  </g>
</svg>`;
}

for (const [name, spec] of Object.entries(PALETTE)) {
  writeFileSync(join(here, `vignette-${name}.svg`), svg(spec));
}
console.log('SVG générés :', Object.keys(PALETTE).join(', '));
