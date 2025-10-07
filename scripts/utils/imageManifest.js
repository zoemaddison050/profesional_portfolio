/**
 * Image Manifest Loader
 *
 * Loads the image optimization manifest generated during build
 * and makes it available to the image optimization utilities
 */

class ImageManifestLoader {
  constructor() {
    this.manifest = null;
    this.loaded = false;
  }

  async load() {
    if (this.loaded) {
      return this.manifest;
    }

    try {
      const response = await fetch("assets/images/image-manifest.json");

      if (!response.ok) {
        console.warn("Image manifest not found, using fallback optimization");
        return null;
      }

      this.manifest = await response.json();
      this.loaded = true;

      // Make manifest globally available
      window.imageManifest = this.manifest;

      console.log("📄 Image manifest loaded:", this.manifest.stats);

      return this.manifest;
    } catch (error) {
      console.warn("Failed to load image manifest:", error.message);
      return null;
    }
  }

  getImageData(imageName) {
    if (!this.manifest) {
      return null;
    }

    return this.manifest.images[imageName] || null;
  }

  getOptimizedSrc(imageName, size = "medium", format = "webp", density = 1) {
    const imageData = this.getImageData(imageName);

    if (!imageData) {
      return null;
    }

    const densitySuffix = density > 1 ? `@${density}x` : "";
    const variantKey = `${size}${densitySuffix}`;

    // Try requested format first
    if (imageData.variants[format] && imageData.variants[format][variantKey]) {
      return imageData.variants[format][variantKey].path;
    }

    // Fallback to other formats
    const fallbackFormats =
      format === "webp" ? ["jpeg", "png"] : ["webp", "jpeg", "png"];

    for (const fallbackFormat of fallbackFormats) {
      if (
        imageData.variants[fallbackFormat] &&
        imageData.variants[fallbackFormat][variantKey]
      ) {
        return imageData.variants[fallbackFormat][variantKey].path;
      }
    }

    // Fallback to any available size in the requested format
    if (imageData.variants[format]) {
      const availableVariant = Object.values(imageData.variants[format])[0];
      if (availableVariant) {
        return availableVariant.path;
      }
    }

    return null;
  }

  generateSrcset(imageName, format = "webp") {
    const imageData = this.getImageData(imageName);

    if (!imageData || !imageData.variants[format]) {
      return "";
    }

    const variants = imageData.variants[format];
    const srcsetParts = [];

    // Sort variants by width
    const sortedVariants = Object.entries(variants).sort(
      ([, a], [, b]) => a.width - b.width
    );

    for (const [key, variant] of sortedVariants) {
      if (variant.path && variant.width) {
        srcsetParts.push(`${variant.path} ${variant.width}w`);
      }
    }

    return srcsetParts.join(", ");
  }

  generatePictureElement(imageName, alt = "", className = "", sizes = "") {
    const imageData = this.getImageData(imageName);

    if (!imageData) {
      return null;
    }

    const webpSrcset = this.generateSrcset(imageName, "webp");
    const fallbackSrcset =
      this.generateSrcset(imageName, "jpeg") ||
      this.generateSrcset(imageName, "png");

    const defaultSrc =
      this.getOptimizedSrc(imageName, "medium", "jpeg") ||
      this.getOptimizedSrc(imageName, "medium", "png") ||
      this.getOptimizedSrc(imageName, "thumbnail");

    if (!defaultSrc) {
      return null;
    }

    const sizesAttr = sizes ? `sizes="${sizes}"` : "";
    const classAttr = className ? `class="${className}"` : "";

    return `
      <picture>
        ${
          webpSrcset
            ? `<source srcset="${webpSrcset}" type="image/webp" ${sizesAttr}>`
            : ""
        }
        <img src="${defaultSrc}" 
             ${fallbackSrcset ? `srcset="${fallbackSrcset}"` : ""}
             alt="${alt}"
             ${classAttr}
             ${sizesAttr}
             loading="lazy">
      </picture>
    `.trim();
  }

  preloadCriticalImages(imageNames = []) {
    if (!this.manifest) {
      return;
    }

    const preloadPromises = imageNames
      .map((imageName) => {
        const src =
          this.getOptimizedSrc(imageName, "medium", "webp") ||
          this.getOptimizedSrc(imageName, "medium", "jpeg");

        if (src) {
          return this.preloadImage(src);
        }
      })
      .filter(Boolean);

    return Promise.all(preloadPromises);
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  getStats() {
    return this.manifest ? this.manifest.stats : null;
  }
}

// Create global instance
window.imageManifestLoader = new ImageManifestLoader();

// Auto-load manifest when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.imageManifestLoader.load();
  });
} else {
  window.imageManifestLoader.load();
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = ImageManifestLoader;
}
