import type { NoteItem } from '@vignette/core';
import { useRef } from 'react';
import { useI18n } from '../i18n';
import { store } from '../store';

interface Props {
  noteId: string;
  items: NoteItem[];
  ink: string;
  autoFocusLast?: boolean;
}

/** Liste d'items manuscrite : Enter ajoute une ligne, Backspace sur vide supprime,
 *  le tiret de tête sert de case à cocher. */
export function ChecklistEditor({ noteId, items, ink, autoFocusLast }: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  const focusLine = (index: number) => {
    requestAnimationFrame(() => {
      const inputs = rootRef.current?.querySelectorAll<HTMLInputElement>('input[data-line]');
      inputs?.[Math.max(0, Math.min(index, (inputs?.length ?? 1) - 1))]?.focus();
    });
  };

  return (
    <div ref={rootRef} className="checklist hand" style={{ color: ink }}>
      {items.map((item, idx) => (
        <div key={item.id} className="checklist-line">
          <button
            className="checklist-dash"
            title={item.checked ? 'Uncheck' : 'Check'}
            onClick={() => store.updateItem(item.id, { checked: !item.checked })}
          >
            {item.checked ? '✓' : '–'}
          </button>
          <input
            data-line
            value={item.text}
            placeholder={idx === 0 && items.length === 1 ? t.writeSomething : ''}
            className={item.checked ? 'checked' : ''}
            autoFocus={autoFocusLast && idx === items.length - 1}
            onChange={(e) => store.updateItem(item.id, { text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                store.addItem(noteId, item.position);
                focusLine(idx + 1);
              } else if (e.key === 'Backspace' && item.text === '' && items.length > 1) {
                e.preventDefault();
                store.removeItem(item.id);
                focusLine(idx - 1);
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
