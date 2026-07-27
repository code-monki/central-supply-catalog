const keyPrefix = 'csc-search-index:';

const cacheKey = (version) => `${keyPrefix}${version}`;

const isDocumentList = (value) => Array.isArray(value) && value.every((item) => item && item.sku);

const readCachedDocuments = (version) => {
  try {
    const cached = localStorage.getItem(cacheKey(version));
    if (!cached) return null;

    const documents = JSON.parse(cached);
    return isDocumentList(documents) ? documents : null;
  } catch {
    return null;
  }
};

const writeCachedDocuments = (version, documents) => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(keyPrefix) && key !== cacheKey(version)) {
        localStorage.removeItem(key);
      }
    }

    localStorage.setItem(cacheKey(version), JSON.stringify(documents));
  } catch {
    // Search still works from the network response if storage is full or blocked.
  }
};

export const hasCachedSearchIndex = (version) => readCachedDocuments(version) !== null;

export const loadSearchDocuments = async ({ url, version }) => {
  const cached = readCachedDocuments(version);
  if (cached) return cached;

  const response = await fetch(`${url}?v=${encodeURIComponent(version)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load search index: ${response.status}`);
  }

  const payload = await response.json();
  const documents = Array.isArray(payload) ? payload : payload.documents;

  if (!isDocumentList(documents)) {
    throw new Error('Search index payload is invalid');
  }

  writeCachedDocuments(payload.version || version, documents);
  return documents;
};

export const warmSearchIndex = ({ url, version }) => {
  if (hasCachedSearchIndex(version)) return;

  const run = () => {
    loadSearchDocuments({ url, version }).catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 3000 });
  } else {
    window.setTimeout(run, 1000);
  }
};
