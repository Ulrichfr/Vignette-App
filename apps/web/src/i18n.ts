import type { AgeUnits } from '@vignette/core';
import { useSyncExternalStore } from 'react';

export type Lang = 'fr' | 'en';

export interface Strings {
  allNotes: string;
  import: string;
  backupExport: string;
  backupImported: (n: number) => string;
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
  deletedToast: string;
  undo: string;
  settingsShortcuts: string;
  shortcutNew: string;
  shortcutSearch: string;
  shortcutClose: string;
  settingsUpdate: string;
  updateCurrent: (v: string) => string;
  updateCheck: string;
  updateChecking: string;
  updateUpToDate: string;
  updateAvailable: (v: string) => string;
  updateDownload: string;
  updateReload: string;
  updateError: string;
  onboardConnecting: string;
  onboardSignIn: string;
  onboardStartLocal: string;
  onboardChecking: string;
  floatPin: string;
  updateInstall: string;
  updateInstalling: (p: string) => string;
  updateRestart: string;
  migrationOffer: (n: number) => string;
  migrationImport: string;
  migrationLater: string;
  settingsMigrate: (n: number) => string;
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
  onboardTitle: string;
  onboardIntro: string;
  onboardOfficial: string;
  onboardOfficialDesc: string;
  onboardCustom: string;
  onboardCustomDesc: string;
  onboardCustomPlaceholder: string;
  onboardConnect: string;
  onboardLocal: string;
  onboardLocalDesc: string;
  onboardError: string;
  onboardOfficialHint: string;
  onboardCustomHint: string;
  onboardLocalHint: string;
  onboardLinkGuide: string;
  onboardCustomInstall: string;
  onboardLinkTutorials: string;
  onboardLinkSite: string;
  onboardLinkSource: string;
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  haveAccount: string;
  noAccount: string;
  signOut: string;
  settings: string;
  settingsLanguage: string;
  settingsTheme: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  settingsIcon: string;
  settingsIconHint: string;
  settingsData: string;
  settingsImportHint: string;
  settingsInstance: string;
  settingsChangeInstance: string;
  settingsAbout: string;
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
    import: 'Importer (.md, .txt, sauvegarde .json)',
    backupExport: 'Tout exporter (sauvegarde)',
    backupImported: (n: number) => `Sauvegarde restaurée : ${n} note${n > 1 ? 's' : ''}.`,
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
    deletedToast: 'Note mise à la corbeille',
    undo: 'Annuler',
    settingsShortcuts: 'Raccourcis',
    shortcutNew: 'Nouvelle note',
    shortcutSearch: 'Rechercher',
    shortcutClose: 'Fermer la note',
    settingsUpdate: 'Mise à jour',
    updateCurrent: (v) => `Version installée : ${v}`,
    updateCheck: 'Vérifier les mises à jour',
    updateChecking: 'Vérification…',
    updateUpToDate: 'Vignette est à jour ✓',
    updateAvailable: (v) => `Vignette ${v} est disponible`,
    updateDownload: 'Télécharger',
    updateReload: 'Recharger',
    updateError: 'Vérification impossible (hors ligne ?)',
    onboardConnecting: 'connexion…',
    onboardSignIn: 'Se connecter',
    onboardStartLocal: 'Commencer en local',
    onboardChecking: 'Vérification…',
    floatPin: 'Épingler sur le bureau',
    updateInstall: 'Installer la mise à jour',
    updateInstalling: (p) => `Installation… ${p}`,
    updateRestart: 'Redémarrer Vignette',
    migrationOffer: (n) =>
      n === 1
        ? 'Une note du mode local vit encore sur cet appareil — l’importer dans ce compte ?'
        : `${n} notes du mode local vivent encore sur cet appareil — les importer dans ce compte ?`,
    migrationImport: 'Importer',
    migrationLater: 'Plus tard',
    settingsMigrate: (n) => (n === 1 ? 'Importer la note locale de cet appareil' : `Importer les ${n} notes locales de cet appareil`),
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
    onboardTitle: 'Où vivent tes notes ?',
    onboardIntro: 'Tu pourras changer d’avis plus tard.',
    onboardOfficial: 'Vignette officiel',
    onboardOfficialDesc: 'L’instance officielle Vignette — vignette.ulrichrozier.com.',
    onboardCustom: 'Ma propre instance',
    onboardCustomDesc: 'Ton serveur auto-hébergé : donne son adresse, l’app fait le reste.',
    onboardCustomPlaceholder: 'https://vignette.mondomaine.fr',
    onboardConnect: 'Connecter',
    onboardLocal: 'Local, sans serveur',
    onboardLocalDesc: 'Tout reste sur cet appareil. Pas de compte, pas de partage — juste tes listes.',
    onboardError: 'Impossible de joindre cette instance — vérifie l’adresse.',
    onboardOfficialHint: 'comptes sur invitation',
    onboardCustomHint: 'monte la tienne en 5 commandes',
    onboardLocalHint: 'tu pourras te connecter plus tard',
    onboardLinkGuide: 'Guide d’auto-hébergement',
    onboardCustomInstall: 'Pas encore d’instance ? Installe la tienne',
    onboardLinkTutorials: 'Tutoriels',
    onboardLinkSite: 'Site du projet',
    onboardLinkSource: 'Code source',
    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    email: 'Email',
    password: 'Mot de passe',
    haveAccount: 'Déjà un compte ? Se connecter',
    noAccount: 'Pas de compte ? En créer un',
    signOut: 'Se déconnecter',
    settings: 'Réglages',
    settingsLanguage: 'Langue',
    settingsTheme: 'Thème',
    themeSystem: 'Système',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    settingsIcon: 'Icône de l’app',
    settingsIconHint: 'Appliquée au favicon et à l’écran d’accueil (installe ou réinstalle la PWA pour la voir sur ton téléphone).',
    settingsData: 'Données',
    settingsImportHint: 'Pour restaurer une sauvegarde ou importer des listes : le bouton d’import en haut de la liste.',
    settingsInstance: 'Instance',
    settingsChangeInstance: 'Changer d’instance…',
    settingsAbout: 'À propos',
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
    import: 'Import (.md, .txt, .json backup)',
    backupExport: 'Export everything (backup)',
    backupImported: (n: number) => `Backup restored: ${n} note${n === 1 ? '' : 's'}.`,
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
    deletedToast: 'Note moved to trash',
    undo: 'Undo',
    settingsShortcuts: 'Shortcuts',
    shortcutNew: 'New note',
    shortcutSearch: 'Search',
    shortcutClose: 'Close note',
    settingsUpdate: 'Updates',
    updateCurrent: (v) => `Installed version: ${v}`,
    updateCheck: 'Check for updates',
    updateChecking: 'Checking…',
    updateUpToDate: 'Vignette is up to date ✓',
    updateAvailable: (v) => `Vignette ${v} is available`,
    updateDownload: 'Download',
    updateReload: 'Reload',
    updateError: 'Could not check (offline?)',
    onboardConnecting: 'connecting…',
    onboardSignIn: 'Sign in',
    onboardStartLocal: 'Start locally',
    onboardChecking: 'Checking…',
    floatPin: 'Pin to desktop',
    updateInstall: 'Install update',
    updateInstalling: (p) => `Installing… ${p}`,
    updateRestart: 'Restart Vignette',
    migrationOffer: (n) =>
      n === 1
        ? 'One local-mode note still lives on this device — import it into this account?'
        : `${n} local-mode notes still live on this device — import them into this account?`,
    migrationImport: 'Import',
    migrationLater: 'Later',
    settingsMigrate: (n) => (n === 1 ? 'Import this device’s local note' : `Import this device’s ${n} local notes`),
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
    onboardTitle: 'Where do your notes live?',
    onboardIntro: 'You can change your mind later.',
    onboardOfficial: 'Official Vignette',
    onboardOfficialDesc: 'The official Vignette instance — vignette.ulrichrozier.com.',
    onboardCustom: 'My own instance',
    onboardCustomDesc: 'Your self-hosted server: give its address, the app does the rest.',
    onboardCustomPlaceholder: 'https://vignette.mydomain.com',
    onboardConnect: 'Connect',
    onboardLocal: 'Local, serverless',
    onboardLocalDesc: 'Everything stays on this device. No account, no sharing — just your lists.',
    onboardError: 'Could not reach this instance — check the address.',
    onboardOfficialHint: 'accounts by invitation',
    onboardCustomHint: 'set up yours in 5 commands',
    onboardLocalHint: 'you can connect later',
    onboardLinkGuide: 'Self-hosting guide',
    onboardCustomInstall: 'No instance yet? Set up yours',
    onboardLinkTutorials: 'Tutorials',
    onboardLinkSite: 'Project website',
    onboardLinkSource: 'Source code',
    signIn: 'Sign in',
    signUp: 'Create account',
    email: 'Email',
    password: 'Password',
    haveAccount: 'Already have an account? Sign in',
    noAccount: 'No account? Create one',
    signOut: 'Sign out',
    settings: 'Settings',
    settingsLanguage: 'Language',
    settingsTheme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    settingsIcon: 'App icon',
    settingsIconHint: 'Applied to the favicon and home screen (install or reinstall the PWA to see it on your phone).',
    settingsData: 'Data',
    settingsImportHint: 'To restore a backup or import lists: the import button at the top of the list.',
    settingsInstance: 'Instance',
    settingsChangeInstance: 'Change instance…',
    settingsAbout: 'About',
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
