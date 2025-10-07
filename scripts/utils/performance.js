/**
 * Performance Monitoring and Core Web Vitals
 *
 * Tracks and reports performance metrics including:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Navigation timing
 * - Resource loading performance
 * - Custom performance marks
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableCoreWebVitals: true,
      enableResourceTiming: true,
      enableNavigationTiming: true,
      enableCustomMetrics: true,
      reportingEndpoint: options.reportingEndpoint || null,
      sampleRate: options.sampleRate || 1.0, // 100% by default
      debug: options.debug || false,
      ...options,
    };

    this.metrics = new Map();
    this.observers = [];

    this.init();
  }

  init() {
    // Only initialize if we should sample this session
    if (Math.random() > this.options.sampleRate) {
      return;
    }

    if (this.options.enableCoreWebVitals) {
      this.setupCoreWebVitals();
    }

    if (this.options.enableNavigationTiming) {
      this.setupNavigationTiming();
    }

    if (this.options.enableResourceTiming) {
      this.setupResourceTiming();
    }

    if (this.options.enableCustomMetrics) {
      this.setupCustomMetrics();
    }

    // Setup automatic reporting
    this.setupReporting();

    this.log("Performance monitoring initialized");
  }

  setupCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry("largest-contentful-paint", (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordMetric("LCP", lastEntry.startTime, {
        element: lastEntry.element?.tagName || "unknown",
        url: lastEntry.url || "",
        size: lastEntry.size || 0,
      });
    });

    // First Input Delay (FID)
    this.observePerformanceEntry("first-input", (entries) => {
      const firstEntry = entries[0];
      this.recordMetric(
        "FID",
        firstEntry.processingStart - firstEntry.startTime,
        {
          eventType: firstEntry.name,
          target: firstEntry.target?.tagName || "unknown",
        }
      );
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry("layout-shift", (entries) => {
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.recordMetric("CLS", clsValue);
    });

    // First Contentful Paint (FCP)
    this.observePerformanceEntry("paint", (entries) => {
      const fcpEntry = entries.find(
        (entry) => entry.name === "first-contentful-paint"
      );
      if (fcpEntry) {
        this.recordMetric("FCP", fcpEntry.startTime);
      }
    });

    // Time to First Byte (TTFB)
    if ("navigation" in performance.getEntriesByType("navigation")[0]) {
      const navEntry = performance.getEntriesByType("navigation")[0];
      this.recordMetric("TTFB", navEntry.responseStart - navEntry.requestStart);
    }
  }

  setupNavigationTiming() {
    window.addEventListener("load", () => {
      // Wait a bit for all metrics to be available
      setTimeout(() => {
        const navEntry = performance.getEntriesByType("navigation")[0];

        if (navEntry) {
          this.recordMetric(
            "DNS_LOOKUP",
            navEntry.domainLookupEnd - navEntry.domainLookupStart
          );
          this.recordMetric(
            "TCP_CONNECT",
            navEntry.connectEnd - navEntry.connectStart
          );
          this.recordMetric(
            "REQUEST_TIME",
            navEntry.responseEnd - navEntry.requestStart
          );
          this.recordMetric(
            "DOM_PARSE",
            navEntry.domContentLoadedEventEnd -
              navEntry.domContentLoadedEventStart
          );
          this.recordMetric(
            "LOAD_COMPLETE",
            navEntry.loadEventEnd - navEntry.loadEventStart
          );
          this.recordMetric(
            "TOTAL_LOAD_TIME",
            navEntry.loadEventEnd - navEntry.navigationStart
          );
        }
      }, 1000);
    });
  }

  setupResourceTiming() {
    // Monitor resource loading performance
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource") {
          this.analyzeResourceTiming(entry);
        }
      }
    });

    resourceObserver.observe({ entryTypes: ["resource"] });
    this.observers.push(resourceObserver);
  }

  analyzeResourceTiming(entry) {
    const resourceType = this.getResourceType(entry.name);
    const duration = entry.responseEnd - entry.startTime;

    // Track slow resources
    if (duration > 1000) {
      // Resources taking more than 1 second
      this.recordMetric("SLOW_RESOURCE", duration, {
        type: resourceType,
        url: entry.name,
        size: entry.transferSize || 0,
      });
    }

    // Track resource types
    this.recordMetric(`RESOURCE_${resourceType.toUpperCase()}_TIME`, duration, {
      url: entry.name,
      size: entry.transferSize || 0,
    });
  }

  setupCustomMetrics() {
    // Track image loading performance
    this.trackImageLoading();

    // Track form interactions
    this.trackFormPerformance();

    // Track navigation performance
    this.trackNavigationPerformance();
  }

  trackImageLoading() {
    const images = document.querySelectorAll(
      'img[loading="lazy"], img[data-src]'
    );

    images.forEach((img, index) => {
      const startTime = performance.now();

      const onLoad = () => {
        const loadTime = performance.now() - startTime;
        this.recordMetric("IMAGE_LOAD_TIME", loadTime, {
          src: img.src || img.dataset.src,
          index: index,
          lazy: img.loading === "lazy" || !!img.dataset.src,
        });

        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      };

      const onError = () => {
        this.recordMetric("IMAGE_LOAD_ERROR", 1, {
          src: img.src || img.dataset.src,
          index: index,
        });

        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      };

      img.addEventListener("load", onLoad);
      img.addEventListener("error", onError);
    });
  }

  trackFormPerformance() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      let interactionStart = null;

      form.addEventListener("focusin", () => {
        if (!interactionStart) {
          interactionStart = performance.now();
        }
      });

      form.addEventListener("submit", () => {
        if (interactionStart) {
          const interactionTime = performance.now() - interactionStart;
          this.recordMetric("FORM_INTERACTION_TIME", interactionTime, {
            formId: form.id || "unknown",
            fields: form.elements.length,
          });
        }
      });
    });
  }

  trackNavigationPerformance() {
    // Track smooth scroll performance
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const startTime = performance.now();

        // Use requestAnimationFrame to measure scroll completion
        const checkScroll = () => {
          const scrollTime = performance.now() - startTime;

          if (scrollTime > 100) {
            // Assume scroll is complete after 100ms
            this.recordMetric("SMOOTH_SCROLL_TIME", scrollTime, {
              target: link.getAttribute("href"),
            });
          } else {
            requestAnimationFrame(checkScroll);
          }
        };

        requestAnimationFrame(checkScroll);
      });
    });
  }

  observePerformanceEntry(entryType, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      this.log(`Failed to observe ${entryType}:`, error);
    }
  }

  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      metadata,
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);

    this.log(`Metric recorded: ${name} = ${value}`, metadata);

    // Trigger immediate reporting for critical metrics
    if (["LCP", "FID", "CLS"].includes(name)) {
      this.reportMetric(metric);
    }
  }

  getConnectionInfo() {
    if ("connection" in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      };
    }
    return null;
  }

  getResourceType(url) {
    if (url.match(/\.(css)$/)) return "css";
    if (url.match(/\.(js)$/)) return "js";
    if (url.match(/\.(jpg|jpeg|png|webp|svg|gif)$/)) return "image";
    if (url.match(/\.(woff2?|ttf|eot)$/)) return "font";
    return "other";
  }

  setupReporting() {
    // Report metrics when page is about to unload
    window.addEventListener("beforeunload", () => {
      this.reportAllMetrics();
    });

    // Report metrics periodically
    setInterval(() => {
      this.reportAllMetrics();
    }, 30000); // Every 30 seconds

    // Report on visibility change (when user switches tabs)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.reportAllMetrics();
      }
    });
  }

  reportMetric(metric) {
    if (this.options.reportingEndpoint) {
      // Send to analytics endpoint
      this.sendToEndpoint([metric]);
    }

    // Send to Google Analytics if available
    if (typeof gtag !== "undefined") {
      gtag("event", "performance_metric", {
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        custom_parameter_1: JSON.stringify(metric.metadata),
      });
    }

    // Console logging for development
    if (this.options.debug) {
      console.table([metric]);
    }
  }

  reportAllMetrics() {
    const metricsArray = Array.from(this.metrics.values());

    if (metricsArray.length === 0) return;

    if (this.options.reportingEndpoint) {
      this.sendToEndpoint(metricsArray);
    }

    // Send summary to Google Analytics
    if (typeof gtag !== "undefined") {
      const summary = this.generateSummary(metricsArray);

      gtag("event", "performance_summary", {
        lcp: summary.LCP,
        fid: summary.FID,
        cls: summary.CLS,
        fcp: summary.FCP,
        ttfb: summary.TTFB,
      });
    }

    // Clear reported metrics
    this.metrics.clear();

    this.log(`Reported ${metricsArray.length} metrics`);
  }

  sendToEndpoint(metrics) {
    if (!this.options.reportingEndpoint) return;

    // Use sendBeacon for reliability
    if ("sendBeacon" in navigator) {
      const data = JSON.stringify({
        metrics,
        session: this.getSessionInfo(),
      });

      navigator.sendBeacon(this.options.reportingEndpoint, data);
    } else {
      // Fallback to fetch
      fetch(this.options.reportingEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metrics,
          session: this.getSessionInfo(),
        }),
      }).catch((error) => {
        this.log("Failed to send metrics:", error);
      });
    }
  }

  generateSummary(metrics) {
    const summary = {};

    // Get the latest value for each metric type
    const metricTypes = ["LCP", "FID", "CLS", "FCP", "TTFB"];

    metricTypes.forEach((type) => {
      const typeMetrics = metrics.filter((m) => m.name === type);
      if (typeMetrics.length > 0) {
        summary[type] = Math.round(typeMetrics[typeMetrics.length - 1].value);
      }
    });

    return summary;
  }

  getSessionInfo() {
    return {
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio,
      },
      connection: this.getConnectionInfo(),
    };
  }

  // Public API methods
  mark(name) {
    performance.mark(name);
    this.recordMetric(`CUSTOM_MARK_${name}`, performance.now());
  }

  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, "measure")[0];
      this.recordMetric(`CUSTOM_MEASURE_${name}`, measure.duration);
    } catch (error) {
      this.log(`Failed to measure ${name}:`, error);
    }
  }

  getMetrics() {
    return Array.from(this.metrics.values());
  }

  getCoreWebVitals() {
    const metrics = this.getMetrics();
    return {
      LCP: metrics.find((m) => m.name === "LCP")?.value,
      FID: metrics.find((m) => m.name === "FID")?.value,
      CLS: metrics.find((m) => m.name === "CLS")?.value,
      FCP: metrics.find((m) => m.name === "FCP")?.value,
      TTFB: metrics.find((m) => m.name === "TTFB")?.value,
    };
  }

  log(...args) {
    if (this.options.debug) {
      console.log("[PerformanceMonitor]", ...args);
    }
  }

  destroy() {
    // Clean up observers
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers = [];

    // Report final metrics
    this.reportAllMetrics();
  }
}

// Initialize performance monitoring
window.performanceMonitor = new PerformanceMonitor({
  debug: window.location.hostname === "localhost",
  sampleRate: 1.0, // Monitor 100% of sessions in development
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = PerformanceMonitor;
}
