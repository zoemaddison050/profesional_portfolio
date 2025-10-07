/**
 * Polyfills for Cross-Browser Compatibility
 * Provides support for modern JavaScript features in older browsers
 */

(function () {
  "use strict";

  // Polyfill for Array.from()
  if (!Array.from) {
    Array.from = function (arrayLike, mapFn, thisArg) {
      var C = this;
      var items = Object(arrayLike);
      if (arrayLike == null) {
        throw new TypeError(
          "Array.from requires an array-like object - not null or undefined"
        );
      }
      var mapFunction = mapFn === undefined ? undefined : mapFn;
      var T;
      if (typeof mapFunction !== "undefined") {
        if (typeof mapFunction !== "function") {
          throw new TypeError(
            "Array.from: when provided, the second argument must be a function"
          );
        }
        if (arguments.length > 2) {
          T = thisArg;
        }
      }
      var len = parseInt(items.length);
      var A = typeof C === "function" ? Object(new C(len)) : new Array(len);
      var k = 0;
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFunction) {
          A[k] =
            typeof T === "undefined"
              ? mapFunction(kValue, k)
              : mapFunction.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }

  // Polyfill for Array.prototype.includes()
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var o = Object(this);
      var len = parseInt(o.length) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(fromIndex) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {
          k = 0;
        }
      }
      function sameValueZero(x, y) {
        return (
          x === y ||
          (typeof x === "number" &&
            typeof y === "number" &&
            isNaN(x) &&
            isNaN(y))
        );
      }
      while (k < len) {
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }
      return false;
    };
  }

  // Polyfill for String.prototype.includes()
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // Polyfill for String.prototype.startsWith()
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    };
  }

  // Polyfill for String.prototype.endsWith()
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, length) {
      if (length === undefined || length > this.length) {
        length = this.length;
      }
      return (
        this.substring(length - searchString.length, length) === searchString
      );
    };
  }

  // Polyfill for Object.assign()
  if (typeof Object.assign !== "function") {
    Object.assign = function (target) {
      if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
      }
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Polyfill for Element.matches()
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function (s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s);
        var i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
  }

  // Polyfill for Element.closest()
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this;
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // Polyfill for NodeList.forEach()
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
      thisArg = thisArg || window;
      for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }

  // Polyfill for CustomEvent
  if (typeof window.CustomEvent !== "function") {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(
        event,
        params.bubbles,
        params.cancelable,
        params.detail
      );
      return evt;
    }
    window.CustomEvent = CustomEvent;
  }

  // Polyfill for requestAnimationFrame
  (function () {
    var lastTime = 0;
    var vendors = ["ms", "moz", "webkit", "o"];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame =
        window[vendors[x] + "RequestAnimationFrame"];
      window.cancelAnimationFrame =
        window[vendors[x] + "CancelAnimationFrame"] ||
        window[vendors[x] + "CancelRequestAnimationFrame"];
    }

    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };

    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
  })();

  // Polyfill for IntersectionObserver
  if (!("IntersectionObserver" in window)) {
    // Simple fallback for IntersectionObserver
    window.IntersectionObserver = function (callback, options) {
      this.callback = callback;
      this.options = options || {};
      this.observed = [];
    };

    IntersectionObserver.prototype.observe = function (target) {
      if (this.observed.indexOf(target) === -1) {
        this.observed.push(target);
        // Immediately trigger callback for fallback
        setTimeout(() => {
          this.callback([
            {
              target: target,
              isIntersecting: true,
              intersectionRatio: 1,
            },
          ]);
        }, 100);
      }
    };

    IntersectionObserver.prototype.unobserve = function (target) {
      var index = this.observed.indexOf(target);
      if (index > -1) {
        this.observed.splice(index, 1);
      }
    };

    IntersectionObserver.prototype.disconnect = function () {
      this.observed = [];
    };
  }

  // Polyfill for fetch API
  if (!window.fetch) {
    window.fetch = function (url, options) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        var method = (options && options.method) || "GET";
        var headers = (options && options.headers) || {};
        var body = (options && options.body) || null;

        xhr.open(method, url);

        // Set headers
        for (var header in headers) {
          if (headers.hasOwnProperty(header)) {
            xhr.setRequestHeader(header, headers[header]);
          }
        }

        xhr.onload = function () {
          var response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: function () {
              return Promise.resolve(xhr.responseText);
            },
            json: function () {
              return Promise.resolve(JSON.parse(xhr.responseText));
            },
          };
          resolve(response);
        };

        xhr.onerror = function () {
          reject(new Error("Network error"));
        };

        xhr.send(body);
      });
    };
  }

  // Polyfill for Promise (basic implementation)
  if (typeof Promise === "undefined") {
    window.Promise = function (executor) {
      var self = this;
      self.state = "pending";
      self.value = undefined;
      self.handlers = [];

      function resolve(result) {
        if (self.state === "pending") {
          self.state = "fulfilled";
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function reject(error) {
        if (self.state === "pending") {
          self.state = "rejected";
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function handle(handler) {
        if (self.state === "pending") {
          self.handlers.push(handler);
        } else {
          if (
            self.state === "fulfilled" &&
            typeof handler.onFulfilled === "function"
          ) {
            handler.onFulfilled(self.value);
          }
          if (
            self.state === "rejected" &&
            typeof handler.onRejected === "function"
          ) {
            handler.onRejected(self.value);
          }
        }
      }

      this.then = function (onFulfilled, onRejected) {
        return new Promise(function (resolve, reject) {
          handle({
            onFulfilled: function (result) {
              try {
                resolve(onFulfilled ? onFulfilled(result) : result);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function (error) {
              try {
                resolve(onRejected ? onRejected(error) : error);
              } catch (ex) {
                reject(ex);
              }
            },
          });
        });
      };

      executor(resolve, reject);
    };

    Promise.resolve = function (value) {
      return new Promise(function (resolve) {
        resolve(value);
      });
    };

    Promise.reject = function (error) {
      return new Promise(function (resolve, reject) {
        reject(error);
      });
    };
  }

  // Polyfill for classList
  if (!("classList" in document.createElement("_"))) {
    (function (view) {
      if (!("Element" in view)) return;

      var classListProp = "classList",
        protoProp = "prototype",
        elemCtrProto = view.Element[protoProp],
        objCtr = Object,
        strTrim =
          String[protoProp].trim ||
          function () {
            return this.replace(/^\s+|\s+$/g, "");
          },
        arrIndexOf =
          Array[protoProp].indexOf ||
          function (item) {
            var i = 0,
              len = this.length;
            for (; i < len; i++) {
              if (i in this && this[i] === item) {
                return i;
              }
            }
            return -1;
          },
        DOMTokenList = function (el) {
          this.el = el;
          var classes = el.className.replace(/^\s+|\s+$/g, "").split(/\s+/);
          for (var i = 0; i < classes.length; i++) {
            this.push(classes[i]);
          }
          this._updateClassName = function () {
            el.className = this.toString();
          };
        },
        tokenListProto = (DOMTokenList[protoProp] = []),
        tokenListGetter = function () {
          return new DOMTokenList(this);
        };

      tokenListProto.item = function (i) {
        return this[i] || null;
      };

      tokenListProto.contains = function (token) {
        token += "";
        return arrIndexOf.call(this, token) !== -1;
      };

      tokenListProto.add = function () {
        var tokens = arguments,
          i = 0,
          l = tokens.length,
          token,
          updated = false;
        do {
          token = tokens[i] + "";
          if (arrIndexOf.call(this, token) === -1) {
            this.push(token);
            updated = true;
          }
        } while (++i < l);

        if (updated) {
          this._updateClassName();
        }
      };

      tokenListProto.remove = function () {
        var tokens = arguments,
          i = 0,
          l = tokens.length,
          token,
          updated = false,
          index;
        do {
          token = tokens[i] + "";
          index = arrIndexOf.call(this, token);
          while (index !== -1) {
            this.splice(index, 1);
            updated = true;
            index = arrIndexOf.call(this, token);
          }
        } while (++i < l);

        if (updated) {
          this._updateClassName();
        }
      };

      tokenListProto.toggle = function (token, force) {
        token += "";

        var result = this.contains(token),
          method = result
            ? force !== true && "remove"
            : force !== false && "add";

        if (method) {
          this[method](token);
        }

        if (force === true || force === false) {
          return force;
        } else {
          return !result;
        }
      };

      tokenListProto.toString = function () {
        return this.join(" ");
      };

      if (objCtr.defineProperty) {
        var defineProperty = function (object, name, definition) {
          if (definition.get) {
            objCtr.defineProperty(object, name, definition);
          }
        };
        defineProperty(elemCtrProto, classListProp, {
          get: tokenListGetter,
          enumerable: true,
          configurable: true,
        });
      } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, tokenListGetter);
      }
    })(window);
  }

  // Feature detection and browser capability checks
  window.browserCapabilities = {
    // CSS Features
    cssGrid: CSS.supports("display", "grid"),
    cssFlexbox: CSS.supports("display", "flex"),
    cssCustomProperties: CSS.supports("color", "var(--test)"),
    cssTransforms: CSS.supports("transform", "translateX(1px)"),
    cssFilters: CSS.supports("filter", "blur(1px)"),
    cssClipPath: CSS.supports("clip-path", "circle()"),
    cssObjectFit: CSS.supports("object-fit", "cover"),
    cssStickyPosition: CSS.supports("position", "sticky"),
    cssBackdropFilter: CSS.supports("backdrop-filter", "blur(1px)"),
    cssGap: CSS.supports("gap", "1rem"),
    cssAspectRatio: CSS.supports("aspect-ratio", "1 / 1"),
    cssFocusVisible: CSS.supports("selector(:focus-visible)"),
    cssHas: CSS.supports("selector(:has(div))"),

    // JavaScript Features
    intersectionObserver: "IntersectionObserver" in window,
    resizeObserver: "ResizeObserver" in window,
    mutationObserver: "MutationObserver" in window,
    fetch: "fetch" in window,
    promises: "Promise" in window,
    asyncAwait: (function () {
      try {
        return function () {}.constructor(
          "return (async function(){})().constructor"
        )();
      } catch (e) {
        return false;
      }
    })(),
    webWorkers: "Worker" in window,
    serviceWorkers: "serviceWorker" in navigator,
    webGL: (function () {
      try {
        var canvas = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && canvas.getContext("webgl"));
      } catch (e) {
        return false;
      }
    })(),

    // Media Features
    webP: (function () {
      var canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    })(),
    avif: (function () {
      var canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0;
    })(),

    // Touch and Input
    touchEvents: "ontouchstart" in window,
    pointerEvents: "onpointerdown" in window,
    deviceMotion: "DeviceMotionEvent" in window,

    // Storage
    localStorage: (function () {
      try {
        return "localStorage" in window && window.localStorage !== null;
      } catch (e) {
        return false;
      }
    })(),
    sessionStorage: (function () {
      try {
        return "sessionStorage" in window && window.sessionStorage !== null;
      } catch (e) {
        return false;
      }
    })(),
    indexedDB: "indexedDB" in window,
  };

  // Add browser capability classes to document
  var docEl = document.documentElement;
  Object.keys(window.browserCapabilities).forEach(function (feature) {
    var className = window.browserCapabilities[feature]
      ? feature
      : "no-" + feature;
    docEl.classList.add(className);
  });

  // Console polyfill for older browsers
  if (!window.console) {
    window.console = {
      log: function () {},
      warn: function () {},
      error: function () {},
      info: function () {},
      debug: function () {},
      table: function () {},
      group: function () {},
      groupEnd: function () {},
      time: function () {},
      timeEnd: function () {},
    };
  }
})();
