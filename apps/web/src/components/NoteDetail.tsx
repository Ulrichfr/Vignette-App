import { isDue, noteToMarkdown, noteToText, relativeAge } from '@vignette/core';
import { ensurePushSubscription } from '../lib/push';
import { toLocalInput } from '../lib/dates';
import { useState } from 'react';
import { COLOR_NAMES, PALETTE, colorSpec } from '../colors';
import { useI18n } from '../i18n';
import { isLocalMode } from '../lib/supabase';
import { itemsOf, store, useAppState } from '../store';
import { ChecklistEditor } from './ChecklistEditor';
import { SharePanel } from './SharePanel';
import { IcBack, IcClock } from './icons';

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface NoteDetailProps {
  noteId: string;
  onDeleted: () => void;
  /** Retour à la liste (mobile uniquement, masqué en desktop via CSS). */
  onBack?: () => void;
}

export function NoteDetail({ noteId, onDeleted, onBack }: NoteDetailProps) {
  const { t } = useI18n();
  const state = useAppState();
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return <section className="detail-pane empty" />;

  // Vue corbeille : restaurer ou purger, contenu en lecture seule.
  if (note.deletedAt) {
    const spec0 = colorSpec(note.color);
    return (
      <section className="detail-pane">
        <header className="detail-header">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <IcBack />
            </button>
          )}
          <span className="detail-status">
            <span className="status-dot" style={{ background: spec0.base }} />
            {t.badgeTrash}
          </span>
          <span className="detail-actions">
            <button className="soft-btn" onClick={() => store.restore(note.id)}>
              {t.restore}
            </button>
            <button
              className="soft-btn danger"
              onClick={() => {
                store.purge(note.id);
                onDeleted();
              }}
            >
              {t.deleteForever}
            </button>
          </span>
        </header>
        <article className="detail-card trashed" style={{ background: spec0.base, color: spec0.ink }}>
          <div className="detail-card-top">
            <span className="detail-title">{note.title || t.untitled}</span>
          </div>
          <div className="checklist hand" style={{ color: spec0.ink }}>
            {itemsOf(state, note.id).map((i) => (
              <div key={i.id} className="checklist-line">
                <span className="checklist-dash">{i.checked ? '✓' : '–'}</span>
                <span className={i.checked ? 'checked' : ''}>{i.text}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    );
  }

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
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <IcBack />
          </button>
        )}
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
        {note.remindAt && (
          <button
            className={`remind-corner ${isDue(note) ? 'due' : ''}`}
            title={t.reminderRemove}
            onClick={() => store.setReminder(note.id, null)}
          >
            <span className="remind-fold" style={{ borderColor: `${spec.edge} transparent` }} />
            <span className="remind-time hand">
              {new Date(note.remindAt).toLocaleString(t.dateLocale, {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </button>
        )}
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

        <ChecklistEditor noteId={note.id} items={items} ink={spec.ink} listStyle={note.listStyle} />

        <footer className="detail-footer">
          <span>
            {t.created} {longDate(note.createdAt)} · {updatedLabel}
          </span>
        </footer>
      </article>

      <div className="detail-toolbar">
        <span className="style-toggle">
          <button
            className={note.listStyle === 'dashes' ? 'selected' : ''}
            title={t.listDashes}
            onClick={() => store.setListStyle(note.id, 'dashes')}
          >
            –
          </button>
          <button
            className={note.listStyle === 'checks' ? 'selected' : ''}
            title={t.listChecks}
            onClick={() => store.setListStyle(note.id, 'checks')}
          >
            ☑
          </button>
        </span>
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
          {isOwner && !isLocalMode() && (
            <button
              className={`ghost-btn ${shareOpen ? 'active' : ''}`}
              onClick={() => setShareOpen((v) => !v)}
            >
              {t.share}
            </button>
          )}
          <button
            className="ghost-btn"
            onClick={() => store.duplicate(note.id, t.copySuffix)}
          >
            {t.duplicate}
          </button>
          <span className="remind-wrap">
            <button
              className={`ghost-btn ${note.remindAt ? 'active' : ''}`}
              title={t.reminder}
              onClick={() => {
                if ('Notification' in window && Notification.permission !== 'denied') {
                  void Notification.requestPermission().then((p) => {
                    if (p === 'granted' && store.currentUserId) {
                      void ensurePushSubscription(store.currentUserId);
                    }
                  });
                }
                const el = document.getElementById('remind-input') as HTMLInputElement | null;
                el?.showPicker?.();
                el?.focus();
              }}
            >
              <IcClock /> {t.reminder}
            </button>
            <input
              id="remind-input"
              type="datetime-local"
              className="remind-input"
              value={note.remindAt ? toLocalInput(note.remindAt) : ''}
              onChange={(e) =>
                store.setReminder(
                  note.id,
                  e.target.value ? new Date(e.target.value).toISOString() : null,
                )
              }
            />
          </span>
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
