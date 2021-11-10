const version = 8;
const cacheName = `csc-cache-v${version}`;
const preCache = ['/_data/searchindex.idx']

this.addEventListener('install', function(ev) {
  ev.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(preCache)
        .then(
          () => console.log(`Loaded ${preCache}`),
          (err => console.log(err))
        )
      )
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key != cacheName).map((key) => caches.delete(key)));
    })
  );
  console.log(`Version ${cacheName} activated`);
});

const BS_MARKER = "/browser-sync/";

self.addEventListener("fetch", async ({ request }) => {
  if (request.url.indexOf(BS_MARKER) > -1) {
    return await fetch(request);
  }

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  // console.log(request);
  const response = await fetch(request);
  await cache.put(request, response.clone());
  return response;
});
