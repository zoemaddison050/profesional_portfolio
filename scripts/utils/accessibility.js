/**
 * Accessibility Enhancement Module
 * Provides comprehensive accessibility features and utilities
 */

class AccessibilityManager {
  constructor() {
    this.liveRegion = null;
    this.focusTrap = null;
    this.reducedMotion = false;
    this.highContrast = false;

    this.init();
  }

  init() {
    this.setupLiveRegion();
    this.setupMediaQueryListeners();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupHeadingNavigation();
    this.setupLandmarkNavigation();
    this.enhanceFormAccessibility();
    this.setupModalAccessibility();
  }

  /**
   * Setup live region for screen reader announcements
   */
  setupLiveRegion() {
    this.liveRegion = document.getElementById("live-region");
    if (!this.liveRegion) {
      this.liveRegion = document.createElement("div");
      this.liveRegion.id = "live-region";
      this.liveRegion.className = "live-region";
      this.liveRegion.setAttribute("aria-live", "polite");
      this.liveRegion.setAttribute("aria-atomic", "true");
      document.body.appendChild(this.liveRegion);
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = "polite") {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute("aria-live", priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      this.liveRegion.textContent = "";
    }, 1000);
  }

  /**
   * Setup media query listeners for accessibility preferences
   */
  setupMediaQueryListeners() {
    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    this.handleReducedMotion(reducedMotionQuery);
    reducedMotionQuery.addEventListener("change", (e) =>
      this.handleReducedMotion(e)
    );

    // High contrast preference
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    this.handleHighContrast(highContrastQuery);
    highContrastQuery.addEventListener("change", (e) =>
      this.handleHighContrast(e)
    );

    // Color scheme preference
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.handleColorScheme(darkModeQuery);
    darkModeQuery.addEventListener("change", (e) => this.handleColorScheme(e));
  }

  /**
   * Handle reduced motion preference
   */
  handleReducedMotion(mediaQuery) {
    this.reducedMotion = mediaQuery.matches;
    document.documentElement.classList.toggle(
      "reduce-motion",
      this.reducedMotion
    );

    if (this.reducedMotion) {
      this.announce(
        "Animations have been reduced based on your system preferences"
      );
    }
  }

  /**
   * Handle high contrast preference
   */
  handleHighContrast(mediaQuery) {
    this.highContrast = mediaQuery.matches;
    document.documentElement.classList.toggle(
      "high-contrast",
      this.highContrast
    );

    if (this.highContrast) {
      this.announce("High contrast mode is active");
    }
  }

  /**
   * Handle color scheme preference
   */
  handleColorScheme(mediaQuery) {
    const isDark = mediaQuery.matches;
    document.documentElement.classList.toggle("dark-mode", isDark);
  }

  /**
   * Setup enhanced keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "Escape":
          this.handleEscapeKey(e);
          break;
        case "Tab":
          this.handleTabKey(e);
          break;
        case "Enter":
        case " ":
          this.handleActivationKeys(e);
          break;
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          this.handleArrowKeys(e);
          break;
        case "Home":
        case "End":
          this.handleHomeEndKeys(e);
          break;
      }
    });

    // Add keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.altKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            this.focusHeading(1);
            break;
          case "2":
            e.preventDefault();
            this.focusHeading(2);
            break;
          case "3":
            e.preventDefault();
            this.focusHeading(3);
            break;
          case "m":
            e.preventDefault();
            this.focusMainContent();
            break;
          case "n":
            e.preventDefault();
            this.focusNavigation();
            break;
        }
      }
    });
  }

  /**
   * Handle escape key for closing modals, menus, etc.
   */
  handleEscapeKey(e) {
    // Close mobile menu
    const navToggle = document.querySelector(".nav__toggle");
    if (navToggle && navToggle.getAttribute("aria-expanded") === "true") {
      navToggle.click();
      navToggle.focus();
      return;
    }

    // Close modals
    const openModal = document.querySelector(".modal--open");
    if (openModal) {
      this.closeModal(openModal);
      return;
    }

    // Close lightbox
    const openLightbox = document.querySelector(".lightbox--open");
    if (openLightbox) {
      this.closeLightbox(openLightbox);
      return;
    }
  }

  /**
   * Handle tab key for focus management
   */
  handleTabKey(e) {
    // Trap focus in modals
    const modal = document.querySelector(".modal--open");
    if (modal) {
      this.trapFocus(e, modal);
    }
  }

  /**
   * Handle activation keys (Enter/Space) for custom interactive elements
   */
  handleActivationKeys(e) {
    const target = e.target;

    // Handle custom buttons
    if (target.matches('[role="button"]') && !target.matches("button")) {
      e.preventDefault();
      target.click();
    }

    // Handle menu items
    if (target.matches('[role="menuitem"]')) {
      e.preventDefault();
      target.click();
    }
  }

  /**
   * Handle arrow keys for navigation
   */
  handleArrowKeys(e) {
    const target = e.target;

    // Handle menu navigation
    if (target.matches('[role="menuitem"]')) {
      e.preventDefault();
      this.navigateMenu(e.key, target);
    }

    // Handle tab navigation
    if (target.matches('[role="tab"]')) {
      e.preventDefault();
      this.navigateTabs(e.key, target);
    }
  }

  /**
   * Handle Home/End keys
   */
  handleHomeEndKeys(e) {
    const target = e.target;

    if (target.matches('[role="menuitem"]') || target.matches('[role="tab"]')) {
      e.preventDefault();
      const container = target.closest('[role="menubar"], [role="tablist"]');
      if (container) {
        const items = container.querySelectorAll(
          '[role="menuitem"], [role="tab"]'
        );
        const targetItem =
          e.key === "Home" ? items[0] : items[items.length - 1];
        targetItem.focus();
      }
    }
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Track focus for debugging
    if (process.env.NODE_ENV === "development") {
      document.addEventListener("focusin", (e) => {
        console.log("Focus:", e.target);
      });
    }

    // Manage focus indicators
    document.addEventListener("mousedown", () => {
      document.body.classList.add("using-mouse");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        document.body.classList.remove("using-mouse");
      }
    });

    // Skip link functionality
    const skipLinks = document.querySelectorAll(".skip-link");
    skipLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          this.focusElement(target);

          // Announce skip action
          this.announce(
            `Skipped to ${
              target.getAttribute("aria-label") ||
              target.textContent ||
              targetId
            }`
          );
        }
      });
    });
  }

  /**
   * Focus an element and make it programmatically focusable
   */
  focusElement(element) {
    if (!element) return;

    // Make element focusable if it isn't already
    if (
      !element.hasAttribute("tabindex") &&
      !element.matches("a, button, input, textarea, select")
    ) {
      element.setAttribute("tabindex", "-1");
    }

    element.focus();

    // Remove temporary tabindex after blur
    if (element.getAttribute("tabindex") === "-1") {
      element.addEventListener(
        "blur",
        () => {
          element.removeAttribute("tabindex");
        },
        { once: true }
      );
    }
  }

  /**
   * Setup heading navigation
   */
  setupHeadingNavigation() {
    this.headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
  }

  /**
   * Focus specific heading level
   */
  focusHeading(level) {
    const heading = document.querySelector(`h${level}`);
    if (heading) {
      this.focusElement(heading);
      this.announce(`Navigated to ${heading.textContent}`);
    }
  }

  /**
   * Focus main content
   */
  focusMainContent() {
    const main = document.querySelector("main, #main-content");
    if (main) {
      this.focusElement(main);
      this.announce("Navigated to main content");
    }
  }

  /**
   * Focus navigation
   */
  focusNavigation() {
    const nav = document.querySelector("nav, #navigation");
    if (nav) {
      this.focusElement(nav);
      this.announce("Navigated to main navigation");
    }
  }

  /**
   * Setup landmark navigation
   */
  setupLandmarkNavigation() {
    // Add landmark shortcuts
    const landmarks = {
      main: "main content",
      nav: "navigation",
      aside: "sidebar",
      footer: "footer",
      '[role="banner"]': "banner",
      '[role="contentinfo"]': "content information",
      '[role="complementary"]': "complementary content",
    };

    Object.entries(landmarks).forEach(([selector, description]) => {
      const element = document.querySelector(selector);
      if (element && !element.hasAttribute("aria-label")) {
        element.setAttribute("aria-label", description);
      }
    });
  }

  /**
   * Enhance form accessibility
   */
  enhanceFormAccessibility() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      // Add form labels and descriptions
      const inputs = form.querySelectorAll("input, textarea, select");

      inputs.forEach((input) => {
        // Ensure proper labeling
        if (
          !input.hasAttribute("aria-label") &&
          !input.hasAttribute("aria-labelledby")
        ) {
          const label = form.querySelector(`label[for="${input.id}"]`);
          if (!label && input.id) {
            console.warn(`Input ${input.id} is missing a label`);
          }
        }

        // Add error announcement
        input.addEventListener("invalid", (e) => {
          const message = e.target.validationMessage;
          this.announce(`Error: ${message}`);
        });

        // Add success announcement
        input.addEventListener("input", (e) => {
          if (
            e.target.checkValidity() &&
            e.target.classList.contains("form__input--error")
          ) {
            this.announce("Input is now valid");
          }
        });
      });

      // Form submission feedback
      form.addEventListener("submit", (e) => {
        this.announce("Form submitted");
      });
    });
  }

  /**
   * Setup modal accessibility
   */
  setupModalAccessibility() {
    const modals = document.querySelectorAll(".modal");

    modals.forEach((modal) => {
      // Ensure proper ARIA attributes
      if (!modal.hasAttribute("role")) {
        modal.setAttribute("role", "dialog");
      }
      if (!modal.hasAttribute("aria-modal")) {
        modal.setAttribute("aria-modal", "true");
      }

      // Setup close button
      const closeButton = modal.querySelector(".modal__close");
      if (closeButton) {
        closeButton.addEventListener("click", () => this.closeModal(modal));
      }
    });
  }

  /**
   * Open modal with accessibility features
   */
  openModal(modal) {
    if (!modal) return;

    // Store currently focused element
    this.previousFocus = document.activeElement;

    // Show modal
    modal.classList.add("modal--open");
    document.body.style.overflow = "hidden";

    // Focus first focusable element in modal
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Announce modal opening
    const modalTitle = modal.querySelector("h1, h2, h3, .modal__title");
    if (modalTitle) {
      this.announce(`Modal opened: ${modalTitle.textContent}`);
    }
  }

  /**
   * Close modal and restore focus
   */
  closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("modal--open");
    document.body.style.overflow = "";

    // Restore focus
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }

    this.announce("Modal closed");
  }

  /**
   * Trap focus within an element
   */
  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Navigate menu items with arrow keys
   */
  navigateMenu(key, currentItem) {
    const menu = currentItem.closest('[role="menubar"]');
    if (!menu) return;

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    const currentIndex = items.indexOf(currentItem);
    let nextIndex;

    switch (key) {
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
    }

    if (nextIndex !== undefined) {
      items[nextIndex].focus();
    }
  }

  /**
   * Navigate tabs with arrow keys
   */
  navigateTabs(key, currentTab) {
    const tabList = currentTab.closest('[role="tablist"]');
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(currentTab);
    let nextIndex;

    switch (key) {
      case "ArrowLeft":
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case "ArrowRight":
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
    }

    if (nextIndex !== undefined) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  }

  /**
   * Get accessibility summary for debugging
   */
  getAccessibilitySummary() {
    const summary = {
      reducedMotion: this.reducedMotion,
      highContrast: this.highContrast,
      headings: this.headings.length,
      landmarks: document.querySelectorAll(
        'main, nav, aside, footer, [role="banner"], [role="contentinfo"]'
      ).length,
      skipLinks: document.querySelectorAll(".skip-link").length,
      altTexts: document.querySelectorAll("img[alt]").length,
      missingAltTexts: document.querySelectorAll("img:not([alt])").length,
      ariaLabels: document.querySelectorAll("[aria-label]").length,
      focusableElements: document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).length,
    };

    console.table(summary);
    return summary;
  }
}

// Initialize accessibility manager
window.accessibilityManager = new AccessibilityManager();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = AccessibilityManager;
}
