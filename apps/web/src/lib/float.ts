// Fenêtres post-its sur le bureau (desktop natif uniquement).
//
// Chaque note épinglée devient une vraie fenêtre sans bordure, toujours au
// premier plan, collée au bord droit de l'écran — le post-it quitte l'app et
// vit par-dessus le bureau. La fenêtre recharge le même bundle avec
// `?float=<id>` : main.tsx rend alors FloatingNote au lieu de l'app entière.

import { isDesktopNative } from './update';

const FLOAT_W = 320;
const FLOAT_H = 380;

export function floatNoteId(): string | null {
  return new URLSearchParams(window.location.search).get('float');
}

/** Signale une erreur à l'interface (toast) — les échecs silencieux sont interdits. */
function signalError(context: string, err: unknown) {
  console.error('vignette float:', context, err);
  window.dispatchEvent(
    new CustomEvent('vignette:erreur', { detail: `${context} — ${String(err)}` }),
  );
}

export async function openFloatingNote(noteId: string, index = 0): Promise<void> {
  if (!isDesktopNative) return;
  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const label = `float-${noteId}`;
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) {
      await existing.setFocus();
      return;
    }
    // bord droit de l'écran, empilées avec un léger décalage
    const x = Math.max(0, window.screen.availWidth - FLOAT_W - 16);
    const y = Math.max(0, 80 + index * 48);
    const w = new WebviewWindow(label, {
      url: `index.html?float=${encodeURIComponent(noteId)}`,
      width: FLOAT_W,
      height: FLOAT_H,
      x,
      y,
      decorations: false,
      alwaysOnTop: true,
      resizable: true,
      skipTaskbar: true,
      // un post-it de bureau suit tous les bureaux/Spaces (macOS, Linux)
      visibleOnAllWorkspaces: true,
      title: 'Vignette',
    });
    void w.once('tauri://error', (e) => signalError('création de la fenêtre', e.payload));
  } catch (err) {
    signalError('épinglage', err);
  }
}

export async function closeFloatingWindow(): Promise<void> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().close();
}

const TAB_W = 48;
const TAB_H = 190;

/** Replie la fenêtre courante en onglet collé au bord droit, ou la redéploie. */
export async function setFloatCollapsed(collapsed: boolean): Promise<void> {
  const { getCurrentWindow, LogicalPosition, LogicalSize } = await import(
    '@tauri-apps/api/window'
  );
  const w = getCurrentWindow();
  const scale = await w.scaleFactor();
  const pos = await w.outerPosition();
  const y = Math.max(0, Math.round(pos.y / scale));
  if (collapsed) {
    await w.setSize(new LogicalSize(TAB_W, TAB_H));
    await w.setPosition(new LogicalPosition(window.screen.availWidth - TAB_W, y));
  } else {
    await w.setSize(new LogicalSize(FLOAT_W, FLOAT_H));
    await w.setPosition(
      new LogicalPosition(Math.max(0, window.screen.availWidth - FLOAT_W - 16), y),
    );
  }
}
