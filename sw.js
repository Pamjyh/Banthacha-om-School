self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (key) {
      return key.indexOf('banthacha-om-') === 0;
    }).map(function (key) {
      return caches.delete(key);
    }));
    await self.registration.unregister();
    var clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(clients.map(function (client) {
      return client.navigate('https://banthachaom-school.github.io/');
    }));
  })());
});

self.addEventListener('fetch', function (event) {
  if (event.request.mode === 'navigate') {
    event.respondWith(Response.redirect('https://banthachaom-school.github.io/', 302));
  }
});
