/// <reference lib="webworker" />
export {}; // prevent global scope conflicts

import { version as VERSION } from "../../package.json";

// Force self to be recognized as a ServiceWorker
declare const self: ServiceWorkerGlobalScope;

const NAME = "Flatlands";
const CACHE_NAME = `${NAME} v${VERSION}` as const;

self.addEventListener("activate", (event) => {
  (event as ExtendableEvent).waitUntil(removeOutdatedVersions());
});

self.addEventListener("fetch", (event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(matchRequest(fetchEvent.request));
});

/**
 * Clears out old versions of the app from Cache Storage.
 */
async function removeOutdatedVersions(): Promise<void> {
  const keys = await caches.keys();

  await Promise.all(keys.map(async (key) => {
    const isOutdatedVersion = key.startsWith(NAME) && key !== CACHE_NAME;
    if (isOutdatedVersion) {
      await caches.delete(key);
    }
  }));

  // self is now properly typed, this works
  await self.clients.claim();
}

/**
 * Matches a network request with its cached counterpart from Cache Storage.
 * If not cached, fetch from network, store in cache, and return it.
 */
async function matchRequest(request: Request): Promise<Response> {
  let response = await caches.match(request);
  if (response !== undefined) return response;

  response = await fetch(request);
  await cacheRequest(request, response);

  return response;
}

/**
 * Adds a network request and response to Cache Storage.
 */
async function cacheRequest(request: Request, response: Response): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
    }
