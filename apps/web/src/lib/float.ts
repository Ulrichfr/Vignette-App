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

export async function openFloatingNote(noteId: string, index = 0): Promise<void> {
  if (!isDesktopNative) return;
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
  new WebviewWindow(label, {
    url: `index.html?float=${encodeURIComponent(noteId)}`,
    width: FLOAT_W,
    height: FLOAT_H,
    x,
    y,
    decorations: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    title: 'Vignette',
  });
}

export async function closeFloatingWindow(): Promise<void> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().close();
}
