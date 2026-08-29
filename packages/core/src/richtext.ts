/** Formatage inline léger des items : **gras**, *italique*, `code`, liens auto. */

export type InlineToken =
  | { type: 'text' | 'bold' | 'italic' | 'code'; text: string }
  | { type: 'link'; text: string; href: string };

const PATTERN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|https?:\/\/[^\s]+)/g;

export function parseInline(src: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const m of src.matchAll(PATTERN)) {
    const raw = m[0];
    const at = m.index ?? 0;
    if (at > last) tokens.push({ type: 'text', text: src.slice(last, at) });
    if (raw.startsWith('**')) tokens.push({ type: 'bold', text: raw.slice(2, -2) });
    else if (raw.startsWith('`')) tokens.push({ type: 'code', text: raw.slice(1, -1) });
    else if (raw.startsWith('*')) tokens.push({ type: 'italic', text: raw.slice(1, -1) });
    else {
      // lien : détache la ponctuation finale collée ("…voir https://a.fr.")
      const trimmed = raw.replace(/[).,;!?]+$/, '');
      tokens.push({ type: 'link', text: trimmed, href: trimmed });
      if (trimmed.length < raw.length) tokens.push({ type: 'text', text: raw.slice(trimmed.length) });
    }
    last = at + raw.length;
  }
  if (last < src.length) tokens.push({ type: 'text', text: src.slice(last) });
  return tokens;
}

/** Texte débarrassé des marqueurs de formatage (aperçus, exports texte). */
export function stripInline(src: string): string {
  return parseInline(src)
    .map((t) => t.text)
    .join('');
}

/** Vrai si le texte contient du formatage à rendre (sinon, rendu brut direct). */
export function hasInlineFormatting(src: string): boolean {
  PATTERN.lastIndex = 0;
  return PATTERN.test(src);
}
