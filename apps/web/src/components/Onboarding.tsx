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
          </button>

          <div className="onboard-card" style={{ background: '#bfe8cf', color: '#1f3d2b' }}>
            <h3>{t.onboardCustom}</h3>
            <p>{t.onboardCustomDesc}</p>
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
          </div>

          <button
            className="onboard-card"
            style={{ background: '#f8df7c', color: '#4a3b10' }}
            disabled={busy !== null}
            onClick={goLocal}
          >
            <h3>{t.onboardLocal}</h3>
            <p>{t.onboardLocalDesc}</p>
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  );
}
