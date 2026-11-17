/* Service Worker: speichert die komplette App inkl. Sounds für die Offline-Nutzung.
 * Bei Änderungen an Dateien CACHE_VERSION erhöhen, damit Geräte die neue Version laden. */
const CACHE_VERSION = "klimperkiste-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/app.js",
  "./js/player.js",
  "./js/tracks.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./sounds/01-entchen.mp3",
  "./sounds/02-haenschen.mp3",
  "./sounds/03-sternchen.mp3",
  "./sounds/04-jakob.mp3",
  "./sounds/05-bauernhof.mp3",
  "./sounds/06-laemmchen.mp3",
  "./sounds/07-freude.mp3",
  "./sounds/08-gutenacht.mp3",
  "./sounds/09-bruecke.mp3",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache zuerst – die App funktioniert so komplett ohne Internet.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached =>
      cached ||
      fetch(event.request).then(res => {
        if (res.ok && new URL(event.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
        }
        return res;
      })
    )
  );
});
