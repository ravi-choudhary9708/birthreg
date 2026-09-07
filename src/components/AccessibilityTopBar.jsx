"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "as", label: "অসমীয়া (Assamese)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
];

// Renamed to avoid colliding with the native browser "languagechange" event
const LANG_EVENT = "app:languagechange";
const FONT_EVENT = "app:fontsizechange";

function subscribeLang(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LANG_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LANG_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getLangSnapshot() {
  if (typeof window === "undefined") return "en";
  try {
    return localStorage.getItem("app_lang") || localStorage.getItem("nagarLang") || "en";
  } catch {
    return "en";
  }
}

function subscribeFont(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(FONT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(FONT_EVENT, callback);
  };
}

function getFontSnapshot() {
  if (typeof window === "undefined") return 0;
  try {
    const val = parseInt(localStorage.getItem("app_font_size") || "0", 10);
    return val === 1 || val === -1 || val === 0 ? val : 0;
  } catch {
    return 0;
  }
}

export default function AccessibilityTopBar() {
  const selectedLang = useSyncExternalStore(subscribeLang, getLangSnapshot, () => "en");
  const fontSize = useSyncExternalStore(subscribeFont, getFontSnapshot, () => 0);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const langDropdownRef = useRef(null);
  const triggerBtnRef = useRef(null); // Government of Bihar button that opens the modal
  const closeBtnRef = useRef(null); // modal's close (X) button

  // Sync font size and language with DOM
  useEffect(() => {
    const html = document.documentElement;
    if (!html) return;

    html.classList.remove("a11y-font-large", "a11y-font-small");
    if (fontSize === 1) {
      html.classList.add("a11y-font-large");
    } else if (fontSize === -1) {
      html.classList.add("a11y-font-small");
    }
    html.lang = selectedLang;
  }, [fontSize, selectedLang]);

  // Lock background scroll while the modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isModalOpen]);

  // Move focus into the modal on open, and back to the trigger on close
  useEffect(() => {
    if (isModalOpen) {
      closeBtnRef.current?.focus();
    } else {
      triggerBtnRef.current?.focus();
    }
  }, [isModalOpen]);

  // Click outside listener for language dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key closes modal & dropdown
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsLangOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSkipToMain = (e) => {
    e.preventDefault();
    const target = document.getElementById("main-section") || document.getElementById("main-content");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus({ preventScroll: true });
    }
  };

  const handleFontSizeChange = (val) => {
    try {
      localStorage.setItem("app_font_size", val.toString());
    } catch {
      // Ignore
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(FONT_EVENT, { detail: { fontSize: val } }));
    }
  };

  const handleSelectLanguage = (code) => {
    try {
      localStorage.setItem("app_lang", code);
      localStorage.setItem("nagarLang", code);
    } catch {
      // Ignore
    }
    setIsLangOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: { lang: code } }));
    }
  };

  const activeLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];
  const activeLangLabel = activeLangObj.label.split(" ")[0];

  return (
    <>
      {/* Sleek Government Top Header */}
      <div className="header-top px-2">
        <div className="container">
          {/* Left: Government of Bihar Official Brand Button */}
          <div className="lftIcon">
            <button
              ref={triggerBtnRef}
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="goi-btn group focus:outline-none focus:ring-2 focus:ring-white/40"
              title="https://state.bihar.gov.in"
              aria-haspopup="dialog"
            >
              {/* Bihar State Seal */}
              <img
                src="/bihar_government.webp"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/logo.png";
                }}
                className="bihar-seal"
                alt="Government of Bihar Seal"
                loading="lazy"
              />
              <span className="font-semibold text-white tracking-wide text-[11.5px] sm:text-[12px]">
                {selectedLang === "hi" ? "बिहार सरकार" : "Government of Bihar"}
              </span>
              <svg
                className="w-3 h-3 text-white/70 group-hover:text-white transition-colors ml-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          </div>

          {/* Right: Accessibility Controls & Language Dropdown */}
          <div className="right-controls">
            {/* Skip to Main Content Link */}
            <a
              href="#main-section"
              onClick={handleSkipToMain}
              id="SkipToMain"
              title="Skip to main content"
              className="focus:outline-none focus:ring-1 focus:ring-white/40"
            >
              {selectedLang === "hi" ? "मुख्य सामग्री पर जाएं" : "Skip to main content"}
            </a>

            <span className="partition" aria-hidden="true">
              |
            </span>

            {/* Segmented Font Size Control [ A- | A | A+ ] */}
            <div className="font-segmented" role="group" aria-label="Font size controls">
              <button
                type="button"
                id="btn-decrease"
                onClick={() => handleFontSizeChange(-1)}
                className={`font-btn ${fontSize === -1 ? "active" : ""}`}
                title="Decrease font size (A-)"
                aria-label="Decrease font size"
                aria-pressed={fontSize === -1}
              >
                A-
              </button>

              <button
                type="button"
                id="btn-orig"
                onClick={() => handleFontSizeChange(0)}
                className={`font-btn ${fontSize === 0 ? "active" : ""}`}
                title="Normal font size (A)"
                aria-label="Normal font size"
                aria-pressed={fontSize === 0}
              >
                A
              </button>

              <button
                type="button"
                id="btn-increase"
                onClick={() => handleFontSizeChange(1)}
                className={`font-btn ${fontSize === 1 ? "active" : ""}`}
                title="Increase font size (A+)"
                aria-label="Increase font size"
                aria-pressed={fontSize === 1}
              >
                A+
              </button>
            </div>

            <span className="partition" aria-hidden="true">
              |
            </span>

            {/* Language Dropdown */}
            <div className="lang-container" ref={langDropdownRef}>
              <button
                type="button"
                className="lang-pill-btn focus:outline-none focus:ring-1 focus:ring-white/40"
                aria-expanded={isLangOpen}
                aria-haspopup="listbox"
                onClick={() => setIsLangOpen((prev) => !prev)}
              >
                {/* Globe / Translation Icon */}
                <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <span>{activeLangLabel}</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isLangOpen && (
                <div
                  className="lang-dropdown-card animate-fadeIn"
                  role="listbox"
                  aria-label="Select language"
                  data-lenis-prevent="true"
                  style={{ overscrollBehavior: "contain" }}
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Select Language / भाषा चुनें
                  </div>
                  <ul className="py-1">
                    {LANGUAGES.map((lang) => {
                      const isSelected = selectedLang === lang.code;
                      return (
                        <li key={lang.code}>
                          <button
                            type="button"
                            className={`lang-item ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSelectLanguage(lang.code)}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span>{lang.label}</span>
                            {isSelected && (
                              <svg
                                className="w-3.5 h-3.5 text-[#1e40af]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* External Link — browser-alert style dialog */}
      {isModalOpen && (
        <div
          id="external-link-modal"
          data-lenis-prevent="true"
          className="el-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bihar-modal-title"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="el-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* URL line */}
            <p id="bihar-modal-title" className="el-url">
              https://state.bihar.gov.in
            </p>

            {/* Warning body */}
            <p className="el-body">
              {selectedLang === "hi"
                ? "आप एक बाहरी वेबसाइट पर पुनर्निर्देशित किए जा रहे हैं। कृपया ध्यान दें कि यह पोर्टल बाहरी वेबसाइटों की सामग्री और गोपनीयता नीतियों के लिए ज़िम्मेदार नहीं है।"
                : "You are being redirected to an external website. Please note that Birth Certificate Portal is not responsible for external websites content & privacy policies."}
            </p>

            {/* Actions */}
            <div className="el-actions">
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="el-btn-cancel"
              >
                {selectedLang === "hi" ? "रद्द करें" : "CANCEL"}
              </button>
              <a
                href="https://state.bihar.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsModalOpen(false)}
                className="el-btn-ok"
              >
                {selectedLang === "hi" ? "ठीक है" : "OK"}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}