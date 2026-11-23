/* ==========================================================================
   AURA — Coffee Atelier
   Motion & interaction layer
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var $ = function (selector, scope) {
    return (scope || doc).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || doc).querySelectorAll(selector));
  };
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;

  /* ------------------------------------------------------------------------
     Smooth scrolling
     ------------------------------------------------------------------------ */
  if (hasGSAP && window.Lenis && !reducedMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
      touchMultiplier: 1.5
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.4, offset: 0 });
    } else {
      var top = target.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: top, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  /* ------------------------------------------------------------------------
     Basics
     ------------------------------------------------------------------------ */
  function setYear() {
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initHeaderState() {
    var header = $("#siteHeader");
    if (!header) return;
    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------------ */
  function initCursor() {
    if (!finePointer || !hasGSAP) return;
    var cursor = $("#cursor");
    if (!cursor) return;

    var moveX = gsap.quickTo(cursor, "x", { duration: 0.32, ease: "power3" });
    var moveY = gsap.quickTo(cursor, "y", { duration: 0.32, ease: "power3" });
    var hasMoved = false;

    window.addEventListener("mousemove", function (event) {
      if (!hasMoved) {
        gsap.set(cursor, { x: event.clientX, y: event.clientY });
        hasMoved = true;
      }
      moveX(event.clientX);
      moveY(event.clientY);
    });

    var hoverSelector = 'a, button, [data-cursor="hover"]';

    doc.addEventListener("mouseover", function (event) {
      if (event.target.closest && event.target.closest(hoverSelector)) {
        body.classList.add("cursor-hover");
      }
    });

    doc.addEventListener("mouseout", function (event) {
      if (event.target.closest && event.target.closest(hoverSelector)) {
        body.classList.remove("cursor-hover");
      }
    });

    window.addEventListener("mousedown", function () {
      body.classList.add("cursor-down");
    });
    window.addEventListener("mouseup", function () {
      body.classList.remove("cursor-down");
    });
    doc.addEventListener("mouseleave", function () {
      gsap.to(cursor, { autoAlpha: 0, duration: 0.25 });
    });
    doc.addEventListener("mouseenter", function () {
      gsap.to(cursor, { autoAlpha: 1, duration: 0.25 });
    });
  }

  /* ------------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------------ */
  function initMagnetic() {
    if (!finePointer || !hasGSAP || reducedMotion) return;

    $$(".magnetic").forEach(function (element) {
      var moveX = gsap.quickTo(element, "x", { duration: 0.55, ease: "power3" });
      var moveY = gsap.quickTo(element, "y", { duration: 0.55, ease: "power3" });

      element.addEventListener("mousemove", function (event) {
        var rect = element.getBoundingClientRect();
        var relX = event.clientX - (rect.left + rect.width / 2);
        var relY = event.clientY - (rect.top + rect.height / 2);
        moveX(relX * 0.22);
        moveY(relY * 0.3);
      });

      element.addEventListener("mouseleave", function () {
        moveX(0);
        moveY(0);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Bento card tilt + light reflection
     ------------------------------------------------------------------------ */
  function initTilt() {
    if (!finePointer || !hasGSAP || reducedMotion) return;

    $$("[data-tilt]").forEach(function (card) {
      gsap.set(card, { transformPerspective: 950 });
      var rotateX = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power2.out" });
      var rotateY = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power2.out" });

      card.addEventListener("mousemove", function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;

        rotateX((0.5 - y) * 6);
        rotateY((x - 0.5) * 8);

        card.style.setProperty("--mx", (x * 100).toFixed(2) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(2) + "%");
      });

      card.addEventListener("mouseleave", function () {
        rotateX(0);
        rotateY(0);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Navigation + mobile menu
     ------------------------------------------------------------------------ */
  function initNavigation() {
    var toggle = $("#menuToggle");
    var nav = $("#primaryNav");
    if (!toggle || !nav) return;

    var links = $$(".nav__link", nav);
    var navFooter = $(".nav__footer", nav);
    var isOpen = false;

    function setMenu(open) {
      isOpen = open;
      body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

      if (lenis) {
        if (open) lenis.stop();
        else lenis.start();
      }

      if (!hasGSAP || reducedMotion) return;

      if (open) {
        gsap.fromTo(
          links,
          { yPercent: 115, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.85, stagger: 0.07, ease: "power4.out", delay: 0.2, overwrite: true }
        );
        if (navFooter) {
          gsap.fromTo(
            navFooter,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.5, overwrite: true }
          );
        }
      } else {
        gsap.to(links, { yPercent: 40, autoAlpha: 0, duration: 0.3, ease: "power2.in", overwrite: true });
        if (navFooter) gsap.to(navFooter, { autoAlpha: 0, duration: 0.2, overwrite: true });
      }
    }

    toggle.addEventListener("click", function () {
      setMenu(!isOpen);
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) setMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024 && isOpen) setMenu(false);
    });

    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        var id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        var target = doc.getElementById(id.slice(1));
        if (!target) return;

        event.preventDefault();
        var wasOpen = isOpen;
        if (wasOpen) setMenu(false);
        // allow the menu curtain to start closing before the scroll begins
        window.setTimeout(function () {
          scrollToTarget(target);
        }, wasOpen ? 160 : 0);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Newsletter
     ------------------------------------------------------------------------ */
  function initNewsletter() {
    var form = $("#newsletterForm");
    var input = $("#newsletterEmail");
    var message = $("#newsletterMsg");
    if (!form || !input || !message) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

      message.textContent = valid
        ? "Welcome to the circle. Your first letter is on its way."
        : "Please enter a valid email address.";
      message.classList.toggle("is-error", !valid);
      message.classList.add("is-visible");

      if (valid) {
        form.reset();
        input.blur();
      } else {
        input.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Gallery marquee
     ------------------------------------------------------------------------ */
  var marqueeTweens = [];

  function buildMarquees(animate) {
    marqueeTweens.forEach(function (tween) {
      tween.kill();
    });
    marqueeTweens = [];

    $$("[data-marquee]").forEach(function (marquee) {
      var track = $(".marquee__track", marquee);
      if (!track) return;

      // duplicate the set once so the loop is seamless
      if (!track.dataset.cloned) {
        $$(".marquee__item", track).forEach(function (item) {
          var clone = item.cloneNode(true);
          var image = $("img", clone);
          clone.setAttribute("aria-hidden", "true");
          if (image) {
            image.setAttribute("alt", "");
            image.removeAttribute("loading");
          }
          track.appendChild(clone);
        });
        track.dataset.cloned = "true";
      }

      if (!animate) return;

      var items = $$(".marquee__item", track);
      var gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap) || 0;
      var setWidth = 0;
      var half = items.length / 2;

      for (var i = 0; i < half; i += 1) {
        setWidth += items[i].getBoundingClientRect().width;
      }
      setWidth += gap * half;

      var reverse = marquee.dataset.dir === "right";
      var tween;

      if (reverse) {
        gsap.set(track, { x: -setWidth });
        tween = gsap.to(track, {
          x: 0,
          duration: 52,
          ease: "none",
          repeat: -1
        });
      } else {
        gsap.set(track, { x: 0 });
        tween = gsap.to(track, {
          x: -setWidth,
          duration: 46,
          ease: "none",
          repeat: -1
        });
      }

      marqueeTweens.push(tween);
      marquee._auraTween = tween;

      if (!marquee.dataset.hoverBound) {
        marquee.dataset.hoverBound = "true";
        marquee.addEventListener("mouseenter", function () {
          if (marquee._auraTween) gsap.to(marquee._auraTween, { timeScale: 0.3, duration: 0.8, overwrite: true });
        });
        marquee.addEventListener("mouseleave", function () {
          if (marquee._auraTween) gsap.to(marquee._auraTween, { timeScale: 1, duration: 0.8, overwrite: true });
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Preloader + entrance choreography
     ------------------------------------------------------------------------ */
  function heroEntrance() {
    var timeline = gsap.timeline({ defaults: { ease: "expo.out" } });

    timeline
      .to(".hero__media img", { scale: 1, duration: 2.6, ease: "power2.out" }, 0)
      .to(".hero__title .mask__i", { yPercent: 0, duration: 1.5, stagger: 0.12 }, 0.12)
      .to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 1 }, 0.4)
      .to(".hero__sub", { autoAlpha: 1, y: 0, duration: 1.1 }, 0.66)
      .to(".hero__link", { autoAlpha: 1, y: 0, duration: 1 }, 0.8)
      .to(".hero__foot", { autoAlpha: 1, duration: 1.2 }, 1.05);

    return timeline;
  }

  function initPreloader() {
    var preloader = $("#preloader");
    var counter = $("#preloaderCount");
    var fill = $("#preloaderFill");

    if (!preloader) {
      heroEntrance();
      return;
    }

    body.classList.add("is-locked");
    if (lenis) lenis.stop();

    var progress = { value: 0 };
    var timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: function () {
        preloader.style.display = "none";
        body.classList.remove("is-locked");
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });

    timeline
      .to(".preloader__eyebrow", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.15)
      .to(".preloader__word span", { autoAlpha: 1, yPercent: 0, duration: 1.15, stagger: 0.09, ease: "expo.out" }, 0.25)
      .to(".preloader__arabic", { autoAlpha: 1, y: 0, duration: 0.8 }, 0.7)
      .to(".preloader__word", { opacity: 0.68, duration: 1, ease: "sine.inOut" }, 0.95)
      .to(".preloader__word", { opacity: 1, duration: 0.9, ease: "sine.inOut" }, 1.65)
      .to(
        progress,
        {
          value: 100,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: function () {
            if (counter) counter.textContent = String(Math.round(progress.value)).padStart(2, "0");
          }
        },
        0.3
      )
      .to(fill, { width: "100%", duration: 2, ease: "power2.inOut" }, 0.3)
      .to(
        ".preloader__eyebrow, .preloader__arabic, .preloader__bar",
        { autoAlpha: 0, y: -8, duration: 0.55, stagger: 0.05 },
        2.4
      )
      .to(".preloader__word span", { yPercent: -110, duration: 0.8, stagger: 0.045, ease: "power3.in" }, 2.6)
      .to(".preloader__meta", { autoAlpha: 0, duration: 0.4 }, 2.5)
      .to(preloader, { yPercent: -100, duration: 1.15, ease: "expo.inOut" }, 2.95)
      .add(heroEntrance(), "-=0.6");
  }

  /* ------------------------------------------------------------------------
     Scroll-driven reveals
     ------------------------------------------------------------------------ */
  function initScrollAnimations() {
    // Hero image hangover
    gsap.to(".hero__media img", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Display headings: masked line reveal
    $$(".display").forEach(function (heading) {
      var lines = $$(".mask__i", heading);
      if (!lines.length) return;
      gsap.fromTo(
        lines,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: 1.35,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: heading, start: "top 86%" }
        }
      );
    });

    // Labels
    $$(".label").forEach(function (label) {
      gsap.fromTo(
        label,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: label, start: "top 92%" }
        }
      );
    });

    // Paragraphs, stats, links
    $$(".reveal").forEach(function (element) {
      gsap.fromTo(
        element,
        { y: 34, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 90%" }
        }
      );
    });

    // Story image clip reveal
    gsap.fromTo(
      ".story__media .media",
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 1.6,
        ease: "expo.inOut",
        scrollTrigger: { trigger: ".story__media", start: "top 84%" }
      }
    );

    gsap.fromTo(
      ".story__caption",
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: ".story__media", start: "top 70%" }
      }
    );

    // Image parallax
    $$("[data-parallax]").forEach(function (wrapper) {
      if (wrapper.classList.contains("hero__media")) return;
      var image = $("img", wrapper);
      if (!image) return;
      var speed = parseFloat(wrapper.dataset.speed) || 8;

      gsap.fromTo(
        image,
        { yPercent: -speed, scale: 1.14 },
        {
          yPercent: speed,
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });

    // Bento cards
    gsap.fromTo(
      ".card",
      { y: 60, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1.15,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".bento", start: "top 84%" }
      }
    );

    // Footer bar
    gsap.fromTo(
      ".footer__grid",
      { autoAlpha: 0, y: 40 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: ".footer__grid", start: "top 88%" }
      }
    );
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function removePreloader() {
    var preloader = $("#preloader");
    if (preloader) preloader.remove();
    body.classList.remove("is-locked");
  }

  function init() {
    setYear();
    initHeaderState();
    initCursor();
    initMagnetic();
    initTilt();
    initNavigation();
    initNewsletter();

    if (!hasGSAP) {
      removePreloader();
      buildMarquees(false);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (reducedMotion) {
      removePreloader();
      buildMarquees(false);
      ScrollTrigger.refresh();
      return;
    }

    gsap.set(".hero__title .mask__i", { yPercent: 115 });
    gsap.set(".hero__eyebrow", { autoAlpha: 0, y: 16 });
    gsap.set(".hero__sub", { autoAlpha: 0, y: 20 });
    gsap.set(".hero__link", { autoAlpha: 0, y: 20 });
    gsap.set(".hero__foot", { autoAlpha: 0 });
    gsap.set(".hero__media img", { scale: 1.12 });
    gsap.set(".preloader__word span", { autoAlpha: 0, yPercent: 120 });
    gsap.set(".preloader__eyebrow, .preloader__arabic", { autoAlpha: 0, y: 10 });

    buildMarquees(true);
    initPreloader();
    initScrollAnimations();

    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
      buildMarquees(true);
    });

    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(function () {
        ScrollTrigger.refresh();
      });
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        ScrollTrigger.refresh();
        buildMarquees(true);
      }, 300);
    });
  }

  function boot() {
    try {
      init();
    } catch (error) {
      removePreloader();
      if (window.console && console.error) console.error("AURA initialisation failed:", error);
    }
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();