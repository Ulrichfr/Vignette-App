import { noteToMarkdown, noteToText, relativeAge } from '@vignette/core';
import { useState } from 'react';
import { COLOR_NAMES, PALETTE, colorSpec } from '../colors';
import { useI18n } from '../i18n';
import { itemsOf, store, useAppState } from '../store';
import { ChecklistEditor } from './ChecklistEditor';
import { SharePanel } from './SharePanel';

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function NoteDetail({ noteId, onDeleted }: { noteId: string; onDeleted: () => void }) {
  const { t } = useI18n();
  const state = useAppState();
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const note = state.notes.find((n) => n.id === noteId && !n.deletedAt);
  if (!note) return <section className="detail-pane empty" />;

  const spec = colorSpec(note.color);
  const items = itemsOf(state, note.id);
  const isOwner = note.ownerId === store.currentUserId;
  const inDeck = note.dockPosition !== null && note.status !== 'archived';
  const statusLabel =
    note.status === 'archived' ? t.badgeArchived : note.status === 'completed' ? t.badgeDone : t.badgeActive;

  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString(t.dateLocale, { day: 'numeric', month: 'short' });
  const longDate = (iso: string) =>
    new Date(iso).toLocaleDateString(t.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
  const age = relativeAge(note.updatedAt, new Date(), t.ageUnits);
  const updatedLabel =
    age === t.ageUnits.now ? `${t.updated} ${t.justNow}` : `${t.updated} ${t.agoPrefix}${age}${t.agoSuffix}`;

  return (
    <section className="detail-pane">
      <header className="detail-header">
        <span className="detail-status">
          <span className="status-dot" style={{ background: spec.base }} />
          {statusLabel}
          {inDeck ? ` · ${t.inTheDeck}` : ''}
        </span>
        <span className="detail-actions">
          {note.status !== 'completed' ? (
            <button className="soft-btn" onClick={() => store.markComplete(note.id)}>
              {t.markComplete}
            </button>
          ) : (
            <button className="soft-btn" onClick={() => store.setStatus(note.id, 'active')}>
              {t.reopen}
            </button>
          )}
          <span className="export-wrap">
            <button className="soft-btn" onClick={() => setExportOpen((v) => !v)}>
              {t.export}
            </button>
            {exportOpen && (
              <span className="export-menu" onMouseLeave={() => setExportOpen(false)}>
                <button
                  onClick={() => {
                    download(`${note.title || 'note'}.md`, noteToMarkdown(note, items));
                    setExportOpen(false);
                  }}
                >
                  {t.exportMarkdown}
                </button>
                <button
                  onClick={() => {
                    download(`${note.title || 'note'}.txt`, noteToText(note, items));
                    setExportOpen(false);
                  }}
                >
                  {t.exportText}
                </button>
              </span>
            )}
          </span>
          {isOwner ? (
            <button
              className="soft-btn danger"
              onClick={() => {
                store.softDelete(note.id);
                onDeleted();
              }}
            >
              {t.delete}
            </button>
          ) : (
            <button
              className="soft-btn danger"
              onClick={() => {
                void store.revoke(note.id, store.currentUserId!).then(() => store.refetch());
                onDeleted();
              }}
            >
              {t.leave}
            </button>
          )}
        </span>
      </header>

      <article className="detail-card" style={{ background: spec.base, color: spec.ink }}>
        <div className="detail-card-top">
          <input
            className="detail-title"
            value={note.title}
            placeholder={t.untitled}
            style={{ color: spec.ink }}
            onChange={(e) => store.rename(note.id, e.target.value)}
          />
          <span className="detail-edited">
            {t.edited} {shortDate(note.updatedAt)}
          </span>
        </div>

        <ChecklistEditor noteId={note.id} items={items} ink={spec.ink} />

        <footer className="detail-footer">
          <span>
            {t.created} {longDate(note.createdAt)} · {updatedLabel}
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
          {isOwner && (
            <button
              className={`ghost-btn ${shareOpen ? 'active' : ''}`}
              onClick={() => setShareOpen((v) => !v)}
            >
              {t.share}
            </button>
          )}
          {inDeck ? (
            <button className="ghost-btn" onClick={() => store.undock(note.id)}>
              {t.removeFromDeck}
            </button>
          ) : (
            note.status !== 'archived' && (
              <button className="ghost-btn" onClick={() => store.dock(note.id)}>
                {t.addToDeck}
              </button>
            )
          )}
          {note.status === 'archived' ? (
            <button className="ghost-btn" onClick={() => store.setStatus(note.id, 'active')}>
              {t.unarchive}
            </button>
          ) : (
            <button className="ghost-btn" onClick={() => store.setStatus(note.id, 'archived')}>
              {t.archive}
            </button>
          )}
        </span>
      </div>

      {shareOpen && isOwner && <SharePanel noteId={note.id} />}
    </section>
  );
}
