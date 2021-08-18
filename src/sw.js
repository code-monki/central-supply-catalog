const version = 2;
const cacheName = `csc-cache-v${version}`;
const indexFilename = `_data/searchindex.idx`;


self.addEventListener('install', ev => {
  console.log(`Version ${cacheName} installed`);
  ev.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        cache.add(indexFilename).then(
            () => console.log(`${cacheName} has been updated`)
          ),
          (err) => {
            console.warn(`Failed to update ${cacheName}`)
          }
      })
  );
});

self.addEventListener('activate', ev => {
  console.log(`Version ${cacheName} activated`);
  ev.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(key => key != cacheName).map(key => caches.delete(key))
        )
      })
  );
});

self.addEventListener('fetch', ev => {
  ev.respondWith(
    caches.match(ev.request)
      .then(cacheRes => {
        return cacheRes || fetch(ev.request)
          .then(fetchResponse => {
            caches.open(cacheName)
              .then(cache =>{
                cache.put(ev.request, fetchResponse.clone())
                return fetchResponse;
              })
          })
      })
  )
});
