/**
 * Page Transitions Component
 * Provides smooth page transitions and navigation enhancements
 */

class PageTransitions {
  constructor() {
    this.isTransitioning = false;
    this.transitionDuration = 300;

    this.init();
  }

  init() {
    this.setupTransitions();
    this.setupSmoothScrolling();
    this.setupBackToTop();
  }

  setupTransitions() {
    // Add transition overlay to body
    this.createTransitionOverlay();

    // Handle internal navigation links
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");

      if (!link) return;

      const href = link.getAttribute("href");

      // Skip external links, anchors, and special links
      if (this.shouldSkipTransition(href, link)) return;

      e.preventDefault();
      this.navigateWithTransition(href);
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.transitioned) {
        this.navigateWithTransition(window.location.pathname, false);
      }
    });

    // Add initial state to history
    if (window.history.state === null) {
      window.history.replaceState(
        { transitioned: true },
        "",
        window.location.pathname
      );
    }
  }

  createTransitionOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "page-transition-overlay";
    this.overlay.innerHTML = `
      <div class="page-transition-content">
        <div class="page-transition-spinner"></div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    // Add CSS for transition overlay
    if (!document.getElementById("page-transition-styles")) {
      const styles = document.createElement("style");
      styles.id = "page-transition-styles";
      styles.textContent = `
        .page-transition-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-background, #ffffff);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 300ms ease-in-out;
        }

        .page-transition-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .page-transition-content {
          text-align: center;
        }

        .page-transition-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border-light, #f3f4f6);
          border-top: 3px solid var(--color-primary, #2563eb);
          border-radius: 50%;
          animation: page-transition-spin 1s linear infinite;
        }

        @keyframes page-transition-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .page-fade-in {
          animation: page-fade-in 300ms ease-out;
        }

        @keyframes page-fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  shouldSkipTransition(href, link) {
    // Skip if already transitioning
    if (this.isTransitioning) return true;

    // Skip external links
    if (href.startsWith("http") && !href.includes(window.location.hostname))
      return true;

    // Skip anchor links
    if (href.startsWith("#")) return true;

    // Skip mailto and tel links
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return true;

    // Skip links with download attribute
    if (link.hasAttribute("download")) return true;

    // Skip links that open in new tab
    if (link.target === "_blank") return true;

    // Skip links with data-no-transition attribute
    if (link.hasAttribute("data-no-transition")) return true;

    return false;
  }

  async navigateWithTransition(url, pushState = true) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    try {
      // Show transition overlay
      this.overlay.classList.add("active");

      // Wait for transition to start
      await this.wait(50);

      // Fetch new page content
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, "text/html");

      // Update page content
      await this.updatePageContent(newDoc);

      // Update browser history
      if (pushState) {
        window.history.pushState({ transitioned: true }, "", url);
      }

      // Hide transition overlay
      this.overlay.classList.remove("active");

      // Add fade-in animation to main content
      const main = document.querySelector("main");
      if (main) {
        main.classList.add("page-fade-in");
        setTimeout(() => main.classList.remove("page-fade-in"), 300);
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Reinitialize components that might need it
      this.reinitializeComponents();
    } catch (error) {
      console.error("Page transition failed:", error);
      // Fallback to normal navigation
      window.location.href = url;
    } finally {
      this.isTransitioning = false;
    }
  }

  async updatePageContent(newDoc) {
    // Update title
    document.title = newDoc.title;

    // Update meta tags
    this.updateMetaTags(newDoc);

    // Update main content
    const currentMain = document.querySelector("main");
    const newMain = newDoc.querySelector("main");

    if (currentMain && newMain) {
      currentMain.innerHTML = newMain.innerHTML;
    }

    // Update navigation active states
    this.updateNavigationStates(newDoc);

    // Update any dynamic content that might have changed
    this.updateDynamicContent(newDoc);
  }

  updateMetaTags(newDoc) {
    // Update description
    const currentDesc = document.querySelector('meta[name="description"]');
    const newDesc = newDoc.querySelector('meta[name="description"]');
    if (currentDesc && newDesc) {
      currentDesc.content = newDesc.content;
    }

    // Update Open Graph tags
    const ogTags = ["og:title", "og:description", "og:url", "og:image"];
    ogTags.forEach((property) => {
      const current = document.querySelector(`meta[property="${property}"]`);
      const newTag = newDoc.querySelector(`meta[property="${property}"]`);
      if (current && newTag) {
        current.content = newTag.content;
      }
    });

    // Update Twitter Card tags
    const twitterTags = [
      "twitter:title",
      "twitter:description",
      "twitter:image",
    ];
    twitterTags.forEach((name) => {
      const current = document.querySelector(`meta[name="${name}"]`);
      const newTag = newDoc.querySelector(`meta[name="${name}"]`);
      if (current && newTag) {
        current.content = newTag.content;
      }
    });
  }

  updateNavigationStates(newDoc) {
    // Update navigation active states
    const currentNavLinks = document.querySelectorAll(".nav__link");
    const newNavLinks = newDoc.querySelectorAll(".nav__link");

    currentNavLinks.forEach((link, index) => {
      const newLink = newNavLinks[index];
      if (newLink) {
        // Copy classes and attributes
        link.className = newLink.className;
        if (newLink.hasAttribute("aria-current")) {
          link.setAttribute(
            "aria-current",
            newLink.getAttribute("aria-current")
          );
        } else {
          link.removeAttribute("aria-current");
        }
      }
    });
  }

  updateDynamicContent(newDoc) {
    // Update any other dynamic content that might have changed
    // This can be extended based on specific needs

    // Update breadcrumbs if they exist
    const currentBreadcrumb = document.querySelector(".breadcrumb");
    const newBreadcrumb = newDoc.querySelector(".breadcrumb");
    if (currentBreadcrumb && newBreadcrumb) {
      currentBreadcrumb.innerHTML = newBreadcrumb.innerHTML;
    }
  }

  reinitializeComponents() {
    // Reinitialize components that might need it after content update

    // Reinitialize lightbox if it exists
    if (window.lightbox && typeof window.lightbox.setupGallery === "function") {
      window.lightbox.setupGallery();
    }

    // Reinitialize image optimization
    if (
      window.imageOptimization &&
      typeof window.imageOptimization.init === "function"
    ) {
      window.imageOptimization.init();
    }

    // Dispatch custom event for other components to listen to
    document.dispatchEvent(
      new CustomEvent("pageTransitionComplete", {
        detail: { timestamp: Date.now() },
      })
    );
  }

  setupSmoothScrolling() {
    // Enhanced smooth scrolling for anchor links
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute("href");
      if (href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.querySelector(".header")?.offsetHeight || 0;
      const targetPosition = target.offsetTop - headerHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });

      // Update URL without triggering navigation
      if (window.history.pushState) {
        window.history.pushState(null, null, href);
      }
    });
  }

  setupBackToTop() {
    // Create back to top button
    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.innerHTML = "↑";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 48px;
      height: 48px;
      background-color: var(--color-primary, #2563eb);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    document.body.appendChild(backToTop);

    // Show/hide based on scroll position
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTop.style.opacity = "1";
        backToTop.style.visibility = "visible";
      } else {
        backToTop.style.opacity = "0";
        backToTop.style.visibility = "hidden";
      }
    });

    // Scroll to top on click
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize page transitions when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.pageTransitions = new PageTransitions();
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = PageTransitions;
}
