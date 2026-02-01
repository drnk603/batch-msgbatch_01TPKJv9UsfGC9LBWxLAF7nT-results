(function() {
  'use strict';

  const app = window.__app || {};
  window.__app = app;

  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  function initBurgerMenu() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    const toggle = document.querySelector('.navbar-toggler, .c-nav__toggle');
    const navCollapse = document.querySelector('#mainNav, .navbar-collapse');
    
    if (!toggle || !navCollapse) return;

    const navLinks = navCollapse.querySelectorAll('.nav-link, .c-nav__link');

    const closeMenu = () => {
      navCollapse.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    };

    const openMenu = () => {
      navCollapse.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
    };

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      navCollapse.classList.contains('show') ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navCollapse.classList.contains('show')) {
        closeMenu();
      }
    });

    document.addEventListener('click', (e) => {
      if (navCollapse.classList.contains('show') && 
          !navCollapse.contains(e.target) && 
          !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth >= 1024 && navCollapse.classList.contains('show')) {
        closeMenu();
      }
    }, 250));
  }

  function initSmoothScroll() {
    if (app.smoothScrollInitialized) return;
    app.smoothScrollInitialized = true;

    const isHomepage = window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/index.html');

    document.addEventListener('click', (e) => {
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      if (href.startsWith('#')) {
        if (!isHomepage) {
          target.setAttribute('href', '/' + href);
          return;
        }

        e.preventDefault();
        const sectionId = href.substring(1);
        const section = document.getElementById(sectionId);
        
        if (section) {
          const header = document.querySelector('.l-header, header');
          const headerHeight = header ? header.offsetHeight : 64;
          const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  }

  function initActiveMenuState() {
    if (app.activeMenuInitialized) return;
    app.activeMenuInitialized = true;

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .c-nav__link');

    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      
      if (linkPath === currentPath || 
          (currentPath === '/' && linkPath === '/index.html') || 
          (currentPath === '/index.html' && linkPath === '/')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    });
  }

  function initScrollSpy() {
    if (app.scrollSpyInitialized) return;
    app.scrollSpyInitialized = true;

    const sections = document.querySelectorAll('[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"], .c-nav__link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-80px 0px -80px 0px'
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'location');
            } else {
              link.classList.remove('active');
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));
  }

  function initImages() {
    if (app.imagesInitialized) return;
    app.imagesInitialized = true;

    const images = document.querySelectorAll('img');

    images.forEach(img => {
      if (!img.hasAttribute('loading') && 
          !img.classList.contains('c-logo__img') && 
          !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      img.addEventListener('error', function() {
        const svgPlaceholder = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e0e0e0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="sans-serif" font-size="18">Image not available</text></svg>';
        const encodedSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgPlaceholder);
        this.src = encodedSvg;
      }, { once: true });
    });
  }

  function initFormValidation() {
    if (app.formsInitialized) return;
    app.formsInitialized = true;

    const forms = document.querySelectorAll('.c-form, .needs-validation, form[class*="form"]');

    const validators = {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      phone: (value) => /^[\+\-\d\s\(\)]{10,20}$/.test(value),
      name: (value) => /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/.test(value),
      message: (value) => value.trim().length >= 10
    };

    const showError = (field, message) => {
      const group = field.closest('.c-form__group, .form-group, .mb-3, .mb-4');
      if (!group) return;

      group.classList.add('has-error');
      
      let errorEl = group.querySelector('.c-form__error');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'c-form__error';
        errorEl.setAttribute('role', 'alert');
        field.parentNode.appendChild(errorEl);
      }
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    };

    const clearError = (field) => {
      const group = field.closest('.c-form__group, .form-group, .mb-3, .mb-4');
      if (!group) return;

      group.classList.remove('has-error');
      const errorEl = group.querySelector('.c-form__error');
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    };

    const validateField = (field) => {
      clearError(field);

      const value = field.value.trim();
      const type = field.type;
      const id = field.id;
      const required = field.hasAttribute('required') || field.hasAttribute('aria-required');

      if (required && !value) {
        showError(field, 'Toto pole je povinné');
        return false;
      }

      if (!value) return true;

      if (type === 'email' || id.includes('email')) {
        if (!validators.email(value)) {
          showError(field, 'Zadajte platnú e-mailovú adresu');
          return false;
        }
      }

      if (type === 'tel' || id.includes('phone')) {
        if (!validators.phone(value)) {
          showError(field, 'Zadajte platné telefónne číslo');
          return false;
        }
      }

      if (id.includes('name') || id.includes('firstName') || id.includes('lastName')) {
        if (!validators.name(value)) {
          showError(field, 'Zadajte platné meno (2-50 znakov)');
          return false;
        }
      }

      if (field.tagName === 'TEXTAREA' || id.includes('message')) {
        if (!validators.message(value)) {
          showError(field, 'Správa musí obsahovať aspoň 10 znakov');
          return false;
        }
      }

      if (type === 'checkbox' && required && !field.checked) {
        showError(field, 'Toto pole je povinné');
        return false;
      }

      return true;
    };

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', debounce(() => {
          if (input.closest('.c-form__group, .form-group')?.classList.contains('has-error')) {
            validateField(input);
          }
        }, 300));
      });

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        let isValid = true;
        const fields = this.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
          if (!validateField(field)) {
            isValid = false;
          }
        });

        if (!isValid) {
          const firstError = this.querySelector('.has-error');
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.innerHTML : '';

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Odosielanie...';
        }

        setTimeout(() => {
          window.location.href = '/thank_you.html';
        }, 800);
      });
    });
  }

  function initAccordion() {
    if (app.accordionInitialized) return;
    app.accordionInitialized = true;

    const accordionButtons = document.querySelectorAll('.accordion-button');

    accordionButtons.forEach(button => {
      button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-bs-target');
        const target = document.querySelector(targetId);
        const parent = this.closest('.accordion');

        if (!target) return;

        const isExpanded = this.getAttribute('aria-expanded') === 'true';

        if (parent) {
          const allCollapses = parent.querySelectorAll('.accordion-collapse');
          const allButtons = parent.querySelectorAll('.accordion-button');

          allCollapses.forEach(collapse => {
            if (collapse !== target) {
              collapse.classList.remove('show');
            }
          });

          allButtons.forEach(btn => {
            if (btn !== this) {
              btn.classList.add('collapsed');
              btn.setAttribute('aria-expanded', 'false');
            }
          });
        }

        if (isExpanded) {
          target.classList.remove('show');
          this.classList.add('collapsed');
          this.setAttribute('aria-expanded', 'false');
        } else {
          target.classList.add('show');
          this.classList.remove('collapsed');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initScrollToTop() {
    if (app.scrollToTopInitialized) return;
    app.scrollToTopInitialized = true;

    let scrollBtn = document.querySelector('[data-scroll-top], .c-scroll-top');
    
    if (!scrollBtn) {
      scrollBtn = document.createElement('button');
      scrollBtn.className = 'c-scroll-top';
      scrollBtn.setAttribute('aria-label', 'Scroll to top');
      scrollBtn.innerHTML = '↑';
      scrollBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:50px;height:50px;border-radius:50%;background:var(--color-accent);color:var(--color-bg);border:none;cursor:pointer;opacity:0;transition:opacity 0.3s;z-index:1000;font-size:24px;';
      document.body.appendChild(scrollBtn);
    }

    const toggleVisibility = throttle(() => {
      if (window.pageYOffset > 300) {
        scrollBtn.style.opacity = '1';
      } else {
        scrollBtn.style.opacity = '0';
      }
    }, 100);

    window.addEventListener('scroll', toggleVisibility);

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  function initCountUp() {
    if (app.countUpInitialized) return;
    app.countUpInitialized = true;

    const counters = document.querySelectorAll('[data-count]');
    
    if (counters.length === 0) return;

    const animateCounter = (element) => {
      const target = parseInt(element.getAttribute('data-count'));
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += step;
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target;
        }
      };

      updateCounter();
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.hasAttribute('data-counted')) {
          entry.target.setAttribute('data-counted', 'true');
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function initPrivacyModal() {
    if (app.privacyModalInitialized) return;
    app.privacyModalInitialized = true;

    const privacyLinks = document.querySelectorAll('a[href*="privacy"], a[href*="Privacy"]');
    
    privacyLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes('privacy.html') || href.includes('#privacy'))) {
        link.addEventListener('click', function(e) {
          if (href === '#privacy' || href.includes('#privacy-modal')) {
            e.preventDefault();
          }
        });
      }
    });
  }

  function initMicroInteractions() {
    if (app.microInteractionsInitialized) return;
    app.microInteractionsInitialized = true;

    const interactiveElements = document.querySelectorAll('.c-button, .btn, .c-card, .card');

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', function() {
        this.classList.add('is-hovered');
      });

      el.addEventListener('mouseleave', function() {
        this.classList.remove('is-hovered');
      });

      el.addEventListener('mousedown', function() {
        this.classList.add('is-active');
      });

      el.addEventListener('mouseup', function() {
        this.classList.remove('is-active');
      });
    });
  }

  app.init = function() {
    if (app.initialized) return;
    app.initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initActiveMenuState();
    initScrollSpy();
    initImages();
    initFormValidation();
    initAccordion();
    initScrollToTop();
    initCountUp();
    initPrivacyModal();
    initMicroInteractions();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }
})();