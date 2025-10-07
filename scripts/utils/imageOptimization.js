// Image Optimization and Lazy Loading Utility

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      // Default options
      rootMargin: "50px 0px",
      threshold: 0.01,
      enableWebP: true,
      enablePlaceholders: true,
      enableErrorHandling: true,
      placeholderColor: "#f3f4f6",
      ...options,
    };

    this.observer = null;
    this.init();
  }

  init() {
    // Check for Intersection Observer support
    if ("IntersectionObserver" in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback for older browsers
      this.loadAllImages();
    }

    // Setup error handling for all images
    if (this.options.enableErrorHandling) {
      this.setupErrorHandling();
    }
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );

    // Observe all lazy images
    this.observeImages();
  }

  observeImages() {
    const lazyImages = document.querySelectorAll(
      'img[data-src], img[loading="lazy"]'
    );
    lazyImages.forEach((img) => {
      // Create placeholder if enabled
      if (this.options.enablePlaceholders) {
        this.createPlaceholder(img);
      }

      this.observer.observe(img);
    });
  }

  createPlaceholder(img) {
    // Skip if image already has a src (not lazy loaded)
    if (img.src && !img.dataset.src) return;

    // Create a low-quality placeholder
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size to match image dimensions or use defaults
    canvas.width = img.width || 400;
    canvas.height = img.height || 300;

    // Create gradient placeholder
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, this.options.placeholderColor);
    gradient.addColorStop(
      1,
      this.lightenColor(this.options.placeholderColor, 20)
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add loading indicator
    ctx.fillStyle = "#9ca3af";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);

    // Set placeholder as src if no src exists
    if (!img.src) {
      img.src = canvas.toDataURL();
      img.classList.add("img-placeholder");
    }
  }

  loadImage(img) {
    // Get the actual image source
    const src = img.dataset.src || img.src;
    if (!src) return;

    // Create optimized source set
    const optimizedSrc = this.getOptimizedImageSrc(src);

    // Create new image element to preload
    const imageLoader = new Image();

    // Set up load handlers
    imageLoader.onload = () => {
      this.onImageLoad(img, optimizedSrc);
    };

    imageLoader.onerror = () => {
      this.onImageError(img, src);
    };

    // Start loading
    imageLoader.src = optimizedSrc;
  }

  getOptimizedImageSrc(src) {
    if (!this.options.enableWebP || !this.supportsWebP()) {
      return src;
    }

    // Check if we have an optimized version from the build process
    if (window.imageManifest) {
      const imageName = this.extractImageName(src);
      const imageData = window.imageManifest.images[imageName];

      if (imageData && imageData.variants.webp) {
        // Return the medium size WebP version as default
        const webpVariant =
          imageData.variants.webp.medium ||
          imageData.variants.webp.thumbnail ||
          Object.values(imageData.variants.webp)[0];

        if (webpVariant) {
          return webpVariant.path;
        }
      }
    }

    // Fallback to simple WebP conversion
    if (!src.includes(".webp")) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
      return webpSrc;
    }

    return src;
  }

  extractImageName(src) {
    const filename = src.split("/").pop().split(".")[0];
    // Remove any size suffixes
    return filename.replace(
      /-(?:thumbnail|medium|large|xlarge)(?:@\d+x)?$/,
      ""
    );
  }

  onImageLoad(img, src) {
    // Update image source
    img.src = src;

    // Remove data-src attribute
    if (img.dataset.src) {
      delete img.dataset.src;
    }

    // Add loaded class for animations
    img.classList.add("img-loaded");
    img.classList.remove("img-placeholder", "img-error");

    // Trigger fade-in animation
    requestAnimationFrame(() => {
      img.style.opacity = "1";
    });

    // Announce to screen readers
    if (window.announceToScreenReader) {
      window.announceToScreenReader("Image loaded");
    }
  }

  onImageError(img, originalSrc) {
    // Add error class
    img.classList.add("img-error");
    img.classList.remove("img-placeholder");

    // Try fallback to original source if we were trying WebP
    if (originalSrc !== img.src && !img.dataset.fallbackAttempted) {
      img.dataset.fallbackAttempted = "true";

      const fallbackLoader = new Image();
      fallbackLoader.onload = () => {
        this.onImageLoad(img, originalSrc);
      };
      fallbackLoader.onerror = () => {
        this.setErrorPlaceholder(img);
      };
      fallbackLoader.src = originalSrc;
    } else {
      this.setErrorPlaceholder(img);
    }
  }

  setErrorPlaceholder(img) {
    // Create error placeholder
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width || 400;
    canvas.height = img.height || 300;

    // Gray background
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Error icon and text
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Image unavailable", canvas.width / 2, canvas.height / 2);

    img.src = canvas.toDataURL();
    img.alt = img.alt + " (Image could not be loaded)";

    // Announce error to screen readers
    if (window.announceToScreenReader) {
      window.announceToScreenReader("Image failed to load");
    }
  }

  setupErrorHandling() {
    // Global error handler for images
    document.addEventListener(
      "error",
      (e) => {
        if (e.target.tagName === "IMG") {
          this.onImageError(e.target, e.target.src);
        }
      },
      true
    );
  }

  supportsWebP() {
    // Check WebP support
    if (this._webpSupport !== undefined) {
      return this._webpSupport;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    this._webpSupport =
      canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    return this._webpSupport;
  }

  lightenColor(color, percent) {
    // Simple color lightening utility
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  loadAllImages() {
    // Fallback for browsers without Intersection Observer
    const lazyImages = document.querySelectorAll(
      'img[data-src], img[loading="lazy"]'
    );
    lazyImages.forEach((img) => {
      this.loadImage(img);
    });
  }

  // Public method to manually load an image
  forceLoadImage(img) {
    if (this.observer) {
      this.observer.unobserve(img);
    }
    this.loadImage(img);
  }

  // Public method to add new images to observation
  observeNewImages(container = document) {
    const newImages = container.querySelectorAll(
      'img[data-src]:not(.img-observed), img[loading="lazy"]:not(.img-observed)'
    );
    newImages.forEach((img) => {
      img.classList.add("img-observed");

      if (this.options.enablePlaceholders) {
        this.createPlaceholder(img);
      }

      if (this.observer) {
        this.observer.observe(img);
      } else {
        this.loadImage(img);
      }
    });
  }

  // Cleanup method
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export for use in other modules
window.ImageOptimizer = ImageOptimizer;

// Auto-initialize if not in module environment
if (typeof module === "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    window.imageOptimizer = new ImageOptimizer();
  });
}
