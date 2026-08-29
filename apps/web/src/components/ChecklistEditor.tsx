import { parseInline, type ListStyle, type NoteItem } from '@vignette/core';
import { useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { store } from '../store';

interface Props {
  noteId: string;
  items: NoteItem[];
  ink: string;
  /** 'dashes' (défaut, façon maquettes) ou 'checks' (cases à cocher). */
  listStyle?: ListStyle;
  autoFocusLast?: boolean;
}

/** Rendu riche d'une ligne au repos : **gras**, *italique*, `code`, liens cliquables. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((tok, i) => {
        switch (tok.type) {
          case 'bold':
            return <b key={i}>{tok.text}</b>;
          case 'italic':
            return <em key={i}>{tok.text}</em>;
          case 'code':
            return <code key={i}>{tok.text}</code>;
          case 'link':
            return (
              <a
                key={i}
                href={tok.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {tok.text}
              </a>
            );
          default:
            return <span key={i}>{tok.text}</span>;
        }
      })}
    </>
  );
}

/** Liste d'items manuscrite : Enter ajoute une ligne, Backspace sur vide supprime,
 *  le tiret de tête sert de case à cocher. Au repos, la ligne est rendue riche ;
 *  un clic la passe en édition. */
export function ChecklistEditor({ noteId, items, ink, listStyle = 'dashes', autoFocusLast }: Props) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(
    autoFocusLast ? (items[items.length - 1]?.id ?? null) : null,
  );

  const focusLine = (index: number) => {
    const target = items[Math.max(0, Math.min(index, items.length - 1))];
    if (target) setEditingId(target.id);
    requestAnimationFrame(() => {
      const inputs = rootRef.current?.querySelectorAll<HTMLInputElement>('input[data-line]');
      inputs?.[0]?.focus();
    });
  };

  return (
    <div ref={rootRef} className="checklist hand" style={{ color: ink }}>
      {items.map((item, idx) => (
        <div key={item.id} className="checklist-line">
          {listStyle === 'checks' ? (
            <button
              className={`checklist-box ${item.checked ? 'checked' : ''}`}
              title={item.checked ? 'Uncheck' : 'Check'}
              onClick={() => store.updateItem(item.id, { checked: !item.checked })}
            >
              {item.checked ? '✓' : ''}
            </button>
          ) : (
            <button
              className="checklist-dash"
              title={item.checked ? 'Uncheck' : 'Check'}
              onClick={() => store.updateItem(item.id, { checked: !item.checked })}
            >
              {item.checked ? '✓' : '–'}
            </button>
          )}
          {editingId === item.id ? (
            <input
              data-line
              autoFocus
              value={item.text}
              placeholder={idx === 0 && items.length === 1 ? t.writeSomething : ''}
              className={item.checked ? 'checked' : ''}
              onChange={(e) => store.updateItem(item.id, { text: e.target.value })}
              onBlur={() => setEditingId((cur) => (cur === item.id ? null : cur))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const newId = store.addItem(noteId, item.position);
                  setEditingId(newId);
                } else if (e.key === 'Escape') {
                  setEditingId(null);
                } else if (e.key === 'Backspace' && item.text === '' && items.length > 1) {
                  e.preventDefault();
                  store.removeItem(item.id);
                  focusLine(idx - 1);
                }
              }}
            />
          ) : (
            <span
              className={`rich-line ${item.checked ? 'checked' : ''}`}
              onClick={() => setEditingId(item.id)}
            >
              {item.text ? (
                <RichText text={item.text} />
              ) : (
                <span className="rich-empty">
                  {idx === 0 && items.length === 1 ? t.writeSomething : ' '}
                </span>
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
