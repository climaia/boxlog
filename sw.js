// BoxLog: funciona sin señal. Cambiá VERSION cada vez que subas una versión nueva de index.html.
var VERSION = 'boxlog-v1';
var BASE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var url = new URL(r.url);
  var propio = url.origin === self.location.origin;
  var fuente = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propio && !fuente) return;
  if (r.mode === 'navigate') {
    // primero la red (para tomar versiones nuevas); sin señal, la copia guardada
    e.respondWith(fetch(r).then(function (res) {
      var copia = res.clone(); caches.open(VERSION).then(function (c) { c.put('index.html', copia); }); return res;
    }).catch(function () { return caches.match('index.html').then(function (m) { return m || caches.match('./'); }); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (m) {
    return m || fetch(r).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copia = res.clone(); caches.open(VERSION).then(function (c) { c.put(r, copia); }); }
      return res;
    });
  }));
});
