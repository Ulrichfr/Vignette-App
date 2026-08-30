import { describe, expect, it } from 'vitest';
import { parseImport } from '../src/import';

describe('parseImport', () => {
  it('markdown : titre + cases à cocher (aller-retour avec export)', () => {
    const md = '# Groceries\n\n- [x] apple\n- [ ] dry fruits\n';
    expect(parseImport(md, 'fallback')).toEqual({
      title: 'Groceries',
      items: [
        { text: 'apple', checked: true },
        { text: 'dry fruits', checked: false },
      ],
    });
  });

  it('texte brut : ✓ et tirets (aller-retour avec export texte)', () => {
    const txt = 'Groceries\n✓ apple\n· dry fruits\n';
    // pas de heading markdown : la première ligne nue devient un item,
    // le titre vient du fallback (nom de fichier)
    const parsed = parseImport(txt, 'Groceries');
    expect(parsed.title).toBe('Groceries');
    expect(parsed.items).toContainEqual({ text: 'apple', checked: true });
    expect(parsed.items).toContainEqual({ text: 'dry fruits', checked: false });
  });

  it('lignes nues et puces * : tout devient item', () => {
    expect(parseImport('# T\n* a\nb', 'x').items).toEqual([
      { text: 'a', checked: false },
      { text: 'b', checked: false },
    ]);
  });

  it('document vide → note vide avec titre de secours', () => {
    expect(parseImport('', 'ma-liste')).toEqual({ title: 'ma-liste', items: [] });
  });
});
