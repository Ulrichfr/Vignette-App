import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { store, useAppState } from '../store';

const ACTIVE_KEY = 'vignette:espace-actif';

export type ActiveSpace = 'all' | null | string; // 'all' | Personnel | id d'espace

export function loadActiveSpace(): ActiveSpace {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw === null || raw === 'all') return raw === 'all' ? 'all' : 'all';
    return raw === '' ? null : raw;
  } catch {
    return 'all';
  }
}

export function saveActiveSpace(v: ActiveSpace): void {
  try {
    localStorage.setItem(ACTIVE_KEY, v === 'all' ? 'all' : (v ?? ''));
  } catch {
    // best effort
  }
}

/** Une note appartient-elle à la vue active ? (les partagées sont partout) */
export function inActiveSpace(
  note: { spaceId: string | null; ownerId: string },
  active: ActiveSpace,
  me: string | null,
): boolean {
  if (active === 'all') return true;
  if (note.ownerId !== me) return true; // partagée avec moi : visible partout
  return note.spaceId === active;
}

/**
 * Sélecteur d'espace de travail : Personnel, Pro, un projet…
 * Filtre la liste ET le deck ; les nouvelles notes naissent dans l'espace actif.
 */
export function SpaceSwitcher({
  active,
  onChange,
}: {
  active: ActiveSpace;
  onChange: (v: ActiveSpace) => void;
}) {
  const { t } = useI18n();
  const state = useAppState();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setRenaming(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const label =
    active === 'all'
      ? t.spacesAll
      : active === null
        ? t.spaceDefault
        : (state.spaces.find((s) => s.id === active)?.name ?? t.spaceDefault);

  const pick = (v: ActiveSpace) => {
    onChange(v);
    setOpen(false);
  };

  const submitCreate = () => {
    const name = draft.trim();
    if (!name) return;
    pick(store.createSpace(name));
    setDraft('');
    setCreating(false);
  };

  const submitRename = (id: string) => {
    const name = draft.trim();
    if (name) store.renameSpace(id, name);
    setRenaming(null);
    setDraft('');
  };

  return (
    <div className="space-switcher" ref={rootRef}>
      <button className="space-current hand" onClick={() => setOpen((v) => !v)}>
        {label} <span className="space-caret">▾</span>
      </button>
      {open && (
        <div className="space-menu">
          <button
            className={active === 'all' ? 'selected' : ''}
            onClick={() => pick('all')}
          >
            {t.spacesAll}
          </button>
          <button className={active === null ? 'selected' : ''} onClick={() => pick(null)}>
            {t.spaceDefault}
          </button>
          {state.spaces.map((sp) =>
            renaming === sp.id ? (
              <form
                key={sp.id}
                className="space-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitRename(sp.id);
                }}
              >
                <input
                  autoFocus
                  value={draft}
                  maxLength={60}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit">{t.spaceRename}</button>
              </form>
            ) : (
              <div key={sp.id} className={`space-row ${active === sp.id ? 'selected' : ''}`}>
                <button className="space-name" onClick={() => pick(sp.id)}>
                  {sp.name}
                </button>
                <button
                  className="space-tool"
                  title={t.spaceRename}
                  onClick={() => {
                    setRenaming(sp.id);
                    setDraft(sp.name);
                  }}
                >
                  ✎
                </button>
                <button
                  className="space-tool"
                  title={`${t.spaceDelete}, ${t.spaceDeleteConfirm}`}
                  onClick={() => store.deleteSpace(sp.id)}
                >
                  ✕
                </button>
              </div>
            ),
          )}
          {creating ? (
            <form
              className="space-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitCreate();
              }}
            >
              <input
                autoFocus
                placeholder={t.spaceNamePlaceholder}
                value={draft}
                maxLength={60}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit">{t.spaceCreate}</button>
            </form>
          ) : (
            <button className="space-new" onClick={() => setCreating(true)}>
              + {t.spaceNew}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
