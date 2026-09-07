/**
 * Accessibility Core JavaScript (A11y)
 * Compatible with Government of India & State Portal A11y Standards
 */

(function () {
  if (typeof window === "undefined") return;

  const A11Y_STORAGE_KEY = "birthreg_a11y_settings";

  function getSettings() {
    try {
      const saved = localStorage.getItem(A11Y_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }

  window.a11yApplySettings = function () {
    const s = getSettings();
    const body = document.body;
    const html = document.documentElement;
    if (!body) return;

    // Theme / Contrast
    body.classList.remove("a11y-high-contrast", "a11y-dark-mode", "a11y-light-mode");
    if (s.theme === "highContrast") body.classList.add("a11y-high-contrast");
    else if (s.theme === "dark") body.classList.add("a11y-dark-mode");
    else if (s.theme === "light") body.classList.add("a11y-light-mode");

    // Font Size
    html.classList.remove("a11y-font-large", "a11y-font-small");
    if (s.fontSize === 2 || s.fontSize === "large") {
      html.classList.add("a11y-font-large");
    } else if (s.fontSize === -2 || s.fontSize === "small") {
      html.classList.add("a11y-font-small");
    }
    if (html.style.zoom) {
      html.style.removeProperty("zoom");
    }

    // Other Tools
    body.classList.toggle("a11y-dyslexia", !!s.dyslexia);
    body.classList.toggle("a11y-highlight-links", !!s.highlightLinks);
    body.classList.toggle("a11y-hide-images", !!s.hideImages);
    body.classList.toggle("a11y-big-cursor", !!s.bigCursor);
    body.classList.toggle("a11y-text-spacing", !!s.textSpacing);
    body.classList.toggle("a11y-line-height", !!s.lineHeight);

    // Language
    const lang = s.lang || localStorage.getItem("nagarLang") || "en";
    html.lang = lang;

    // Notify React component
    window.dispatchEvent(new CustomEvent("a11y-updated", { detail: s }));
  };

  window.a11yToggle = function (feature) {
    const s = getSettings();
    if (feature === "highContrast") {
      s.theme = s.theme === "highContrast" ? "default" : "highContrast";
    } else if (feature === "lightMode") {
      s.theme = s.theme === "light" ? "default" : "light";
    } else if (feature === "darkMode") {
      s.theme = s.theme === "dark" ? "default" : "dark";
    } else if (feature === "tts") {
      s.tts = !s.tts;
    } else {
      s[feature] = !s[feature];
    }
    saveSettings(s);
    window.a11yApplySettings();
  };

  window.a11yChangeFontSize = function (delta) {
    const s = getSettings();
    if (delta === 2) s.fontSize = 2;
    else if (delta === -2) s.fontSize = -2;
    else s.fontSize = 0;
    saveSettings(s);
    window.a11yApplySettings();
  };

  window.a11yReset = function () {
    localStorage.removeItem(A11Y_STORAGE_KEY);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    window.a11yApplySettings();
  };

  window.a11ySelectLang = function (lang) {
    const s = getSettings();
    s.lang = lang;
    saveSettings(s);
    localStorage.setItem("nagarLang", lang);
    localStorage.setItem("app_language", lang);
    window.a11yApplySettings();
    window.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
  };

  window.setLanguage = window.a11ySelectLang;
})();
