/// <reference lib="WebWorker" />

// Service Workers are quite broken in ts, this is a workaround
import { cacheFirst, networkFirst } from "@remix-pwa/strategy";
import { RemixNavigationHandler, matchRequest } from "@remix-pwa/sw";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PRODUCT_VERSION = process.env.PRODUCT_VERSION;

self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("Service worker installed");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("Service worker activated");
  event.waitUntil(self.clients.claim());
});

const assetsCache = cacheFirst({
  cache: `assets-${PRODUCT_VERSION}`,
  cacheQueryOptions: { ignoreSearch: true, ignoreVary: true },
});

const loaderCache = networkFirst({
  cache: `loader-cache-${PRODUCT_VERSION}`,
});

const documentCache = networkFirst({
  cache: `document-cache-${PRODUCT_VERSION}`,
});

const fetchHandler = (e: FetchEvent): Promise<Response> => {
  const matched = matchRequest(e.request, [
    "/build/",
    "/fonts/",
    "/favicon.ico",
  ]);

  switch (matched) {
    case "asset":
      return assetsCache(e.request);
    case "loader":
      return loaderCache(e.request);
    case "document":
      return documentCache(e.request);
    default:
      return fetch(e.request);
  }
};

self.addEventListener("fetch", (e: FetchEvent) => {
  e.respondWith(fetchHandler(e));
});

const messageHandler = new RemixNavigationHandler({
  dataCache: "data-cache",
  documentCache: "document-cache",
});

self.addEventListener("message", (event) => {
  event.waitUntil(messageHandler.handle(event));
});
