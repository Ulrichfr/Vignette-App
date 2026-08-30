// QA de bout en bout de la web app Vignette, scénario par scénario.
//
//   node scripts/qa-e2e.mjs [--base https://vignette.ulrichrozier.com]
//
// Nécessite playwright résolvable (lancer depuis un dossier qui l'a en
// node_modules, ou VIGNETTE_QA_CHROME pour pointer un chromium).
// Comptes de test : ulrich@vignette.local / intrus@vignette.local.
// Chaque scénario nettoie derrière lui ; un échec n'arrête pas la suite.

import { chromium } from 'playwright';

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'https://vignette.ulrichrozier.com';
const APP = `${BASE}/app/`;
const USER = { email: 'ulrich@vignette.local', password: 'motdepasse-test-1' };
const GUEST = { email: 'intrus@vignette.local', password: 'motdepasse-test-2' };
const EXEC = process.env.VIGNETTE_QA_CHROME;

const results = [];
let page; // page courante du scénario

async function scenario(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err: String(err).split('\n')[0] });
    console.log(`  ✗ ${name} — ${String(err).split('\n')[0]}`);
    try {
      const safe = name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
      await page.screenshot({ path: `/tmp/qa-echec-${safe}.png` });
    } catch {
      // page fermée : tant pis
    }
  }
}

async function openSettings(pg) {
  if (!(await pg.locator('.settings-panel').count())) {
    await pg.locator('button[aria-label]:has(svg)').nth(0).click();
    await pg.waitForTimeout(400);
  }
}

const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

async function login(pg, creds) {
  await pg.goto(APP);
  await pg.waitForTimeout(1200);
  if (await pg.locator('input[type=email]').count()) {
    await pg.fill('input[type=email]', creds.email);
    await pg.fill('input[type=password]', creds.password);
    await pg.click('button[type=submit]');
    await pg.waitForTimeout(2200);
  }
}

/** Supprime définitivement toute note dont le titre contient `needle`. */
async function purgeByTitle(pg, needle) {
  for (let i = 0; i < 10; i++) {
    const row = pg.locator('.note-row', { hasText: needle }).first();
    if (!(await row.count())) break;
    await row.click();
    await pg.waitForTimeout(300);
    const del = pg.locator('button.soft-btn.danger').first();
    if (await del.count()) await del.click();
    await pg.waitForTimeout(300);
  }
  // vider la corbeille
  for (let i = 0; i < 15; i++) {
    const chip = pg.locator('.filter-chip', { hasText: 'Corbeille' });
    if (!(await chip.count())) break;
    await chip.click();
    await pg.waitForTimeout(300);
    const row = pg.locator('.note-row').first();
    if (!(await row.count())) break;
    await row.click();
    await pg.waitForTimeout(250);
    pg.once('dialog', (d) => d.accept());
    const forever = pg.locator('button', { hasText: 'définitivement' }).first();
    if (!(await forever.count())) break;
    await forever.click();
    await pg.waitForTimeout(500);
  }
  const all = pg.locator('.filter-chip', { hasText: 'Toutes' });
  if (await all.count()) await all.click();
  await pg.waitForTimeout(300);
}

const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
const ctx = await browser.newContext({ viewport: { width: 1360, height: 850 }, acceptDownloads: true });
page = await ctx.newPage();

console.log(`QA Vignette — ${APP}`);

/* ------------------------------------------------------------ auth */
await scenario('mauvais mot de passe → erreur affichée', async () => {
  await page.goto(APP);
  await page.waitForTimeout(1200);
  if (!(await page.locator('input[type=email]').count())) {
    // déjà connecté d'une session précédente : on se déconnecte
    await page.locator('button[title]:has(svg)').nth(1).click();
    await page.waitForTimeout(1200);
  }
  await page.fill('input[type=email]', USER.email);
  await page.fill('input[type=password]', 'mauvais-mot-de-passe');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1800);
  expect(await page.locator('.auth-error').count(), 'aucune erreur affichée');
});

await scenario('mot de passe oublié → formulaire visible', async () => {
  const forgot = page.locator('button, a', { hasText: /oublié/i }).first();
  expect(await forgot.count(), 'lien absent');
  await forgot.click();
  await page.waitForTimeout(600);
  expect(await page.locator('input[type=email]').count(), 'pas de champ email');
  const back = page.locator('button, a', { hasText: /retour|connexion/i }).first();
  if (await back.count()) await back.click();
  await page.waitForTimeout(400);
});

await scenario('connexion valide', async () => {
  await login(page, USER);
  expect(await page.locator('.list-pane').count(), 'app non chargée');
  await purgeByTitle(page, 'QA-');
});

/* ------------------------------------------------------------ notes */
await scenario('créer, titrer, remplir une note', async () => {
  await page.keyboard.press('Escape');
  await page.keyboard.press('n');
  await page.waitForTimeout(800);
  await page.locator('.detail-title').fill('QA-note');
  await page.locator('.detail-card .checklist-line input, .detail-card .checklist input').last().click().catch(() => {});
  await page.keyboard.type('première tâche');
  await page.keyboard.press('Enter');
  await page.keyboard.type('deuxième tâche');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  const row = page.locator('.note-row', { hasText: 'QA-note' });
  expect(await row.count(), 'note absente de la liste');
  expect((await row.innerText()).includes('première'), 'items absents de l’aperçu');
});

await scenario('cocher un item (style cases)', async () => {
  await page.locator('.note-row', { hasText: 'QA-note' }).click();
  await page.waitForTimeout(400);
  // basculer en cases à cocher
  const checksBtn = page.locator('button[title], .liststyle-btn', { hasText: '☑' }).first();
  if (await checksBtn.count()) await checksBtn.click();
  await page.waitForTimeout(300);
  await page.locator('.detail-card .checklist-box, .detail-card .checklist-dash').first().click();
  await page.waitForTimeout(400);
  const first = page.locator('.detail-card .checklist-line').first();
  expect((await first.innerText()).includes('✓') || (await first.locator('.checked').count()), 'item non coché');
});

await scenario('changer la couleur (12e pastille)', async () => {
  const before = await page.locator('.detail-card').getAttribute('style');
  await page.locator('.color-picker .color-swatch').nth(11).click();
  await page.waitForTimeout(400);
  const after = await page.locator('.detail-card').getAttribute('style');
  expect(before !== after, 'couleur inchangée');
});

await scenario('dupliquer', async () => {
  await page.locator('button', { hasText: 'Dupliquer' }).click();
  await page.waitForTimeout(700);
  expect(await page.locator('.note-row', { hasText: 'copie' }).count(), 'copie absente');
});

await scenario('marquer fait puis rouvrir', async () => {
  await page.locator('.note-row', { hasText: 'QA-note' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Marquer fait' }).click();
  await page.waitForTimeout(400);
  expect(await page.locator('.detail-status', { hasText: 'FAIT' }).count(), 'statut FAIT absent');
  await page.locator('button', { hasText: 'Rouvrir' }).click();
  await page.waitForTimeout(400);
  expect(await page.locator('.detail-status', { hasText: 'ACTIVE' }).count(), 'retour ACTIVE raté');
});

await scenario('archiver, filtre Archivées, désarchiver', async () => {
  await page.locator('button', { hasText: 'Archiver' }).click();
  await page.waitForTimeout(400);
  await page.locator('.filter-chip', { hasText: 'Archivées' }).click();
  await page.waitForTimeout(400);
  expect(await page.locator('.note-row', { hasText: 'QA-note' }).count(), 'absente du filtre Archivées');
  await page.locator('.note-row', { hasText: 'QA-note' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Désarchiver' }).click();
  await page.waitForTimeout(400);
  await page.locator('.filter-chip', { hasText: 'Toutes' }).click();
  await page.waitForTimeout(300);
});

await scenario('recherche par titre et par contenu d’item', async () => {
  await page.locator('.search-row input').fill('QA-note');
  await page.waitForTimeout(400);
  expect((await page.locator('.note-row').count()) >= 1, 'recherche titre vide');
  await page.locator('.search-row input').fill('deuxième tâche');
  await page.waitForTimeout(400);
  expect((await page.locator('.note-row').count()) >= 1, 'recherche contenu vide');
  await page.locator('.search-row input').fill('');
  await page.waitForTimeout(300);
});

await scenario('suppression → toast → annulation', async () => {
  await page.locator('.note-row', { hasText: 'copie' }).first().click();
  await page.waitForTimeout(300);
  const before = await page.locator('.note-row').count();
  await page.locator('button.soft-btn.danger').first().click();
  await page.waitForTimeout(500);
  expect(await page.locator('.undo-toast').count(), 'toast absent');
  await page.locator('.undo-toast button').first().click();
  await page.waitForTimeout(600);
  expect((await page.locator('.note-row').count()) === before, 'annulation inefficace');
});

await scenario('corbeille : restaurer puis purger', async () => {
  await page.locator('.note-row', { hasText: 'copie' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button.soft-btn.danger').first().click();
  await page.waitForTimeout(8500); // expiration du toast
  await page.locator('.filter-chip', { hasText: 'Corbeille' }).click();
  await page.waitForTimeout(400);
  await page.locator('.note-row', { hasText: 'copie' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Restaurer' }).click();
  await page.waitForTimeout(500);
  await page.locator('.filter-chip', { hasText: 'Toutes' }).click();
  await page.waitForTimeout(300);
  expect(await page.locator('.note-row', { hasText: 'copie' }).count(), 'restauration ratée');
});

/* ------------------------------------------------------------ deck */
await scenario('deck : retirer / remettre', async () => {
  await page.locator('.note-row', { hasText: 'QA-note' }).first().click();
  await page.waitForTimeout(300);
  const remove = page.locator('button', { hasText: 'Retirer du deck' });
  if (await remove.count()) {
    await remove.click();
    await page.waitForTimeout(400);
  }
  const add = page.locator('button', { hasText: /Épingler au deck|Remettre|Ajouter au deck/ }).first();
  expect(await add.count(), 'bouton d’ajout au deck absent');
  await add.click();
  await page.waitForTimeout(400);
  expect((await page.locator('.deck-tab', { hasText: 'QA-NOTE' }).count()) >= 1, 'onglet absent du deck');
});

await scenario('deck : ouvrir un onglet, refermer', async () => {
  await page.locator('.deck-tab', { hasText: 'QA-NOTE' }).first().click();
  await page.waitForTimeout(600);
  expect(await page.locator('.deck-open-note').count(), 'post-it non déplié');
  await page.locator('.deck-backdrop').click({ position: { x: 60, y: 60 } });
  await page.waitForTimeout(400);
});

/* ------------------------------------------------------------ rappels */
await scenario('rappel de note : coin corné posé puis retiré', async () => {
  await page.locator('.note-row', { hasText: 'QA-note' }).first().click();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const el = document.getElementById('remind-input');
    const in2h = new Date(Date.now() + 7200000);
    const pad = (n) => String(n).padStart(2, '0');
    const v = `${in2h.getFullYear()}-${pad(in2h.getMonth() + 1)}-${pad(in2h.getDate())}T${pad(in2h.getHours())}:${pad(in2h.getMinutes())}`;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(600);
  expect(await page.locator('.remind-corner').count(), 'coin corné absent');
  await page.locator('.remind-corner').click();
  await page.waitForTimeout(400);
  expect(!(await page.locator('.remind-corner').count()), 'coin corné toujours là');
});

/* ------------------------------------------------------------ partage temps réel */
await scenario('partage : inviter, accepter, co-éditer en temps réel', async () => {
  await page.locator('.note-row', { hasText: 'QA-note' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Partager' }).click();
  await page.waitForTimeout(400);
  await page.locator('.share-panel input[type=email], input[placeholder*="mail"]').last().fill(GUEST.email);
  await page.locator('.share-panel button[type=submit], .share-panel button', { hasText: /Inviter/ }).first().click();
  await page.waitForTimeout(1200);

  const ctx2 = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const pg2 = await ctx2.newPage();
  await login(pg2, GUEST);
  const accept = pg2.locator('.invitation button', { hasText: 'Accepter' }).first();
  expect(await accept.count(), 'invitation non reçue');
  await accept.click();
  await pg2.waitForTimeout(1500);
  await pg2.locator('.note-row', { hasText: 'QA-note' }).first().click();
  await pg2.waitForTimeout(500);
  // l'invité édite ; le propriétaire doit voir arriver le texte en < 5 s
  await pg2.locator('.detail-card .checklist').click();
  await pg2.keyboard.press('End');
  await pg2.keyboard.press('Enter');
  await pg2.keyboard.type('ajout invité temps réel');
  await pg2.keyboard.press('Escape');
  await page.waitForTimeout(4000);
  const seen = (await page.locator('.detail-card').innerText()).includes('ajout invité');
  // l'invité quitte la note
  await pg2.locator('button', { hasText: /Quitter/ }).first().click().catch(() => {});
  await ctx2.close();
  expect(seen, 'édition de l’invité non propagée au propriétaire');
});

/* ------------------------------------------------------------ import / export */
await scenario('import Markdown (via réglages)', async () => {
  const md = '# QA-import\n\n- [ ] alpha\n- [x] beta\n';
  await openSettings(page);
  await page.locator('.settings-panel input[type=file]').setInputFiles({
    name: 'QA-import.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(md),
  });
  await page.waitForTimeout(1000);
  expect(await page.locator('.note-row', { hasText: 'QA-import' }).count(), 'note importée absente');
});

await scenario('export JSON puis ré-import (via réglages)', async () => {
  await openSettings(page);
  const dl = page.waitForEvent('download');
  await page.locator('.settings-panel button', { hasText: 'Tout exporter' }).click();
  const file = await (await dl).path();
  const before = await page.locator('.note-row').count();
  await openSettings(page);
  await page.locator('.settings-panel input[type=file]').setInputFiles(file);
  await page.waitForTimeout(1500);
  const after = await page.locator('.note-row').count();
  expect(after > before, 'ré-import sans effet');
});

/* ------------------------------------------------------------ réglages */
await scenario('langue EN puis retour FR', async () => {
  await openSettings(page);
  await page.locator('.settings-panel button', { hasText: 'English' }).click();
  await page.waitForTimeout(400);
  expect(await page.locator('h1', { hasText: 'All notes' }).count(), 'entête pas en anglais');
  await page.locator('.settings-panel button', { hasText: 'Français' }).click();
  await page.waitForTimeout(400);
  expect(await page.locator('h1', { hasText: 'Toutes les notes' }).count(), 'retour FR raté');
});

await scenario('thème sombre puis système', async () => {
  await page.locator('.settings-panel button', { hasText: 'Sombre' }).click();
  await page.waitForTimeout(400);
  const dark = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(dark === 'dark', `data-theme=${dark}`);
  await page.locator('.settings-panel button', { hasText: 'Système' }).click();
  await page.waitForTimeout(300);
});

await scenario('vérification de mise à jour : à jour', async () => {
  const sec = page.locator('.settings-panel section:has(h3:text("Mise à jour"))');
  await sec.locator('button', { hasText: 'Vérifier' }).click();
  await page.waitForTimeout(1500);
  expect((await sec.innerText()).includes('à jour'), 'pas de confirmation à jour');
  await page.locator('.settings-backdrop').click({ position: { x: 10, y: 10 } });
  await page.waitForTimeout(300);
});

/* ------------------------------------------------------------ mobile */
await scenario('mobile : navigation liste ↔ détail, pas de débordement', async () => {
  const ctxM = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const pm = await ctxM.newPage();
  await login(pm, USER);
  await pm.locator('.note-row', { hasText: 'QA-note' }).first().click();
  await pm.waitForTimeout(600);
  expect(await pm.locator('.back-btn:visible').count(), 'bouton retour absent');
  const overflow = await pm.evaluate(() => document.body.scrollWidth - window.innerWidth);
  expect(overflow <= 1, `débordement horizontal de ${overflow}px`);
  await pm.locator('.back-btn').click();
  await pm.waitForTimeout(400);
  expect(await pm.locator('.list-pane:visible').count(), 'retour à la liste raté');
  await ctxM.close();
});

await scenario('PWA : service worker et manifeste', async () => {
  const hasManifest = await page.locator('link[rel=manifest]').count();
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    return Boolean(await navigator.serviceWorker.getRegistration());
  });
  expect(hasManifest && swReady, `manifest=${hasManifest} sw=${swReady}`);
});

/* ------------------------------------------------------------ nettoyage */
await scenario('nettoyage des notes QA', async () => {
  await purgeByTitle(page, 'QA-');
  expect(!(await page.locator('.note-row', { hasText: 'QA-' }).count()), 'notes QA restantes');
});

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} scénarios OK`);
if (failed.length) {
  console.log('ECHECS :');
  for (const f of failed) console.log(`  - ${f.name} : ${f.err}`);
  process.exit(1);
}
