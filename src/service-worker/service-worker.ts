/// <reference lib="webworker" />
import { version as VERSION } from "../../package.json";

const NAME = "Flatlands";
const CACHE_NAME = `${NAME} v${VERSION}` as const;

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(removeOutdatedVersions());
});

self.addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(matchRequest(event.request));
});

/**
 * Clears out old versions of the app from Cache Storage.
 */
async function removeOutdatedVersions(): Promise<void> {
  const keys = await caches.keys();

  await Promise.all(keys.map(async key => {
    const isOutdatedVersion = key.startsWith(NAME) && key !== CACHE_NAME;

    if (isOutdatedVersion) {
      await caches.delete(key);
    }
  }));

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
