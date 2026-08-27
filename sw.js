const CACHE = "project-hq-v4";
const ASSETS = [
  "./manifest.json",
  "./icon-gold-192.png",
  "./icon-gold-512.png",
  "./ranks/initiat.jpg",
  "./ranks/adept.jpg",
  "./ranks/artisan.jpg",
  "./ranks/orator.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = req.url;

  // HTML/App-Code: IMMER zuerst aus dem Netz, Cache nur als Offline-Fallback
  const isHTML = req.mode === "navigate" || url.endsWith(".html") || url.endsWith("/");
  if (isHTML || url.includes("data.json") || url.includes("api.github.com")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (isHTML && res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Bilder/Icons: Cache zuerst (aendern sich selten)
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res && res.status === 200 && req.method === "GET") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
