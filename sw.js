/**
 * Service Worker for Portfolio Website
 *
 * Provides offline functionality and performance optimizations:
 * - Caches critical resources for offline access
 * - Implements cache-first strategy for static assets
 * - Network-first strategy for dynamic content
 * - Background sync for form submissions
 */

const CACHE_NAME = "portfolio-v1.1.0";
const STATIC_CACHE = "portfolio-static-v1.1.0";
const DYNAMIC_CACHE = "portfolio-dynamic-v1.1.0";
const IMAGE_CACHE = "portfolio-images-v1.1.0";

// Cache size limits
const MAX_IMAGE_CACHE_SIZE = 50; // Maximum number of images to cache
const MAX_DYNAMIC_CACHE_SIZE = 30; // Maximum number of dynamic pages to cache

// Resources to cache immediately on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/project-detail.html",
  "/styles/main.css",
  "/scripts/main.js",
  "/scripts/utils/imageOptimization.js",
  "/scripts/utils/imageManifest.js",
  "/scripts/components/lightbox.js",
  "/scripts/components/pageTransitions.js",
  "/manifest.json",
];

// Critical images to cache
const CRITICAL_IMAGES = [
  "/assets/images/project-1-medium.webp",
  "/assets/images/project-1-medium.jpg",
  "/assets/images/project-2-medium.webp",
  "/assets/images/project-2-medium.jpg",
  "/assets/images/project-3-medium.webp",
  "/assets/images/project-3-medium.jpg",
];

// Network timeout for cache fallback
const NETWORK_TIMEOUT = 3000;

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Installing...");

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("📦 Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache critical images
      caches.open(IMAGE_CACHE).then((cache) => {
        console.log("🖼️ Service Worker: Caching critical images");
        return cache.addAll(CRITICAL_IMAGES.filter((url) => url));
      }),
    ])
      .then(() => {
        console.log("✅ Service Worker: Installation complete");
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker: Installation failed", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== IMAGE_CACHE
            ) {
              console.log("🗑️ Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker: Activation complete");
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // Route different types of requests
    if (isStaticAsset(url.pathname)) {
      return await handleStaticAsset(request);
    } else if (isImage(url.pathname)) {
      return await handleImage(request);
    } else if (isHTMLPage(url.pathname)) {
      return await handleHTMLPage(request);
    } else {
      return await handleDynamic(request);
    }
  } catch (error) {
    console.error("Service Worker: Fetch error", error);
    return await handleOfflineFallback(request);
  }
}

// Handle static assets (CSS, JS) - Cache First
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Return cached version and update in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }

  // Fetch from network and cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Handle images - Cache First with fallback
async function handleImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);

    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());

      // Limit cache size to prevent excessive storage
      await limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed requests
    return await getPlaceholderImage();
  }
}

// Handle HTML pages - Network First with cache fallback
async function handleHTMLPage(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cached version
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to offline page
    return await getOfflinePage();
  }
}

// Handle dynamic content - Network First
async function handleDynamic(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());

      // Limit cache size to prevent excessive storage
      await limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response("Offline", { status: 503 });
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail background updates
  }
}

// Fetch with timeout
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network timeout")), timeout)
    ),
  ]);
}

// Get placeholder image for failed image requests
async function getPlaceholderImage() {
  const cache = await caches.open(IMAGE_CACHE);

  // Try to get a cached placeholder
  const placeholderResponse = await cache.match(
    "/assets/images/placeholder.jpg"
  );

  if (placeholderResponse) {
    return placeholderResponse;
  }

  // Generate a simple placeholder response
  return new Response(
    '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Image unavailable</text></svg>',
    {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "max-age=86400",
      },
    }
  );
}

// Get offline page
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  const offlineResponse = await cache.match("/");

  if (offlineResponse) {
    return offlineResponse;
  }

  // Generate a simple offline page
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Rebecca Lee Jin Portfolio</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
        .offline-message { max-width: 400px; margin: 0 auto; }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>This page isn't available offline. Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    }
  );
}

// Handle offline fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);

  if (isImage(url.pathname)) {
    return await getPlaceholderImage();
  } else if (isHTMLPage(url.pathname)) {
    return await getOfflinePage();
  } else {
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Cache size management
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    console.log(
      `🗑️ Service Worker: Trimmed ${keysToDelete.length} items from ${cacheName}`
    );
  }
}

// Utility functions
function isStaticAsset(pathname) {
  return pathname.match(/\.(css|js|woff2?|ttf|eot)$/);
}

function isImage(pathname) {
  return pathname.match(/\.(jpg|jpeg|png|webp|svg|gif)$/);
}

function isHTMLPage(pathname) {
  return (
    pathname === "/" || pathname.endsWith(".html") || !pathname.includes(".")
  );
}

// Background sync for form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "contact-form") {
    event.waitUntil(syncContactForm());
  }
});

async function syncContactForm() {
  try {
    // Get pending form submissions from IndexedDB
    const submissions = await getPendingSubmissions();

    for (const submission of submissions) {
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submission.data),
        });

        if (response.ok) {
          await removePendingSubmission(submission.id);
          console.log("✅ Form submission synced successfully");
        }
      } catch (error) {
        console.error("❌ Failed to sync form submission:", error);
      }
    }
  } catch (error) {
    console.error("❌ Background sync failed:", error);
  }
}

// IndexedDB helpers (simplified)
async function getPendingSubmissions() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function removePendingSubmission(id) {
  // In a real implementation, this would remove from IndexedDB
}

// Push notification handling
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if the site is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log("🚀 Service Worker: Loaded and ready");
