/* PWA : même origine uniquement — pas d’interception des CDN (fonts, jsDelivr),
   sinon Edge / Tracking Prevention peut faire échouer le fetch et provoquer des 503 artificiels. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
