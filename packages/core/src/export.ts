import type { Note, NoteItem } from './types';

function sortedItems(items: NoteItem[]): NoteItem[] {
  return [...items].sort((a, b) => a.position - b.position);
}

/** Export Markdown : titre + liste de cases à cocher. */
export function noteToMarkdown(note: Note, items: NoteItem[]): string {
  const lines = sortedItems(items).map((i) => `- [${i.checked ? 'x' : ' '}] ${i.text}`);
  return [`# ${note.title}`, '', ...lines, ''].join('\n');
}

/** Export texte brut : une ligne par item, ✓ pour les items cochés. */
export function noteToText(note: Note, items: NoteItem[]): string {
  const lines = sortedItems(items).map((i) => `${i.checked ? '✓' : '·'} ${i.text}`);
  return [note.title, ...lines, ''].join('\n');
}
