/// <reference lib="WebWorker" />

// Service Workers are quite broken in ts, this is a workaround
import {
  CacheFirst,
  NetworkFirst,
  RemixNavigationHandler,
  matchRequest,
} from "@remix-pwa/sw";

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

const assetsCache = new CacheFirst({
  cacheName: `assets-${PRODUCT_VERSION}`,
  matchOptions: {
    ignoreSearch: true,
    ignoreVary: true,
  },
});

const loaderCache = new NetworkFirst({
  cacheName: `loader-cache-${PRODUCT_VERSION}`,
  isLoader: true,
});

const documentCache = new NetworkFirst({
  cacheName: `document-cache-${PRODUCT_VERSION}`,
});

const fetchHandler = (e: FetchEvent): Promise<Response> => {
  const matched = matchRequest(e.request, [
    "/build/",
    "/fonts/",
    "/favicon.ico",
  ]);

  switch (matched) {
    case "asset":
      return assetsCache.handle(e.request);
    case "loader":
      return loaderCache.handle(e.request);
    case "document":
      return documentCache.handle(e.request);
    default:
      return fetch(e.request);
  }
};

self.addEventListener("fetch", (e: FetchEvent) => {
  e.respondWith(fetchHandler(e));
});

const messageHandler = new RemixNavigationHandler({
  dataCacheName: "data-cache",
  documentCacheName: "document-cache",
});

self.addEventListener("message", (event) => {
  event.waitUntil(messageHandler.handle(event));
});
