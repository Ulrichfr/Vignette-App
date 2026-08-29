// Service worker Vignette — coquille hors-ligne minimale.
// Assets fingerprintés : cache-first. Navigation : réseau d'abord, cache en secours.
const CACHE = 'vignette-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/app/'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// rappels poussés par le serveur (app fermée incluse)
self.addEventListener('push', (e) => {
  let data = { title: 'Vignette', body: 'C’est l’heure !' };
  try {
    data = { ...data, ...e.data.json() };
  } catch {
    // payload non JSON : on garde le défaut
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/app/icon-192.png',
      badge: '/app/icon-192.png',
      lang: 'fr',
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.includes('/app/'));
      return open ? open.focus() : clients.openWindow('/app/');
    }),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // jamais de cache pour l'API
  if (/^\/(auth|rest|realtime|admin-api)\//.test(url.pathname)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put('/app/', copy));
          return r;
        })
        .catch(() => caches.match('/app/')),
    );
    return;
  }

  if (url.pathname.startsWith('/app/assets/')) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ??
          fetch(e.request).then((r) => {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return r;
          }),
      ),
    );
  }
});
