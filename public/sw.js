/* global self, caches, URL, fetch */

const CACHE_NAME = 'sharkdown-static-v3';
const APP_SHELL = [
  self.registration.scope,
  `${self.registration.scope}manifest.webmanifest`,
  `${self.registration.scope}icon.svg`,
  `${self.registration.scope}logo.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => cacheShellResponse(request, response))
        .catch(() => cachedShellFallback(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(self.registration.scope));
    }),
  );
});

function cacheShellResponse(request, response) {
  if (response.ok) {
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(request, response.clone());
      cache.put(self.registration.scope, response.clone());
    });
  }
  return response;
}

function cachedShellFallback(request) {
  return caches.match(request).then((cached) => cached || caches.match(self.registration.scope));
}
