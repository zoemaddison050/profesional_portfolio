// Main JavaScript for Portfolio Website

(function () {
  "use strict";

  // DOM Elements
  const header = document.querySelector(".header");
  const navToggle = document.querySelector(".nav__toggle");
  const navMenu = document.querySelector(".nav__menu");
  const navLinks = document.querySelectorAll(".nav__link");

  // Initialize the application
  function init() {
    console.log("init() called - starting application");
    setupNavigation();
    setupScrollEffects();
    setupSmoothScrolling();
    setupIntersectionObserver();
    setupFormHandling();
    setupTestimonialsCarousel();
    setupAccessibility();
    setupImageOptimization();
    setupResponsiveImages();
    setupSkillsAnimation();
    setupSEO();
    console.log("init() completed");
  }

  // Enhanced navigation functionality with keyboard support
  function setupNavigation() {
    if (!navToggle || !navMenu) {
      return;
    }

    // Mobile menu toggle - inline to prevent double firing
    navToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();

      const isOpen = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", !isOpen);

      if (!isOpen) {
        navMenu.classList.add("nav__menu--open");
        document.body.style.overflow = "hidden";
      } else {
        navMenu.classList.remove("nav__menu--open");
        document.body.style.overflow = "";
      }
    });

    // Close mobile menu when clicking on nav links
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        navMenu.classList.remove("nav__menu--open");
        document.body.style.overflow = "";
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      const isMenuOpen = navToggle.getAttribute("aria-expanded") === "true";
      const clickedInsideNav =
        navToggle.contains(e.target) || navMenu.contains(e.target);

      if (isMenuOpen && !clickedInsideNav) {
        navToggle.setAttribute("aria-expanded", "false");
        navMenu.classList.remove("nav__menu--open");
        document.body.style.overflow = "";
      }
    });

    // Enhanced keyboard navigation
    document.addEventListener("keydown", handleKeyboardNavigation);

    // Setup focus trap for mobile menu
    setupFocusTrap();
  }

  // Enhanced keyboard navigation handler
  function handleKeyboardNavigation(e) {
    const isMenuOpen = navToggle.getAttribute("aria-expanded") === "true";

    switch (e.key) {
      case "Escape":
        if (isMenuOpen) {
          closeMobileMenu();
          navToggle.focus(); // Return focus to toggle button
        }
        break;

      case "Tab":
        if (isMenuOpen && window.innerWidth <= 768) {
          handleMobileMenuTabbing(e);
        }
        break;

      case "ArrowDown":
      case "ArrowUp":
        if (isMenuOpen && window.innerWidth <= 768) {
          e.preventDefault();
          navigateMenuItems(e.key === "ArrowDown" ? 1 : -1);
        }
        break;

      case "Home":
        if (isMenuOpen && window.innerWidth <= 768) {
          e.preventDefault();
          focusMenuItem(0);
        }
        break;

      case "End":
        if (isMenuOpen && window.innerWidth <= 768) {
          e.preventDefault();
          focusMenuItem(navLinks.length - 1);
        }
        break;
    }
  }

  // Navigate menu items with arrow keys
  function navigateMenuItems(direction) {
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(navLinks).indexOf(currentFocus);

    if (currentIndex !== -1) {
      const nextIndex = currentIndex + direction;
      const targetIndex = Math.max(0, Math.min(navLinks.length - 1, nextIndex));
      focusMenuItem(targetIndex);
    } else {
      // If no menu item is focused, focus the first one
      focusMenuItem(0);
    }
  }

  // Focus specific menu item
  function focusMenuItem(index) {
    if (navLinks[index]) {
      navLinks[index].focus();
    }
  }

  // Handle tab navigation in mobile menu
  function handleMobileMenuTabbing(e) {
    const focusableElements = navMenu.querySelectorAll(
      "a[href], button:not([disabled])"
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        navToggle.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        navToggle.focus();
      }
    }
  }

  // Setup focus trap for mobile menu
  function setupFocusTrap() {
    navToggle.addEventListener("keydown", (e) => {
      const isMenuOpen = navToggle.getAttribute("aria-expanded") === "true";

      if (e.key === "Tab" && isMenuOpen && window.innerWidth <= 768) {
        if (e.shiftKey) {
          // Shift + Tab from toggle button should go to last menu item
          e.preventDefault();
          const lastLink = navLinks[navLinks.length - 1];
          if (lastLink) lastLink.focus();
        } else {
          // Tab from toggle button should go to first menu item
          e.preventDefault();
          const firstLink = navLinks[0];
          if (firstLink) firstLink.focus();
        }
      }
    });
  }

  // Scroll effects
  function setupScrollEffects() {
    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY;

      // Add scrolled class to header
      if (currentScrollY > 50) {
        header.classList.add("header--scrolled");
      } else {
        header.classList.remove("header--scrolled");
      }

      // Update active navigation link
      updateActiveNavLink();

      lastScrollY = currentScrollY;
    });
  }

  // Enhanced active navigation link highlighting with intersection observer
  function updateActiveNavLink() {
    const sections = document.querySelectorAll("section[id]");
    const headerHeight = header.offsetHeight;
    const scrollPosition = window.scrollY + headerHeight + 100; // Offset for better detection

    let activeSection = null;

    // Find which section we're currently in
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      // Check if scroll position is within this section
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        activeSection = section;
      }
    });

    // If no section found (at very top), use first section
    if (!activeSection && sections.length > 0) {
      activeSection = sections[0];
    }

    // Update active states
    navLinks.forEach((link) => {
      link.classList.remove("nav__link--active");
      link.removeAttribute("aria-current");
    });

    if (activeSection) {
      const sectionId = activeSection.getAttribute("id");
      const navLink = document.querySelector(
        `.nav__link[href="#${sectionId}"]`
      );

      if (navLink) {
        navLink.classList.add("nav__link--active");
        navLink.setAttribute("aria-current", "page");
      }
    }
  }

  // Intersection Observer for more accurate section detection
  function setupIntersectionObserver() {
    if (!("IntersectionObserver" in window)) {
      return; // Fallback to scroll-based detection
    }

    const observerOptions = {
      root: null,
      rootMargin: `-${header.offsetHeight}px 0px -50% 0px`,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute("id");
        const navLink = document.querySelector(
          `.nav__link[href="#${sectionId}"]`
        );

        if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
          // Remove active class from all nav links
          navLinks.forEach((link) => {
            link.classList.remove("nav__link--active");
            link.removeAttribute("aria-current");
          });

          // Add active class to current nav link
          if (navLink) {
            navLink.classList.add("nav__link--active");
            navLink.setAttribute("aria-current", "page");
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  // Enhanced smooth scrolling for anchor links
  function setupSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection && targetId !== "#") {
          e.preventDefault();

          const headerHeight = header.offsetHeight;
          const targetPosition = targetSection.offsetTop - headerHeight - 20; // Extra offset for better visual spacing

          // Smooth scroll with enhanced easing
          smoothScrollTo(targetPosition, 800);

          // Close mobile menu if open
          closeMobileMenu();

          // Update URL without jumping
          history.pushState(null, null, targetId);

          // Announce navigation to screen readers
          if (window.accessibilityManager) {
            const sectionTitle =
              targetSection.querySelector("h1, h2, h3")?.textContent ||
              targetSection.getAttribute("aria-label") ||
              link.textContent;
            window.accessibilityManager.announce(
              `Navigated to ${sectionTitle} section`
            );
          }

          // Add focus to target section for keyboard users
          targetSection.setAttribute("tabindex", "-1");
          targetSection.focus();

          // Remove tabindex after focus to maintain normal tab flow
          setTimeout(() => {
            targetSection.removeAttribute("tabindex");
          }, 1000);
        }
      });
    });

    // Handle keyboard navigation
    anchorLinks.forEach((link) => {
      link.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          link.click();
        }
      });
    });
  }

  // Enhanced smooth scroll function with custom easing
  function smoothScrollTo(targetPosition, duration = 800) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutCubic(
        timeElapsed,
        startPosition,
        distance,
        duration
      );
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    // Easing function for smooth animation
    function easeInOutCubic(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t * t + b;
      t -= 2;
      return (c / 2) * (t * t * t + 2) + b;
    }

    requestAnimationFrame(animation);
  }

  // Testimonials carousel functionality
  function setupTestimonialsCarousel() {
    const carousel = document.querySelector(".testimonials__carousel");
    const slides = document.querySelectorAll(".testimonial-slide");
    const prevBtn = document.querySelector(".testimonial-btn--prev");
    const nextBtn = document.querySelector(".testimonial-btn--next");
    const indicators = document.querySelectorAll(".testimonial-indicator");

    if (!carousel || slides.length === 0) return;

    let currentSlide = 0;
    let isTransitioning = false;
    let autoPlayInterval;
    const autoPlayDelay = 5000; // 5 seconds

    // Initialize carousel
    function initCarousel() {
      showSlide(0);
      startAutoPlay();

      // Add event listeners
      if (prevBtn) prevBtn.addEventListener("click", () => previousSlide());
      if (nextBtn) nextBtn.addEventListener("click", () => nextSlide());

      // Indicator click handlers
      indicators.forEach((indicator, index) => {
        indicator.addEventListener("click", () => goToSlide(index));
      });

      // Keyboard navigation
      carousel.addEventListener("keydown", handleCarouselKeyboard);

      // Pause auto-play on hover/focus
      carousel.addEventListener("mouseenter", pauseAutoPlay);
      carousel.addEventListener("mouseleave", startAutoPlay);
      carousel.addEventListener("focusin", pauseAutoPlay);
      carousel.addEventListener("focusout", startAutoPlay);

      // Touch/swipe support
      setupTouchNavigation();
    }

    // Show specific slide
    function showSlide(index) {
      if (isTransitioning) return;

      isTransitioning = true;

      // Update current slide index
      const previousSlide = currentSlide;
      currentSlide = index;

      // Update slides
      slides.forEach((slide, i) => {
        slide.classList.remove("active", "prev", "next");

        if (i === currentSlide) {
          slide.classList.add("active");
        } else if (i === previousSlide) {
          slide.classList.add(i < currentSlide ? "prev" : "next");
        }
      });

      // Update indicators
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle("active", i === currentSlide);
        indicator.setAttribute("aria-pressed", i === currentSlide);
      });

      // Update button states
      updateButtonStates();

      // Update aria-live region
      updateAriaLive();

      // Reset transition flag after animation
      setTimeout(() => {
        isTransitioning = false;
      }, 500);
    }

    // Navigate to next slide
    function nextSlide() {
      const nextIndex = (currentSlide + 1) % slides.length;
      goToSlide(nextIndex);
    }

    // Navigate to previous slide
    function previousSlide() {
      const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
      goToSlide(prevIndex);
    }

    // Go to specific slide
    function goToSlide(index) {
      if (index !== currentSlide && !isTransitioning) {
        showSlide(index);
        restartAutoPlay();
      }
    }

    // Update button states for accessibility
    function updateButtonStates() {
      if (prevBtn) {
        prevBtn.disabled = false; // Always enabled for infinite loop
        prevBtn.setAttribute(
          "aria-label",
          `Previous testimonial (${currentSlide + 1} of ${slides.length})`
        );
      }

      if (nextBtn) {
        nextBtn.disabled = false; // Always enabled for infinite loop
        nextBtn.setAttribute(
          "aria-label",
          `Next testimonial (${currentSlide + 1} of ${slides.length})`
        );
      }
    }

    // Update aria-live region for screen readers
    function updateAriaLive() {
      const currentSlideElement = slides[currentSlide];
      const name =
        currentSlideElement.querySelector(".testimonial__name")?.textContent;
      const comment = currentSlideElement.querySelector(
        ".testimonial__comment"
      )?.textContent;

      if (name && comment) {
        // Announce the current testimonial
        if (window.accessibilityManager) {
          window.accessibilityManager.announce(
            `Testimonial ${currentSlide + 1} of ${
              slides.length
            }: ${name} says: ${comment}`
          );
        }
      }

      // Update carousel aria-label
      carousel.setAttribute(
        "aria-label",
        `Testimonial ${currentSlide + 1} of ${slides.length}`
      );
    }

    // Handle keyboard navigation
    function handleCarouselKeyboard(e) {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          previousSlide();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextSlide();
          break;
        case "Home":
          e.preventDefault();
          goToSlide(0);
          break;
        case "End":
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case " ":
        case "Enter":
          if (e.target.classList.contains("testimonial-indicator")) {
            e.preventDefault();
            const index = parseInt(e.target.getAttribute("data-slide"));
            if (!isNaN(index)) {
              goToSlide(index);
            }
          }
          break;
      }
    }

    // Touch/swipe navigation
    function setupTouchNavigation() {
      let startX = 0;
      let startY = 0;
      let endX = 0;
      let endY = 0;
      const minSwipeDistance = 50;

      carousel.addEventListener(
        "touchstart",
        (e) => {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        },
        { passive: true }
      );

      carousel.addEventListener(
        "touchend",
        (e) => {
          endX = e.changedTouches[0].clientX;
          endY = e.changedTouches[0].clientY;

          const deltaX = endX - startX;
          const deltaY = endY - startY;

          // Check if horizontal swipe is more significant than vertical
          if (
            Math.abs(deltaX) > Math.abs(deltaY) &&
            Math.abs(deltaX) > minSwipeDistance
          ) {
            if (deltaX > 0) {
              previousSlide(); // Swipe right = previous
            } else {
              nextSlide(); // Swipe left = next
            }
          }
        },
        { passive: true }
      );
    }

    // Auto-play functionality
    function startAutoPlay() {
      if (autoPlayInterval) clearInterval(autoPlayInterval);

      autoPlayInterval = setInterval(() => {
        if (!document.hidden && !isTransitioning) {
          nextSlide();
        }
      }, autoPlayDelay);
    }

    function pauseAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    }

    function restartAutoPlay() {
      pauseAutoPlay();
      startAutoPlay();
    }

    // Pause auto-play when page is not visible
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pauseAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (prefersReducedMotion.matches) {
      // Disable auto-play for users who prefer reduced motion
      pauseAutoPlay();
    }

    // Listen for changes in motion preferences
    prefersReducedMotion.addEventListener("change", (e) => {
      if (e.matches) {
        pauseAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    // Initialize the carousel
    initCarousel();
  }

  // Form handling
  function setupFormHandling() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      form.addEventListener("submit", handleFormSubmit);

      // Real-time validation
      const inputs = form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        input.addEventListener("blur", () => validateField(input));
        input.addEventListener("input", () => clearFieldError(input));
      });
    });

    // Setup contact support button
    setupContactSupport();
  }

  function setupContactSupport() {
    const supportBtn = document.getElementById("contact-support-btn");

    if (supportBtn) {
      supportBtn.addEventListener("click", () => {
        const subject = encodeURIComponent(
          "Contact Form Support - Rebecca Lee Jin"
        );
        const body = encodeURIComponent(
          "Hello Rebecca,\n\n" +
            "I was trying to use the contact form on your website but encountered an issue. " +
            "Could you please help me get in touch?\n\n" +
            "Best regards"
        );

        const mailtoLink = `mailto:support@rebeccaleejin.com?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;

        // Announce to screen readers
        if (window.accessibilityManager) {
          window.accessibilityManager.announce(
            "Opening email client to contact Rebecca directly"
          );
        }
      });

      // Add keyboard support
      supportBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          supportBtn.click();
        }
      });
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById("form-result");

    // Validate form
    if (!validateForm(form)) {
      return;
    }

    // Check if this is the contact form with Formspree
    if (form.id === "contact-form") {
      await handleFormspreeSubmission(form, formData, submitButton, resultDiv);
    } else {
      // Handle other forms with generic logic
      await handleGenericFormSubmission(form, formData, submitButton);
    }
  }

  async function handleFormspreeSubmission(
    form,
    formData,
    submitButton,
    resultDiv
  ) {
    try {
      // Show loading state
      if (submitButton) {
        submitButton.classList.add("btn--loading");
        submitButton.disabled = true;
      }

      // Clear previous messages
      if (resultDiv) {
        resultDiv.className = "form__message";
        resultDiv.textContent = "";
      }

      // Check for hCaptcha response
      const captchaResponse = window.hcaptcha
        ? window.hcaptcha.getResponse()
        : null;
      if (captchaResponse) {
        formData.append("h-captcha-response", captchaResponse);
      }

      // Submit to Formspree
      const response = await fetch("https://formspree.io/f/meorleqk", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        // Formspree submission successful
        // Show success message
        showFormMessage(
          resultDiv,
          "Thank you for your message! I'll get back to you within 24 hours.",
          "success"
        );

        // Reset form
        form.reset();

        // Clear any field errors
        const errorElements = form.querySelectorAll(".form__error.show");
        errorElements.forEach((error) => {
          error.classList.remove("show");
          error.textContent = "";
        });

        // Remove success/error classes from inputs
        const inputs = form.querySelectorAll(".form__input");
        inputs.forEach((input) => {
          input.classList.remove("form__input--success", "form__input--error");
        });

        // Announce success to screen readers
        if (window.accessibilityManager) {
          window.accessibilityManager.announce(
            "Message sent successfully! I'll get back to you within 24 hours."
          );
        }

        // Reset captcha if present
        if (window.hcaptcha) {
          window.hcaptcha.reset();
        }
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);

      // More specific error message based on error type
      let errorMessage =
        "Sorry, there was an error sending your message. Please try again or use the contact support button below.";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage =
          "Network error: Unable to connect to the email service. Please check your internet connection or use the contact support button below.";
      }

      showFormMessage(resultDiv, errorMessage, "error");

      // Announce error to screen readers
      if (window.accessibilityManager) {
        window.accessibilityManager.announce(
          "There was an error sending your message. Please try again."
        );
      }
    } finally {
      // Reset loading state
      if (submitButton) {
        submitButton.classList.remove("btn--loading");
        submitButton.disabled = false;
      }
    }
  }

  async function handleGenericFormSubmission(form, formData, submitButton) {
    // Show loading state
    if (submitButton) {
      submitButton.classList.add("btn--loading");
      submitButton.disabled = true;
    }

    // Simulate form submission for other forms
    setTimeout(() => {
      // Reset loading state
      if (submitButton) {
        submitButton.classList.remove("btn--loading");
        submitButton.disabled = false;
      }

      // Show success message
      showFormMessage(
        form,
        "Thank you for your message! I'll get back to you soon.",
        "success"
      );

      // Reset form
      form.reset();
    }, 2000);
  }

  function validateForm(form) {
    const inputs = form.querySelectorAll(
      "input[required], textarea[required], select[required]"
    );
    let isValid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    // Check hCaptcha if present
    if (form.id === "contact-form" && window.hcaptcha) {
      const captchaResponse = window.hcaptcha.getResponse();
      if (!captchaResponse) {
        isValid = false;
        // Show captcha error message
        const captchaContainer = form.querySelector(".form__captcha-container");
        if (captchaContainer) {
          let errorDiv = captchaContainer.querySelector(".form__error");
          if (!errorDiv) {
            errorDiv = document.createElement("div");
            errorDiv.className = "form__error";
            errorDiv.setAttribute("role", "alert");
            errorDiv.setAttribute("aria-live", "polite");
            captchaContainer.appendChild(errorDiv);
          }
          errorDiv.textContent = "Please complete the captcha verification.";
          errorDiv.classList.add("show");
        }
      }
    }

    return isValid;
  }

  function validateField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    let isValid = true;
    let errorMessage = "";

    // Required field validation
    if (field.hasAttribute("required") && !value) {
      isValid = false;
      errorMessage = "This field is required.";
    }
    // Email validation
    else if (fieldType === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid email address.";
      }
    }
    // Phone validation
    else if (fieldType === "tel" && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
        isValid = false;
        errorMessage = "Please enter a valid phone number.";
      }
    }

    // Update field state
    if (isValid) {
      field.classList.remove("form__input--error");
      field.classList.add("form__input--success");
      removeFieldError(field);
    } else {
      field.classList.remove("form__input--success");
      field.classList.add("form__input--error");
      showFieldError(field, errorMessage);
    }

    return isValid;
  }

  function showFieldError(field, message) {
    const fieldId = field.id;
    const errorElement = document.getElementById(`${fieldId}-error`);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
      errorElement.setAttribute("role", "alert");
    } else {
      // Fallback: create error element if not found
      const newErrorElement = document.createElement("div");
      newErrorElement.className = "form__error show";
      newErrorElement.textContent = message;
      newErrorElement.setAttribute("role", "alert");
      field.parentNode.appendChild(newErrorElement);
    }
  }

  function removeFieldError(field) {
    const fieldId = field.id;
    const errorElement = document.getElementById(`${fieldId}-error`);

    if (errorElement) {
      errorElement.classList.remove("show");
      errorElement.textContent = "";
    } else {
      // Fallback: remove any error element in parent
      const existingError = field.parentNode.querySelector(".form__error");
      if (existingError) {
        existingError.remove();
      }
    }
  }

  function clearFieldError(field) {
    field.classList.remove("form__input--error");
    removeFieldError(field);
  }

  function showFormMessage(target, message, type = "success") {
    if (target.tagName === "DIV" && target.id === "form-result") {
      // Handle result div specifically
      target.className = `form__message form__message--${type} show`;
      target.textContent = message;
      target.setAttribute("role", "alert");

      // Auto-remove message after 8 seconds
      setTimeout(() => {
        target.classList.remove("show");
        setTimeout(() => {
          target.textContent = "";
          target.className = "form__message";
        }, 300);
      }, 8000);
    } else {
      // Handle form element (legacy support)
      const form = target;

      // Remove existing messages
      const existingMessage = form.querySelector(".form__message");
      if (existingMessage) {
        existingMessage.remove();
      }

      const messageElement = document.createElement("div");
      messageElement.className = `form__message form__message--${type}`;
      messageElement.textContent = message;
      messageElement.setAttribute("role", "alert");

      form.insertBefore(messageElement, form.firstChild);

      // Auto-remove message after 5 seconds
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 5000);
    }
  }

  // Image optimization and lazy loading
  function setupImageOptimization() {
    // Load image manifest first
    if (window.imageManifestLoader) {
      window.imageManifestLoader.load().then(() => {
        // Initialize image optimizer after manifest is loaded
        if (window.ImageOptimizer) {
          window.imageOptimizer = new ImageOptimizer({
            rootMargin: "50px 0px",
            threshold: 0.01,
            enableWebP: true,
            enablePlaceholders: true,
            enableErrorHandling: true,
            placeholderColor: "#f3f4f6",
          });
        }
      });
    } else {
      // Fallback if manifest loader is not available
      if (window.ImageOptimizer) {
        window.imageOptimizer = new ImageOptimizer({
          rootMargin: "50px 0px",
          threshold: 0.01,
          enableWebP: true,
          enablePlaceholders: true,
          enableErrorHandling: true,
          placeholderColor: "#f3f4f6",
        });
      }
    }

    // Setup portfolio image enhancements
    setupPortfolioImageEffects();
  }

  function setupPortfolioImageEffects() {
    const portfolioImages = document.querySelectorAll(".portfolio-card__image");

    portfolioImages.forEach((img) => {
      // Add loading class initially
      img.classList.add("img-loading");

      // Handle image load events
      img.addEventListener("load", function () {
        this.classList.remove("img-loading");
        this.classList.add("img-loaded");

        // Trigger fade-in animation
        requestAnimationFrame(() => {
          this.style.opacity = "1";
        });
      });

      // Handle image error events
      img.addEventListener("error", function () {
        this.classList.remove("img-loading");
        this.classList.add("img-error");

        // Set error state
        this.alt = this.alt + " (Image could not be loaded)";

        // Announce to screen readers
        if (window.announceToScreenReader) {
          window.announceToScreenReader("Portfolio image failed to load");
        }
      });
    });

    // Setup intersection observer for portfolio cards animation
    if ("IntersectionObserver" in window) {
      const cardObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              cardObserver.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: "0px 0px -50px 0px",
          threshold: 0.1,
        }
      );

      const portfolioCards = document.querySelectorAll(".portfolio-card");
      portfolioCards.forEach((card) => {
        card.classList.add("lazy-image");
        cardObserver.observe(card);
      });
    }
  }

  // Accessibility enhancements
  function setupAccessibility() {
    // Enhanced accessibility is now handled by the AccessibilityManager
    // This function maintains compatibility and adds site-specific features

    // Announce page load completion
    if (window.accessibilityManager) {
      window.accessibilityManager.announce("Page loaded successfully");
    }

    // Enhanced form validation announcements
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        if (window.accessibilityManager) {
          window.accessibilityManager.announce("Form submission in progress");
        }
      });
    });

    // Portfolio navigation announcements
    const portfolioCards = document.querySelectorAll(".portfolio-card");
    portfolioCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const title = card.querySelector(".portfolio-card__title");
        if (title && window.accessibilityManager) {
          window.accessibilityManager.announce(
            `Opening project: ${title.textContent}`
          );
        }
      });
    });

    // Navigation state announcements
    const navLinks = document.querySelectorAll(".nav__link");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const section = link.textContent;
        if (window.accessibilityManager) {
          window.accessibilityManager.announce(
            `Navigating to ${section} section`
          );
        }
      });
    });

    // Legacy announcer function for backward compatibility
    window.announceToScreenReader = function (message) {
      if (window.accessibilityManager) {
        window.accessibilityManager.announce(message);
      }
    };
  }

  // Skills animation
  function setupSkillsAnimation() {
    const skillsSection = document.querySelector(".about__skills");

    if (!skillsSection) return;

    // Create intersection observer for skills animation
    const skillsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add animation class to trigger skill bar animations
            entry.target.classList.add("animate");

            // Animate skill bars with staggered timing
            const skillBars = entry.target.querySelectorAll(
              ".skill-item__progress"
            );
            skillBars.forEach((bar, index) => {
              setTimeout(() => {
                const level = bar.getAttribute("data-level");
                bar.style.width = level + "%";
              }, index * 100); // Stagger animations by 100ms
            });

            // Unobserve after animation
            skillsObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -100px 0px",
        threshold: 0.3,
      }
    );

    skillsObserver.observe(skillsSection);
  }

  // SEO optimization and monitoring
  function setupSEO() {
    // Load SEO utilities if available
    if (typeof window !== "undefined") {
      // Add structured data validation in development
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        // Development SEO monitoring
        setTimeout(() => {
          console.log("🔍 SEO Development Mode - Checking meta tags...");

          // Basic SEO checks
          const title = document.title;
          const description = document.querySelector(
            'meta[name="description"]'
          );
          const ogImage = document.querySelector('meta[property="og:image"]');

          if (!title || title.length < 30) {
            console.warn("⚠️ SEO: Page title should be 30-60 characters");
          }

          if (
            !description ||
            description.getAttribute("content").length < 120
          ) {
            console.warn(
              "⚠️ SEO: Meta description should be 120-160 characters"
            );
          }

          if (!ogImage) {
            console.warn("⚠️ SEO: Missing Open Graph image");
          }

          console.log("✅ SEO monitoring active");
        }, 1000);
      }

      // Ensure social media images are loaded
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const img = new Image();
        img.onerror = () => {
          console.warn(
            "⚠️ SEO: Open Graph image failed to load:",
            ogImage.getAttribute("content")
          );
        };
        img.src = ogImage.getAttribute("content");
      }
    }
  }

  // Utility functions
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // hCaptcha callback to clear errors when completed
  window.hcaptchaCallback = function () {
    const captchaContainer = document.querySelector(".form__captcha-container");
    if (captchaContainer) {
      const errorDiv = captchaContainer.querySelector(".form__error");
      if (errorDiv) {
        errorDiv.classList.remove("show");
        errorDiv.textContent = "";
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Handle page visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Page is hidden
      closeMobileMenu();
    }
  });

  // Handle window resize
  window.addEventListener(
    "resize",
    debounce(() => {
      // Close mobile menu on resize to desktop
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    }, 250)
  );
})();
