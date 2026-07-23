(function () {
  "use strict";

  var orderForm = null;
  var formStartTracked = false;

  function byId(id) {
    return document.getElementById(id);
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

  function setupSmoothScroll() {
    document.querySelectorAll("[data-scroll-form]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var target = byId("order-form") || byId("form");
        var eventName = link.getAttribute("data-clarity-event") || "mid_article_cta_click";
        trackClarityEvent(eventName);

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

    document.querySelectorAll("[data-scroll-target]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var selector = link.getAttribute("href");
        var target = selector ? document.querySelector(selector) : null;
        trackClarityEvent("hero_cta_click");

        if (!target) {
          return;
        }
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  // Microsoft Clarity events
  function setupClarityEvents() {
    orderForm = byId("form");
    if (!orderForm) {
      return;
    }

    if (typeof window.IntersectionObserver === "function") {
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

    orderForm.querySelectorAll('input[name="name"], input[name="phone"]').forEach(function (input) {
      input.addEventListener("input", function () {
        if (!formStartTracked) {
          formStartTracked = true;
          trackClarityEvent("form_start");
        }
      }, { once: true });
    });
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
    setupSmoothScroll();
    setupClarityEvents();
    syncTrackingFields();
    setupBackRedirect();
    setupPhoneGuard();
    setupFormSubmit();
  });
})();
