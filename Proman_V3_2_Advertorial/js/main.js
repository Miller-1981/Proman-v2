(function () {
  "use strict";

  var orderForm = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function setupHeroVariant() {
    var params = new URLSearchParams(window.location.search);
    var variant = (params.get("hero") || params.get("variant") || document.body.dataset.heroVariant || "A").toUpperCase();
    if (!/^[ABC]$/.test(variant)) {
      variant = "A";
    }

    document.body.dataset.heroVariant = variant;
    document.querySelectorAll("[data-hero-copy]").forEach(function (block) {
      block.hidden = block.dataset.heroCopy !== variant;
    });
  }

  function setupSmoothScroll() {
    document.querySelectorAll("[data-scroll-form]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var target = byId("order-form") || byId("form");
        if (!target) {
          return;
        }
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", "#order-form");
        }
      });
    });
  }

  // Microsoft Clarity events
  function trackClarityEvent(eventName) {
    if (typeof window.clarity === "function") {
      try {
        window.clarity("event", eventName);
      } catch (error) {
        // Tracking must never interrupt the order flow.
      }
    }
  }

  // Microsoft Clarity events
  function setupClarityEvents() {
    var heroCta = document.querySelector(".article-hero [data-scroll-form]");

    if (heroCta) {
      heroCta.addEventListener("click", function () {
        trackClarityEvent("hero_click");
      });
    }

    document.querySelectorAll("[data-scroll-form]").forEach(function (button) {
      button.addEventListener("click", function () {
        trackClarityEvent("cta_click");
      });
    });

    orderForm = byId("form");
    if (orderForm) {
      var submitButton = orderForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.addEventListener("click", function () {
          trackClarityEvent("cta_click");
        });
      }
    }

    if (!orderForm || typeof window.IntersectionObserver !== "function") {
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          trackClarityEvent("form_view");
          observer.disconnect();
        }
      });
    }, { threshold: 0.35 });

    observer.observe(orderForm);
  }

  function syncTrackingFields() {
    var params = new URLSearchParams(window.location.search);
    ["subid", "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term", "fbpxl"].forEach(function (name) {
      var field = document.querySelector('input[name="' + name + '"]');
      var value = params.get(name);
      if (field && value) {
        field.value = value;
      }
    });
  }

  function setupBackRedirect() {
    try {
      window.history.pushState({ page: 1 }, "", "");
      window.onpopstate = function (event) {
        if (event) {
          var target = byId("order-form") || byId("form");
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      };
    } catch (error) {
      // Some embedded browsers restrict history operations.
    }
  }

  window.lockform = function (form) {
    var submit = form.querySelector('button[type="submit"]');
    if (!submit || submit.dataset.locked === "true") {
      return;
    }

    submit.dataset.locked = "true";
    submit.style.display = "none";

    var notice = document.createElement("div");
    notice.className = "form-loading";
    notice.textContent = "Please wait...";
    submit.parentNode.insertBefore(notice, submit.nextSibling);
  };

  function setupPhoneGuard() {
    var inputPhone = byId("phone2");
    if (!inputPhone) {
      return;
    }

    inputPhone.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9+]/g, "");
      if (this.value.indexOf("+") > 0) {
        this.value = this.value.replace(/\+/g, "");
      }
    });
  }

  function getCookie(name) {
    var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : null;
  }

  function isPhoneUsed(phone) {
    var storedPhones = getCookie("submittedPhones");
    if (!storedPhones) {
      return false;
    }

    try {
      return JSON.parse(storedPhones).includes(phone);
    } catch (error) {
      return false;
    }
  }

  function setupFormSubmit() {
    orderForm = byId("form");
    if (!orderForm) {
      return;
    }

    orderForm.addEventListener("submit", function (event) {
      var inputPhone = orderForm.querySelector('input[name="phone"]');
      var phoneNumber = inputPhone ? inputPhone.value : "";

      event.preventDefault();

      if (isPhoneUsed(phoneNumber)) {
        alert("You have already submitted your request. Please wait for our operator to call.");
        return;
      }

      trackClarityEvent("lead_submit");
      orderForm.submit();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupHeroVariant();
    setupClarityEvents();
    setupSmoothScroll();
    syncTrackingFields();
    setupBackRedirect();
    setupPhoneGuard();
    setupFormSubmit();
  });
})();
