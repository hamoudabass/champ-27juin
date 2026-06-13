const CACHE_NAME = "alisabieh-static-v3";
const STATIC_ASSETS = [
  "/", "/index.html", "/match.html",
  "/assets/css/style.css",
  "/assets/js/index.js", "/assets/js/match.js",
  "/manifest.json",
  // + vos icônes, polices locales
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Détection des requêtes Firebase/Firestore (scores en direct)
  const isFirebase = url.includes("firestore.googleapis.com")
                   || url.includes("firebaseio.com")
                   || url.includes("googleapis.com");

  if (isFirebase) {
    // NETWORK FIRST — ne jamais servir un score périmé
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // CACHE FIRST — assets statiques
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
