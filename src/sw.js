const version = 15;
const cacheName = `csc-cache-v${version}`;
const preCache = ['./_data/searchindex.json'];

this.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(cacheName).then((cache) =>
      cache.addAll(preCache).then(
        () => console.log(`Loaded ${preCache}`),
        (err) => console.log(err)
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key != cacheName).map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
  console.log(`Version ${cacheName} activated`);
});

const BS_MARKER = '/browser-sync/';

const resolveRequest = async (request) => {
  if (request.url.indexOf(BS_MARKER) > -1) {
    return await fetch(request);
  }

  if (request.method !== 'GET') {
    return await fetch(request);
  }

  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    throw new Error(`Unable to load ${request.url}`);
  }
};

self.addEventListener('fetch', (ev) => {
  ev.respondWith(resolveRequest(ev.request));
});
