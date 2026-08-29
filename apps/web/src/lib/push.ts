import { supabase } from './supabase';

/**
 * Abonne ce navigateur aux rappels poussés (si la permission est accordée)
 * et enregistre l'abonnement côté serveur. Idempotent, silencieux en échec.
 */
export async function ensurePushSubscription(userId: string): Promise<void> {
  try {
    if (!supabase || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const r = await fetch('/admin-api/vapid-public');
      const { key } = (await r.json()) as { key: string | null };
      if (!key) return;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
    }

    const raw = sub.toJSON();
    if (!raw.endpoint || !raw.keys) return;
    await supabase.from('push_subscriptions').upsert({
      endpoint: raw.endpoint,
      user_id: userId,
      p256dh: raw.keys.p256dh,
      auth: raw.keys.auth,
    });
  } catch (err) {
    console.warn('vignette: abonnement push impossible', err);
  }
}
