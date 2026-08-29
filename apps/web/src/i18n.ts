import type { AgeUnits } from '@vignette/core';
import { useSyncExternalStore } from 'react';

export type Lang = 'fr' | 'en';

export interface Strings {
  allNotes: string;
  import: string;
  searchPlaceholder: string;
  notesCount: (n: number) => string;
  filterAll: string;
  filterActive: string;
  filterArchived: string;
  badgeActive: string;
  badgeArchived: string;
  badgeDone: string;
  inTheDeck: string;
  markComplete: string;
  reopen: string;
  export: string;
  exportMarkdown: string;
  exportText: string;
  delete: string;
  removeFromDeck: string;
  addToDeck: string;
  archive: string;
  unarchive: string;
  untitled: string;
  edited: string;
  created: string;
  updated: string;
  justNow: string;
  agoPrefix: string;
  agoSuffix: string;
  writeSomething: string;
  emptyList: string;
  emptyDetail: string;
  newNote: string;
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  haveAccount: string;
  noAccount: string;
  signOut: string;
  authError: string;
  tagline: string;
  ageUnits: AgeUnits;
  dateLocale: string;
}

const STRINGS: Record<Lang, Strings> = {
  fr: {
    allNotes: 'Toutes les notes',
    import: 'Importer…',
    searchPlaceholder: 'Rechercher dans les notes',
    notesCount: (n: number) => `${n} note${n > 1 ? 's' : ''}`,
    filterAll: 'Toutes',
    filterActive: 'Actives',
    filterArchived: 'Archivées',
    badgeActive: 'ACTIVE',
    badgeArchived: 'ARCHIVÉE',
    badgeDone: 'FAIT',
    inTheDeck: 'DANS LE DECK',
    markComplete: 'Marquer fait',
    reopen: 'Rouvrir',
    export: 'Exporter…',
    exportMarkdown: 'Markdown',
    exportText: 'Texte brut',
    delete: 'Supprimer',
    removeFromDeck: 'Retirer du deck',
    addToDeck: 'Ajouter au deck',
    archive: 'Archiver',
    unarchive: 'Désarchiver',
    untitled: 'Sans titre',
    edited: 'modifiée',
    created: 'Créée le',
    updated: 'Modifiée',
    justNow: 'à l’instant',
    agoPrefix: 'il y a ',
    agoSuffix: '',
    writeSomething: 'écris quelque chose…',
    emptyList: 'Rien ici — crée une note depuis le deck.',
    emptyDetail: 'Choisis une note, ou décolle-en une du deck →',
    newNote: 'Nouvelle note',
    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    email: 'Email',
    password: 'Mot de passe',
    haveAccount: 'Déjà un compte ? Se connecter',
    noAccount: 'Pas de compte ? En créer un',
    signOut: 'Se déconnecter',
    authError: 'Impossible de se connecter — vérifie tes identifiants.',
    tagline: 'Tes listes, collées au bord de l’écran.',
    ageUnits: { now: 'à l’instant', m: ' min', h: ' h', d: ' j' },
    dateLocale: 'fr-FR',
  },
  en: {
    allNotes: 'All Notes',
    import: 'Import…',
    searchPlaceholder: 'Search all notes',
    notesCount: (n: number) => `${n} note${n === 1 ? '' : 's'}`,
    filterAll: 'All',
    filterActive: 'Active',
    filterArchived: 'Archived',
    badgeActive: 'ACTIVE',
    badgeArchived: 'ARCHIVED',
    badgeDone: 'DONE',
    inTheDeck: 'IN THE DECK',
    markComplete: 'Mark complete',
    reopen: 'Reopen',
    export: 'Export…',
    exportMarkdown: 'Markdown',
    exportText: 'Plain text',
    delete: 'Delete',
    removeFromDeck: 'Remove from deck',
    addToDeck: 'Add to deck',
    archive: 'Archive',
    unarchive: 'Unarchive',
    untitled: 'Untitled note',
    edited: 'edited',
    created: 'Created',
    updated: 'Updated',
    justNow: 'just now',
    agoPrefix: '',
    agoSuffix: ' ago',
    writeSomething: 'write something…',
    emptyList: 'Nothing here — create a note from the deck.',
    emptyDetail: 'Pick a note, or peel a new one from the deck →',
    newNote: 'New note',
    signIn: 'Sign in',
    signUp: 'Create account',
    email: 'Email',
    password: 'Password',
    haveAccount: 'Already have an account? Sign in',
    noAccount: 'No account? Create one',
    signOut: 'Sign out',
    authError: 'Could not sign in — check your credentials.',
    tagline: 'Your lists, stuck to the edge of your screen.',
    ageUnits: { now: 'now', m: 'm', h: 'h', d: 'd' },
    dateLocale: 'en-GB',
  },
};

const LANG_KEY = 'vignette:lang';

let lang: Lang = (() => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    // stockage indisponible
  }
  return 'fr'; // français par défaut
})();

const listeners = new Set<() => void>();

export function setLang(next: Lang) {
  lang = next;
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    // best effort
  }
  listeners.forEach((fn) => fn());
}

export function getLang(): Lang {
  return lang;
}

export function useI18n(): { t: Strings; lang: Lang } {
  const current = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => lang,
  );
  return { t: STRINGS[current], lang: current };
}
