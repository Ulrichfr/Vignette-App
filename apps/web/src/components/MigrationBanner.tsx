import { useState } from 'react';
import { useI18n } from '../i18n';
import {
  archiveLocalData,
  dismissMigration,
  isMigrationDismissed,
  localNotesPending,
} from '../lib/migration';
import { bootMode } from '../lib/supabase';
import { store } from '../store';

/** Propose d'importer les notes du mode local quand on est connecté à une instance. */
export function MigrationBanner() {
  const { t } = useI18n();
  const [pending, setPending] = useState(() =>
    bootMode === 'local' || isMigrationDismissed() ? null : localNotesPending(),
  );
  if (!pending) return null;

  return (
    <div className="invitations">
      <div className="invitation">
        <span className="invitation-text hand">{t.migrationOffer(pending.notes.length)}</span>
        <span className="invitation-actions">
          <button
            className="soft-btn"
            onClick={() => {
              store.importBackup(pending.notes, pending.items);
              archiveLocalData();
              setPending(null);
            }}
          >
            {t.migrationImport}
          </button>
          <button
            className="ghost-btn"
            onClick={() => {
              dismissMigration();
              setPending(null);
            }}
          >
            {t.migrationLater}
          </button>
        </span>
      </div>
    </div>
  );
}
