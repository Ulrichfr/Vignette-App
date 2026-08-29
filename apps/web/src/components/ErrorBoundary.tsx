import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Filet de sécurité : un crash de rendu devient un post-it d'excuse, pas un écran blanc. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('vignette: crash de rendu', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-screen">
          <div className="auth-card" style={{ background: '#f5a896', color: '#4e2317' }}>
            <h1 className="auth-logo">Vignette</h1>
            <p className="auth-tagline hand">oups, ce post-it s'est décollé.</p>
            <p style={{ margin: 0, fontSize: 14 }}>
              Une erreur inattendue s'est produite. Tes notes sont en sécurité.
            </p>
            <button className="auth-submit" onClick={() => window.location.reload()}>
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
