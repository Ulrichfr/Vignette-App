import { useSyncExternalStore } from 'react';

export type Theme = 'system' | 'light' | 'dark';

const THEME_KEY = 'vignette:theme';
const listeners = new Set<() => void>();

let theme: Theme = (() => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // stockage indisponible
  }
  return 'system';
})();

function apply() {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

apply();

export function setTheme(next: Theme) {
  theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // best effort
  }
  apply();
  listeners.forEach((fn) => fn());
}

export function cycleTheme() {
  setTheme(theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system');
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => theme,
  );
}
