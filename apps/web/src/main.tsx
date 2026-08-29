import '@fontsource-variable/caveat';
import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// PWA : coquille hors-ligne + installabilité (web uniquement — pas en natif,
// où BASE_URL vaut './' et où le service worker n'a pas de sens)
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.BASE_URL === '/app/') {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' });
  });
}
