// Medipix PWA service worker.
// Conservative by design: it NEVER caches HTML/navigations (that caused stale
// white screens). It only caches a few static assets and shows an offline page
// when the network is unavailable. Bump CACHE to purge old caches on activate.
const CACHE = "medipix-v3";
const ASSETS = ["/offline", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await Promise.allSettled(ASSETS.map((url) => c.add(url)));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ignore cross-origin (Clerk, etc.)

  // Page navigations: ALWAYS go to the network. Only fall back to the cached
  // offline page if the network is truly unreachable. Never serve cached HTML.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  // App code & data: always network (no caching of /_next, /api, RSC, etc.).
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/sign-")
  ) {
    return;
  }

  // Remaining same-origin static files (icons, manifest): cache-first.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
