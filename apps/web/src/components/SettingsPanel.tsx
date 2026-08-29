import { useState } from 'react';
import { setLang, useI18n, type Lang } from '../i18n';
import { getAppIcon, setAppIcon, ICON_COLORS, type IconColor } from '../lib/appicon';
import {
  APP_VERSION,
  checkForUpdate,
  isNative,
  openExternal,
  type UpdateInfo,
} from '../lib/update';
import { buildBackup } from '../lib/backup';
import { clearInstance } from '../lib/instance';
import { instanceConfig } from '../lib/supabase';
import { setTheme, useTheme, type Theme } from '../theme';
import { store, useAppState } from '../store';

/** Réglages : langue, thème, icône de l'app, données, instance, à propos. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const state = useAppState();
  const [icon, setIcon] = useState<IconColor>(getAppIcon());
  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'uptodate' | 'error'>(
    'idle',
  );
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  const runUpdateCheck = () => {
    setUpdateState('checking');
    checkForUpdate()
      .then((u) => {
        setUpdate(u);
        setUpdateState(u ? 'idle' : 'uptodate');
      })
      .catch(() => setUpdateState('error'));
  };

  const pickIcon = (c: IconColor) => {
    setIcon(c);
    setAppIcon(c);
  };

  const exportAll = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(
      new Blob([buildBackup(state.notes, state.items)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `vignette-sauvegarde-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modeLabel =
    instanceConfig?.mode === 'local'
      ? t.onboardLocal
      : instanceConfig?.mode === 'server'
        ? (instanceConfig.url ?? '')
        : t.onboardOfficial;

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <aside className="settings-panel">
        <header className="settings-head">
          <h2>{t.settings}</h2>
          <button className="ghost-btn icon-btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <section>
          <h3>{t.settingsLanguage}</h3>
          <div className="settings-chips">
            {(['fr', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                className={`filter-chip ${lang === l ? 'selected' : ''}`}
                onClick={() => setLang(l)}
              >
                {l === 'fr' ? 'Français' : 'English'}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>{t.settingsTheme}</h3>
          <div className="settings-chips">
            {(['system', 'light', 'dark'] as Theme[]).map((th) => (
              <button
                key={th}
                className={`filter-chip ${theme === th ? 'selected' : ''}`}
                onClick={() => setTheme(th)}
              >
                {th === 'system' ? t.themeSystem : th === 'light' ? t.themeLight : t.themeDark}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>{t.settingsIcon}</h3>
          <p className="settings-hint">{t.settingsIconHint}</p>
          <div className="settings-icons">
            {ICON_COLORS.map((c) => (
              <button
                key={c}
                className={`settings-icon ${icon === c ? 'selected' : ''}`}
                title={c}
                onClick={() => pickIcon(c)}
              >
                <img src={`${import.meta.env.BASE_URL}icons/${c}.svg`} alt={c} />
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>{t.settingsData}</h3>
          <div className="settings-chips">
            <button className="soft-btn" onClick={exportAll}>
              {t.backupExport}
            </button>
          </div>
          <p className="settings-hint">{t.settingsImportHint}</p>
        </section>

        <section>
          <h3>{t.settingsInstance}</h3>
          <p className="settings-hint" style={{ overflowWrap: 'anywhere' }}>
            {modeLabel}
          </p>
          {instanceConfig?.mode !== 'builtin' && (
            <button
              className="soft-btn"
              onClick={() => {
                clearInstance();
                window.location.reload();
              }}
            >
              {t.settingsChangeInstance}
            </button>
          )}
        </section>

        <section>
          <h3>{t.settingsShortcuts}</h3>
          <div className="settings-keys">
            <span><kbd>N</kbd>{t.shortcutNew}</span>
            <span><kbd>/</kbd>{t.shortcutSearch}</span>
            <span><kbd>Échap</kbd>{t.shortcutClose}</span>
          </div>
        </section>

        <section>
          <h3>{t.settingsUpdate}</h3>
          <p className="settings-hint">{t.updateCurrent(APP_VERSION)}</p>
          {update ? (
            <div className="settings-update">
              <p className="update-available">{t.updateAvailable(update.version)}</p>
              {update.notes?.fr && <p className="settings-hint">{update.notes.fr}</p>}
              {isNative ? (
                <button className="soft-btn" onClick={() => void openExternal(update.url)}>
                  {t.updateDownload} ↗
                </button>
              ) : (
                <button className="soft-btn" onClick={() => window.location.reload()}>
                  {t.updateReload}
                </button>
              )}
            </div>
          ) : (
            <button
              className="soft-btn"
              disabled={updateState === 'checking'}
              onClick={runUpdateCheck}
            >
              {updateState === 'checking' ? t.updateChecking : t.updateCheck}
            </button>
          )}
          {updateState === 'uptodate' && <p className="settings-hint">{t.updateUpToDate}</p>}
          {updateState === 'error' && <p className="settings-hint">{t.updateError}</p>}
        </section>

        <section>
          <h3>{t.settingsAbout}</h3>
          <div className="settings-about">
            {(
              [
                ['https://vignette.ulrichrozier.com', t.onboardLinkSite],
                ['https://github.com/Ulrichfr/Vignette-App', t.onboardLinkSource],
                [
                  'https://github.com/Ulrichfr/Vignette-App/blob/main/docs/DEMARRER.md',
                  t.onboardLinkTutorials,
                ],
              ] as const
            ).map(([href, label]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  void openExternal(href);
                }}
              >
                {label} ↗
              </a>
            ))}
          </div>
          <p className="settings-hint">Vignette {APP_VERSION}</p>
        </section>
      </aside>
    </>
  );
}
