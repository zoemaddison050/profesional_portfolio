/**
 * Lightbox Gallery Component
 * Provides image gallery functionality with keyboard navigation and accessibility
 */

class Lightbox {
  constructor() {
    this.modal = document.getElementById("lightbox-modal");
    this.image = document.getElementById("lightbox-image");
    this.title = document.getElementById("lightbox-title");
    this.closeButtons = document.querySelectorAll("[data-lightbox-close]");
    this.prevButton = document.querySelector("[data-lightbox-prev]");
    this.nextButton = document.querySelector("[data-lightbox-next]");
    this.galleryButtons = document.querySelectorAll("[data-lightbox]");

    this.currentIndex = 0;
    this.images = [];
    this.isOpen = false;
    this.focusedElementBeforeModal = null;

    this.init();
  }

  init() {
    if (!this.modal) return;

    this.setupGallery();
    this.bindEvents();
  }

  setupGallery() {
    // Collect all gallery images
    this.galleryButtons.forEach((button, index) => {
      const src = button.dataset.src || button.querySelector("img")?.src;
      const alt = button.querySelector("img")?.alt || "Gallery image";

      if (src) {
        this.images.push({ src, alt, index });
        button.dataset.index = index;
      }
    });
  }

  bindEvents() {
    // Gallery button clicks
    this.galleryButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const index = parseInt(button.dataset.index);
        this.open(index);
      });
    });

    // Close button clicks
    this.closeButtons.forEach((button) => {
      button.addEventListener("click", () => this.close());
    });

    // Navigation buttons
    if (this.prevButton) {
      this.prevButton.addEventListener("click", () => this.prev());
    }

    if (this.nextButton) {
      this.nextButton.addEventListener("click", () => this.next());
    }

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;

      switch (e.key) {
        case "Escape":
          this.close();
          break;
        case "ArrowLeft":
          this.prev();
          break;
        case "ArrowRight":
          this.next();
          break;
      }
    });

    // Prevent body scroll when modal is open
    this.modal.addEventListener("transitionend", () => {
      if (this.isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
  }

  open(index = 0) {
    if (this.images.length === 0) return;

    this.currentIndex = Math.max(0, Math.min(index, this.images.length - 1));
    this.focusedElementBeforeModal = document.activeElement;

    this.updateImage();
    this.updateNavigation();

    this.modal.setAttribute("aria-hidden", "false");
    this.isOpen = true;

    // Focus management
    setTimeout(() => {
      this.closeButtons[0]?.focus();
    }, 100);

    // Trap focus within modal
    this.trapFocus();
  }

  close() {
    if (!this.isOpen) return;

    this.modal.setAttribute("aria-hidden", "true");
    this.isOpen = false;

    // Restore focus
    if (this.focusedElementBeforeModal) {
      this.focusedElementBeforeModal.focus();
    }

    // Remove focus trap
    this.removeFocusTrap();
  }

  prev() {
    if (this.images.length <= 1) return;

    this.currentIndex =
      this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;

    this.updateImage();
    this.updateNavigation();
  }

  next() {
    if (this.images.length <= 1) return;

    this.currentIndex =
      this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;

    this.updateImage();
    this.updateNavigation();
  }

  updateImage() {
    const currentImage = this.images[this.currentIndex];
    if (!currentImage) return;

    // Add loading state
    this.image.style.opacity = "0.5";

    // Create new image to preload
    const img = new Image();
    img.onload = () => {
      this.image.src = currentImage.src;
      this.image.alt = currentImage.alt;
      this.title.textContent = currentImage.alt;
      this.image.style.opacity = "1";
    };

    img.onerror = () => {
      console.error("Failed to load image:", currentImage.src);
      this.image.style.opacity = "1";
    };

    img.src = currentImage.src;
  }

  updateNavigation() {
    if (!this.prevButton || !this.nextButton) return;

    // Show/hide navigation based on number of images
    const showNav = this.images.length > 1;
    this.prevButton.style.display = showNav ? "flex" : "none";
    this.nextButton.style.display = showNav ? "flex" : "none";

    // Update button states
    if (showNav) {
      this.prevButton.disabled = false;
      this.nextButton.disabled = false;

      // Update ARIA labels with current position
      this.prevButton.setAttribute(
        "aria-label",
        `Previous image (${this.currentIndex + 1} of ${this.images.length})`
      );
      this.nextButton.setAttribute(
        "aria-label",
        `Next image (${this.currentIndex + 1} of ${this.images.length})`
      );
    }
  }

  trapFocus() {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.focusTrapHandler = (e) => {
      if (e.key !== "Tab") return;

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
    };

    document.addEventListener("keydown", this.focusTrapHandler);
  }

  removeFocusTrap() {
    if (this.focusTrapHandler) {
      document.removeEventListener("keydown", this.focusTrapHandler);
      this.focusTrapHandler = null;
    }
  }

  // Public method to add new images dynamically
  addImage(src, alt, index = null) {
    const newImage = { src, alt, index: index || this.images.length };

    if (index !== null && index < this.images.length) {
      this.images.splice(index, 0, newImage);
      // Update indices for subsequent images
      this.images.forEach((img, i) => (img.index = i));
    } else {
      this.images.push(newImage);
    }
  }

  // Public method to remove image
  removeImage(index) {
    if (index >= 0 && index < this.images.length) {
      this.images.splice(index, 1);
      // Update indices
      this.images.forEach((img, i) => (img.index = i));

      // Adjust current index if necessary
      if (this.currentIndex >= this.images.length) {
        this.currentIndex = Math.max(0, this.images.length - 1);
      }

      if (this.isOpen) {
        if (this.images.length === 0) {
          this.close();
        } else {
          this.updateImage();
          this.updateNavigation();
        }
      }
    }
  }

  // Public method to get current image info
  getCurrentImage() {
    return this.images[this.currentIndex] || null;
  }

  // Public method to check if lightbox is open
  isLightboxOpen() {
    return this.isOpen;
  }
}

// Initialize lightbox when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if lightbox modal exists
  if (document.getElementById("lightbox-modal")) {
    window.lightbox = new Lightbox();
  }
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = Lightbox;
}
