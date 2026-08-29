/** Import de notes depuis Markdown ou texte brut (miroir de export.ts). */

export interface ParsedNote {
  title: string;
  items: { text: string; checked: boolean }[];
}

/**
 * Parse un document en une note : titre = premier `# …` (sinon fallback),
 * items = lignes `- [ ]`, `- [x]`, `- `, `·`, `✓`, `*` ou lignes nues.
 */
export function parseImport(content: string, fallbackTitle: string): ParsedNote {
  let title = '';
  const items: ParsedNote['items'] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading && !title) {
      title = heading[1]!.trim();
      continue;
    }
    const checkbox = line.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (checkbox) {
      items.push({ text: checkbox[2]!.trim(), checked: checkbox[1] !== ' ' });
      continue;
    }
    const checked = line.match(/^✓\s*(.*)$/);
    if (checked) {
      items.push({ text: checked[1]!.trim(), checked: true });
      continue;
    }
    const bullet = line.match(/^[-*·–]\s+(.*)$/);
    if (bullet) {
      items.push({ text: bullet[1]!.trim(), checked: false });
      continue;
    }
    items.push({ text: line, checked: false });
  }
  return { title: title || fallbackTitle, items };
}
