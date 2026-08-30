import { useState } from 'react';
import { setLang, useI18n, type Lang } from '../i18n';
import { OFFICIAL_URL, probeInstance, saveInstance } from '../lib/instance';
import { APP_VERSION, isNative, openExternal } from '../lib/update';

/** Lien externe : navigateur système en natif, nouvel onglet sur le web. */
function ExtLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (isNative) {
          e.preventDefault();
          void openExternal(href);
        }
      }}
    >
      {children}
    </a>
  );
}

/**
 * Premier lancement (apps natives) : choisir où vivent les notes.
 * Trois post-its — l'instance officielle, la sienne, ou le local pur.
 */
export function Onboarding() {
  const { t, lang } = useI18n();
  const [customUrl, setCustomUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = async (url: string, which: string) => {
    setBusy(which);
    setError(null);
    try {
      saveInstance(await probeInstance(url));
      window.location.reload();
    } catch {
      setError(t.onboardError);
      setBusy(null);
    }
  };

  const goLocal = () => {
    saveInstance({ mode: 'local' });
    window.location.reload();
  };

  return (
    <div className="auth-screen">
      <div className="onboard">
        <div className="onboard-lang">
          {(['fr', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              className={`filter-chip ${lang === l ? 'selected' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'fr' ? 'FR' : 'EN'}
            </button>
          ))}
        </div>
        <h1 className="auth-logo">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          Vignette
        </h1>
        <p className="auth-tagline hand" style={{ margin: '2px 0 0' }}>{t.tagline}</p>
        <h2 className="onboard-title">{t.onboardTitle}</h2>
        <p className="onboard-intro hand">{t.onboardIntro}</p>

        <div className="onboard-cards">
          <div className="onboard-card" style={{ background: '#bcd9f8', color: '#23384f' }}>
            <span className="onboard-ear" aria-hidden />
            <h3>{t.onboardOfficial}</h3>
            <p>{t.onboardOfficialDesc}</p>
            <span className="onboard-hint hand">{t.onboardOfficialHint}</span>
            <button
              className="onboard-cta"
              style={{ background: '#23384f', color: '#dcebfb' }}
              disabled={busy !== null}
              onClick={() => void connect(OFFICIAL_URL, 'official')}
            >
              {busy === 'official' ? t.onboardConnecting : t.onboardSignIn}
            </button>
          </div>

          <div className="onboard-card" style={{ background: '#bfe8cf', color: '#1f3d2b' }}>
            <span className="onboard-ear" aria-hidden />
            <h3>{t.onboardCustom}</h3>
            <p>{t.onboardCustomDesc}</p>
            <span className="onboard-hint hand">{t.onboardCustomHint}</span>
            <form
              className="onboard-custom"
              onSubmit={(e) => {
                e.preventDefault();
                void connect(customUrl, 'custom');
              }}
            >
              <input
                type="url"
                required
                placeholder={t.onboardCustomPlaceholder}
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setError(null);
                }}
              />
              <button type="submit" disabled={busy !== null}>
                {busy === 'custom' ? t.onboardChecking : t.onboardConnect}
              </button>
            </form>
            {error && <p className="onboard-error hand">{error}</p>}
            <ExtLink
              className="onboard-card-link"
              href="https://github.com/Ulrichfr/Vignette-App/blob/main/docs/AUTO-HEBERGEMENT.md"
            >
              {t.onboardCustomInstall} ↗
            </ExtLink>
          </div>

          <div className="onboard-card" style={{ background: '#f8df7c', color: '#4a3b10' }}>
            <span className="onboard-ear" aria-hidden />
            <h3>{t.onboardLocal}</h3>
            <p>{t.onboardLocalDesc}</p>
            <span className="onboard-hint hand">{t.onboardLocalHint}</span>
            <button
              className="onboard-cta"
              style={{ background: '#4a3b10', color: '#fdf3cf' }}
              disabled={busy !== null}
              onClick={goLocal}
            >
              {t.onboardStartLocal}
            </button>
          </div>
        </div>

        <div className="onboard-links">
          <ExtLink href="https://github.com/Ulrichfr/Vignette-App/blob/main/docs/AUTO-HEBERGEMENT.md">
            {t.onboardLinkGuide} ↗
          </ExtLink>
          <ExtLink href="https://vignette.ulrichrozier.com">{t.onboardLinkSite} ↗</ExtLink>
          <ExtLink href="https://vignette.ulrichrozier.com/#tutoriels">
            {t.onboardLinkTutorials} ↗
          </ExtLink>
          <ExtLink href="https://github.com/Ulrichfr/Vignette-App">{t.onboardLinkSource} ↗</ExtLink>
        </div>
        <p className="onboard-version">Vignette {APP_VERSION}</p>
      </div>
    </div>
  );
}
