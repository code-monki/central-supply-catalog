const version = 2;
const cacheName = `csc-cache-v${version}`;

const indexFilename = (location.pathname.match("((?:/central-supply-catalog/)?)")[0])
  ? `${location.pathname[0]}_data/searchindex.idx`
  : `/_data/searchindex.idx`
// const indexFilename = `${
//   (location.pathname.match("((?:/central-supply-catalog/)?)")[0]) 
//     ? location.pathname[0]
//     : '/'
//   }_data/searchindex.idx`;
// console.log(`${location.host}${location.pathname[0]}${indexFilename}`);
console.log(`indexFilename: ${indexFilename}`);
const preCache = [indexFilename]

this.addEventListener('install', function(ev) {
  ev.waitUntil(
    caches.open(cacheName).then(cache => cache.add(indexFilename))
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
    return fetch(request);
  }

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  await cache.put(request, response.clone());
  return response;
});
