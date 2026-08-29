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
  filterTrash: string;
  restore: string;
  deleteForever: string;
  duplicate: string;
  listDashes: string;
  reminder: string;
  reminderRemove: string;
  reminderDue: string;
  listChecks: string;
  copySuffix: string;
  badgeTrash: string;
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
  share: string;
  shareEmailPlaceholder: string;
  roleViewer: string;
  roleEditor: string;
  invite: string;
  pending: string;
  revoke: string;
  owner: string;
  invitationFrom: (name: string, title: string) => string;
  accept: string;
  decline: string;
  leave: string;
  shareError: string;
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  haveAccount: string;
  noAccount: string;
  signOut: string;
  authError: string;
  forgotPassword: string;
  resetSent: string;
  newPassword: string;
  savePassword: string;
  passwordSaved: string;
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
    filterTrash: 'Corbeille',
    restore: 'Restaurer',
    deleteForever: 'Supprimer définitivement',
    duplicate: 'Dupliquer',
    listDashes: 'Tirets',
    reminder: 'Rappel',
    reminderRemove: 'Retirer le rappel',
    reminderDue: 'C’est l’heure !',
    listChecks: 'Cases à cocher',
    copySuffix: ' (copie)',
    badgeTrash: 'CORBEILLE',
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
    share: 'Partager',
    shareEmailPlaceholder: 'email@exemple.fr',
    roleViewer: 'Lecture',
    roleEditor: 'Édition',
    invite: 'Inviter',
    pending: 'en attente',
    revoke: 'Retirer',
    owner: 'Propriétaire',
    invitationFrom: (name, title) => `${name} partage « ${title || 'Sans titre'} »`,
    accept: 'Accepter',
    decline: 'Refuser',
    leave: 'Quitter la note',
    shareError: 'Invitation impossible — vérifie l’email.',
    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    email: 'Email',
    password: 'Mot de passe',
    haveAccount: 'Déjà un compte ? Se connecter',
    noAccount: 'Pas de compte ? En créer un',
    signOut: 'Se déconnecter',
    authError: 'Impossible de se connecter — vérifie tes identifiants.',
    forgotPassword: 'Mot de passe oublié ?',
    resetSent: 'Email de réinitialisation envoyé — regarde ta boîte.',
    newPassword: 'Nouveau mot de passe',
    savePassword: 'Enregistrer le mot de passe',
    passwordSaved: 'Mot de passe changé — te voilà chez toi.',
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
    filterTrash: 'Trash',
    restore: 'Restore',
    deleteForever: 'Delete forever',
    duplicate: 'Duplicate',
    listDashes: 'Dashes',
    reminder: 'Reminder',
    reminderRemove: 'Remove reminder',
    reminderDue: 'It’s time!',
    listChecks: 'Checkboxes',
    copySuffix: ' (copy)',
    badgeTrash: 'TRASH',
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
    share: 'Share',
    shareEmailPlaceholder: 'email@example.com',
    roleViewer: 'View',
    roleEditor: 'Edit',
    invite: 'Invite',
    pending: 'pending',
    revoke: 'Remove',
    owner: 'Owner',
    invitationFrom: (name, title) => `${name} shared “${title || 'Untitled'}”`,
    accept: 'Accept',
    decline: 'Decline',
    leave: 'Leave note',
    shareError: 'Could not invite — check the email.',
    signIn: 'Sign in',
    signUp: 'Create account',
    email: 'Email',
    password: 'Password',
    haveAccount: 'Already have an account? Sign in',
    noAccount: 'No account? Create one',
    signOut: 'Sign out',
    authError: 'Could not sign in — check your credentials.',
    forgotPassword: 'Forgot your password?',
    resetSent: 'Reset email sent — check your inbox.',
    newPassword: 'New password',
    savePassword: 'Save password',
    passwordSaved: 'Password changed — welcome home.',
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
