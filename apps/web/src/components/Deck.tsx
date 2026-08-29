import { deckNotes, isDue, isItemDue } from '@vignette/core';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { colorSpec } from '../colors';
import { useI18n } from '../i18n';
import { itemsOf, store, useAppState } from '../store';
import { ChecklistEditor } from './ChecklistEditor';

/** Ressort signature (DESIGN.md § Motion). */
const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const;

function tabLabel(title: string): string {
  const t = (title || 'note').toUpperCase();
  if (t.length <= 8) return t;
  const cut = t.slice(0, 8);
  const lastSpace = cut.lastIndexOf(' ');
  // coupe au mot entier quand c'est possible, sinon à 8 caractères
  return (lastSpace >= 3 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Le deck : onglets pastel dockés au bord droit, dépliage au clic. */
export function Deck() {
  const { t } = useI18n();
  const state = useAppState();
  const [openId, setOpenId] = useState<string | null>(null);
  const notes = deckNotes(state.notes);
  const open = openId ? notes.find((n) => n.id === openId) : undefined;

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  return (
    <>
      <div className="deck-rail">
        {notes.map((note) => {
          const spec = colorSpec(note.color);
          return (
            <motion.button
              key={note.id}
              className={`deck-tab ${
                isDue(note) || state.items.some((i) => i.noteId === note.id && isItemDue(i))
                  ? 'due'
                  : ''
              }`}
              style={{ background: spec.base, color: spec.ink }}
              whileHover={{ x: -8 }}
              transition={SPRING}
              layoutId={`deck-${note.id}`}
              onClick={() => setOpenId(note.id === openId ? null : note.id)}
            >
              <span className="tab-label">{tabLabel(note.title)}</span>
            </motion.button>
          );
        })}
        <button
          className="deck-add"
          title={t.newNote}
          onClick={() => {
            const id = store.createNote();
            setOpenId(id);
          }}
        >
          +
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="deck-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenId(null)}
            />
            <motion.article
              key={open.id}
              className="deck-open-note"
              style={{ background: colorSpec(open.color).base, color: colorSpec(open.color).ink }}
              layoutId={`deck-${open.id}`}
              transition={SPRING}
            >
              <span className="deck-open-edge perforation">
                <span className="tab-label">{tabLabel(open.title)}</span>
              </span>
              <div className="deck-open-body">
                <input
                  className="deck-open-title"
                  value={open.title}
                  placeholder={t.untitled}
                  style={{ color: colorSpec(open.color).ink }}
                  onChange={(e) => store.rename(open.id, e.target.value)}
                />
                <ChecklistEditor
                  noteId={open.id}
                  items={itemsOf(state, open.id)}
                  ink={colorSpec(open.color).ink}
                  listStyle={open.listStyle}
                  autoFocusLast
                />
              </div>
            </motion.article>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
