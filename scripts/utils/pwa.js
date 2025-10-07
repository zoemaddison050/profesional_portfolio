/**
 * Progressive Web App Utilities
 *
 * Handles PWA features including:
 * - Service worker registration
 * - Install prompt management
 * - Offline status detection
 * - Background sync for forms
 */

class PWAManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.installPrompt = null;
    this.serviceWorker = null;

    this.init();
  }

  async init() {
    // Register service worker
    await this.registerServiceWorker();

    // Setup install prompt
    this.setupInstallPrompt();

    // Setup offline detection
    this.setupOfflineDetection();

    // Setup background sync
    this.setupBackgroundSync();

    // Setup update notifications
    this.setupUpdateNotifications();
  }

  async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      this.serviceWorker = registration;

      console.log("✅ Service Worker registered successfully");

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            this.showUpdateNotification();
          }
        });
      });
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  }

  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (event) => {
      // Prevent the default install prompt
      event.preventDefault();

      // Store the event for later use
      this.installPrompt = event;

      // Show custom install button
      this.showInstallButton();

      console.log("📱 PWA install prompt available");
    });

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      console.log("🎉 PWA installed successfully");
      this.hideInstallButton();
      this.installPrompt = null;

      // Track installation
      this.trackEvent("pwa_installed");
    });
  }

  async showInstallPrompt() {
    if (!this.installPrompt) {
      console.log("Install prompt not available");
      return false;
    }

    try {
      // Show the install prompt
      const result = await this.installPrompt.prompt();

      console.log("Install prompt result:", result.outcome);

      // Track user choice
      this.trackEvent("pwa_install_prompt", { outcome: result.outcome });

      // Clear the prompt
      this.installPrompt = null;

      return result.outcome === "accepted";
    } catch (error) {
      console.error("Error showing install prompt:", error);
      return false;
    }
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    let installButton = document.getElementById("pwa-install-button");

    if (!installButton) {
      installButton = document.createElement("button");
      installButton.id = "pwa-install-button";
      installButton.className = "btn btn--primary pwa-install-btn";
      installButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Install App
      `;

      installButton.addEventListener("click", () => {
        this.showInstallPrompt();
      });

      // Add to header or create floating button
      const header = document.querySelector(".header .nav__container");
      if (header) {
        header.appendChild(installButton);
      } else {
        // Create floating install button
        installButton.classList.add("pwa-install-btn--floating");
        document.body.appendChild(installButton);
      }
    }

    installButton.style.display = "flex";
  }

  hideInstallButton() {
    const installButton = document.getElementById("pwa-install-button");
    if (installButton) {
      installButton.style.display = "none";
    }
  }

  setupOfflineDetection() {
    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.showConnectionStatus("online");
      console.log("🌐 Back online");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.showConnectionStatus("offline");
      console.log("📱 Gone offline");
    });

    // Initial status
    if (!this.isOnline) {
      this.showConnectionStatus("offline");
    }
  }

  showConnectionStatus(status) {
    // Remove existing status
    const existingStatus = document.querySelector(".connection-status");
    if (existingStatus) {
      existingStatus.remove();
    }

    // Create status indicator
    const statusElement = document.createElement("div");
    statusElement.className = `connection-status connection-status--${status}`;

    if (status === "offline") {
      statusElement.innerHTML = `
        <div class="connection-status__content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          You're offline. Some features may be limited.
        </div>
      `;
    } else {
      statusElement.innerHTML = `
        <div class="connection-status__content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          Back online!
        </div>
      `;

      // Auto-hide online status after 3 seconds
      setTimeout(() => {
        if (statusElement.parentNode) {
          statusElement.remove();
        }
      }, 3000);
    }

    document.body.appendChild(statusElement);
  }

  setupBackgroundSync() {
    if (
      !("serviceWorker" in navigator) ||
      !("sync" in window.ServiceWorkerRegistration.prototype)
    ) {
      console.log("Background Sync not supported");
      return;
    }

    // Handle form submissions with background sync
    document.addEventListener("submit", (event) => {
      const form = event.target;

      if (form.classList.contains("contact-form") && !this.isOnline) {
        event.preventDefault();
        this.queueFormSubmission(form);
      }
    });
  }

  async queueFormSubmission(form) {
    if (!this.serviceWorker) return;

    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Store form data for background sync
      await this.storeFormSubmission(data);

      // Register background sync
      await this.serviceWorker.sync.register("contact-form");

      // Show queued message
      this.showFormMessage(
        form,
        "Message queued. Will be sent when you're back online.",
        "info"
      );

      console.log("📤 Form submission queued for background sync");
    } catch (error) {
      console.error("Failed to queue form submission:", error);
    }
  }

  async storeFormSubmission(data) {
    // In a real implementation, this would use IndexedDB
    const submissions = JSON.parse(
      localStorage.getItem("pendingSubmissions") || "[]"
    );
    submissions.push({
      id: Date.now(),
      data: data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("pendingSubmissions", JSON.stringify(submissions));
  }

  setupUpdateNotifications() {
    // Check for updates periodically
    if (this.serviceWorker) {
      setInterval(() => {
        this.serviceWorker.update();
      }, 60000); // Check every minute
    }
  }

  showUpdateNotification() {
    // Create update notification
    const notification = document.createElement("div");
    notification.className = "update-notification";
    notification.innerHTML = `
      <div class="update-notification__content">
        <div class="update-notification__text">
          <strong>Update Available</strong>
          <p>A new version of the app is available.</p>
        </div>
        <div class="update-notification__actions">
          <button class="btn btn--sm btn--outline" onclick="this.parentElement.parentElement.parentElement.remove()">
            Later
          </button>
          <button class="btn btn--sm btn--primary" onclick="window.location.reload()">
            Update
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds if no action
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  showFormMessage(form, message, type = "info") {
    const messageElement = document.createElement("div");
    messageElement.className = `form__message form__message--${type}`;
    messageElement.textContent = message;
    messageElement.setAttribute("role", "alert");

    form.insertBefore(messageElement, form.firstChild);

    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }

  trackEvent(eventName, data = {}) {
    // Track PWA events for analytics
    if (typeof gtag !== "undefined") {
      gtag("event", eventName, data);
    }

    console.log("📊 PWA Event:", eventName, data);
  }

  // Public methods
  isInstallable() {
    return !!this.installPrompt;
  }

  isInstalled() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  getConnectionStatus() {
    return this.isOnline ? "online" : "offline";
  }
}

// Initialize PWA manager
window.pwaManager = new PWAManager();

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = PWAManager;
}
