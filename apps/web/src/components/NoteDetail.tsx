import { relativeAge } from '@vignette/core';
import { useState } from 'react';
import { COLOR_NAMES, PALETTE, colorSpec } from '../colors';
import { noteToMarkdown, noteToText } from '@vignette/core';
import { itemsOf, store, useAppState } from '../store';
import { ChecklistEditor } from './ChecklistEditor';

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function NoteDetail({ noteId, onDeleted }: { noteId: string; onDeleted: () => void }) {
  const state = useAppState();
  const [exportOpen, setExportOpen] = useState(false);
  const note = state.notes.find((n) => n.id === noteId && !n.deletedAt);
  if (!note) return <section className="detail-pane empty" />;

  const spec = colorSpec(note.color);
  const items = itemsOf(state, note.id);
  const inDeck = note.dockPosition !== null && note.status !== 'archived';
  const statusLabel =
    note.status === 'archived' ? 'ARCHIVED' : note.status === 'completed' ? 'DONE' : 'ACTIVE';

  return (
    <section className="detail-pane">
      <header className="detail-header">
        <span className="detail-status">
          <span className="status-dot" style={{ background: spec.base }} />
          {statusLabel}
          {inDeck ? ' · IN THE DECK' : ''}
        </span>
        <span className="detail-actions">
          {note.status !== 'completed' && (
            <button className="soft-btn" onClick={() => store.markComplete(note.id)}>
              Mark complete
            </button>
          )}
          {note.status === 'completed' && (
            <button className="soft-btn" onClick={() => store.setStatus(note.id, 'active')}>
              Reopen
            </button>
          )}
          <span className="export-wrap">
            <button className="soft-btn" onClick={() => setExportOpen((v) => !v)}>
              Export…
            </button>
            {exportOpen && (
              <span className="export-menu" onMouseLeave={() => setExportOpen(false)}>
                <button
                  onClick={() => {
                    download(`${note.title || 'note'}.md`, noteToMarkdown(note, items));
                    setExportOpen(false);
                  }}
                >
                  Markdown
                </button>
                <button
                  onClick={() => {
                    download(`${note.title || 'note'}.txt`, noteToText(note, items));
                    setExportOpen(false);
                  }}
                >
                  Plain text
                </button>
              </span>
            )}
          </span>
          <button
            className="soft-btn danger"
            onClick={() => {
              store.softDelete(note.id);
              onDeleted();
            }}
          >
            Delete
          </button>
        </span>
      </header>

      <article className="detail-card" style={{ background: spec.base, color: spec.ink }}>
        <div className="detail-card-top">
          <input
            className="detail-title"
            value={note.title}
            placeholder="Untitled note"
            style={{ color: spec.ink }}
            onChange={(e) => store.rename(note.id, e.target.value)}
          />
          <span className="detail-edited">edited {shortDate(note.updatedAt)}</span>
        </div>

        <ChecklistEditor noteId={note.id} items={items} ink={spec.ink} />

        <footer className="detail-footer">
          <span>
            Created {longDate(note.createdAt)} · Updated{' '}
            {relativeAge(note.updatedAt) === 'now' ? 'just now' : `${relativeAge(note.updatedAt)} ago`}
          </span>
        </footer>
      </article>

      <div className="detail-toolbar">
        <span className="color-picker">
          {COLOR_NAMES.map((name) => (
            <button
              key={name}
              className={`color-swatch ${note.color === name ? 'selected' : ''}`}
              style={{ background: PALETTE[name]!.base }}
              title={name}
              onClick={() => store.setColor(note.id, name)}
            />
          ))}
        </span>
        <span className="detail-toolbar-actions">
          {inDeck ? (
            <button className="ghost-btn" onClick={() => store.undock(note.id)}>
              Remove from deck
            </button>
          ) : (
            note.status !== 'archived' && (
              <button className="ghost-btn" onClick={() => store.dock(note.id)}>
                Add to deck
              </button>
            )
          )}
          {note.status === 'archived' ? (
            <button className="ghost-btn" onClick={() => store.setStatus(note.id, 'active')}>
              Unarchive
            </button>
          ) : (
            <button className="ghost-btn" onClick={() => store.setStatus(note.id, 'archived')}>
              Archive
            </button>
          )}
        </span>
      </div>
    </section>
  );
}
