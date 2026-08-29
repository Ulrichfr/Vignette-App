import { useState } from 'react';
import { useI18n } from '../i18n';
import { OFFICIAL_URL, probeInstance, saveInstance } from '../lib/instance';

/**
 * Premier lancement (apps natives) : choisir où vivent les notes.
 * Trois post-its — l'instance officielle, la sienne, ou le local pur.
 */
export function Onboarding() {
  const { t } = useI18n();
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
        <h1 className="auth-logo">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          Vignette
        </h1>
        <p className="auth-tagline hand" style={{ margin: '2px 0 0' }}>{t.tagline}</p>
        <h2 className="onboard-title">{t.onboardTitle}</h2>
        <p className="onboard-intro hand">{t.onboardIntro}</p>

        <div className="onboard-cards">
          <button
            className="onboard-card"
            style={{ background: '#bcd9f8', color: '#23384f' }}
            disabled={busy !== null}
            onClick={() => void connect(OFFICIAL_URL, 'official')}
          >
            <h3>{t.onboardOfficial}</h3>
            <p>{t.onboardOfficialDesc}</p>
            <span className="onboard-hint hand">{t.onboardOfficialHint}</span>
          </button>

          <div className="onboard-card" style={{ background: '#bfe8cf', color: '#1f3d2b' }}>
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
                onChange={(e) => setCustomUrl(e.target.value)}
              />
              <button type="submit" disabled={busy !== null}>
                {t.onboardConnect}
              </button>
            </form>
            <a
              className="onboard-card-link"
              href="https://github.com/Ulrichfr/Vignette-App/blob/main/docs/AUTO-HEBERGEMENT.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.onboardCustomInstall} ↗
            </a>
          </div>

          <button
            className="onboard-card"
            style={{ background: '#f8df7c', color: '#4a3b10' }}
            disabled={busy !== null}
            onClick={goLocal}
          >
            <h3>{t.onboardLocal}</h3>
            <p>{t.onboardLocalDesc}</p>
            <span className="onboard-hint hand">{t.onboardLocalHint}</span>
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="onboard-links">
          <a href="https://github.com/Ulrichfr/Vignette-App/blob/main/docs/AUTO-HEBERGEMENT.md" target="_blank" rel="noopener noreferrer">
            {t.onboardLinkGuide} ↗
          </a>
          <a href="https://vignette.ulrichrozier.com" target="_blank" rel="noopener noreferrer">
            {t.onboardLinkSite} ↗
          </a>
          <a
            href="https://vignette.ulrichrozier.com/#tutoriels"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.onboardLinkTutorials} ↗
          </a>
          <a href="https://github.com/Ulrichfr/Vignette-App" target="_blank" rel="noopener noreferrer">
            {t.onboardLinkSource} ↗
          </a>
        </div>
        <p className="onboard-version">Vignette 0.1.0</p>
      </div>
    </div>
  );
}
