import { describe, expect, it } from 'vitest';
import { hasInlineFormatting, parseInline } from '../src/richtext';

describe('parseInline', () => {
  it('texte brut → un seul token', () => {
    expect(parseInline('acheter du pain')).toEqual([{ type: 'text', text: 'acheter du pain' }]);
  });

  it('gras, italique, code', () => {
    expect(parseInline('a **b** *c* `d`')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'bold', text: 'b' },
      { type: 'text', text: ' ' },
      { type: 'italic', text: 'c' },
      { type: 'text', text: ' ' },
      { type: 'code', text: 'd' },
    ]);
  });

  it('lien auto-détecté, ponctuation finale détachée', () => {
    expect(parseInline('voir https://google.com.')).toEqual([
      { type: 'text', text: 'voir ' },
      { type: 'link', text: 'https://google.com', href: 'https://google.com' },
      { type: 'text', text: '.' },
    ]);
  });

  it('un astérisque isolé reste du texte', () => {
    expect(parseInline('2 * 3')).toEqual([{ type: 'text', text: '2 * 3' }]);
  });

  it('hasInlineFormatting', () => {
    expect(hasInlineFormatting('rien ici')).toBe(false);
    expect(hasInlineFormatting('un **truc**')).toBe(true);
    expect(hasInlineFormatting('https://a.fr')).toBe(true);
  });
});
