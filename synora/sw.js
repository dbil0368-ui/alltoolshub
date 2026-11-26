const CACHE = "synora-cache-v34";
const ASSETS = ["/synora/","/synora/index.html","/synora/styles.css?v=28","/synora/app.js?v=29","/synora/image-gen.js","/synora/plus-menu.js?v=9","/synora/manifest.webmanifest","/synora/icon.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && url.pathname.startsWith("/synora/")) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match("/synora/"))));
});