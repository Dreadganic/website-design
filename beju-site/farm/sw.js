/* Beju Farm's service worker: the game installs to a home screen and keeps working offline.
   Scope is /farm/ only — the shop and the rest of the site are untouched.
   The whole game is one self-contained page, so "offline" is one cached document.
   Navigations are network-first (a new deploy arrives on the next visit) with the cache as the fallback. */
const V = 'beju-farm-v1';
const SHELL = ['/farm/', '/farm/manifest.webmanifest', '/favicon.svg', '/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.startsWith('/.netlify/')) return;   /* live data: saves, leaderboard, the beacon — always the network */
  if (e.request.mode === 'navigate' || u.pathname === '/farm' || u.pathname === '/farm/') {
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(V).then((x) => x.put('/farm/', c)); return r; }).catch(() => caches.match('/farm/')));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
