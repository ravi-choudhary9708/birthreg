"use client";

import { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

// Month definitions
const MONTHS = [
  { index: 0, en: "January", hi: "जनवरी", short: "Jan" },
  { index: 1, en: "February", hi: "फ़रवरी", short: "Feb" },
  { index: 2, en: "March", hi: "मार्च", short: "Mar" },
  { index: 3, en: "April", hi: "अप्रैल", short: "Apr" },
  { index: 4, en: "May", hi: "मई", short: "May" },
  { index: 5, en: "June", hi: "जून", short: "Jun" },
  { index: 6, en: "July", hi: "जुलाई", short: "Jul" },
  { index: 7, en: "August", hi: "अगस्त", short: "Aug" },
  { index: 8, en: "September", hi: "सितंबर", short: "Sep" },
  { index: 9, en: "October", hi: "अक्टूबर", short: "Oct" },
  { index: 10, en: "November", hi: "नवंबर", short: "Nov" },
  { index: 11, en: "December", hi: "दिसंबर", short: "Dec" },
];

const WEEKDAYS = [
  { en: "Su", hi: "रवि", full: "Sunday" },
  { en: "Mo", hi: "सोम", full: "Monday" },
  { en: "Tu", hi: "मंगल", full: "Tuesday" },
  { en: "We", hi: "बुध", full: "Wednesday" },
  { en: "Th", hi: "गुरु", full: "Thursday" },
  { en: "Fr", hi: "शुक्र", full: "Friday" },
  { en: "Sa", hi: "शनि", full: "Saturday" },
];

function formatLocalISO(date) {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalISO(str) {
  if (!str) return null;
  // Support YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  }
  // Support DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str)) {
    const parts = str.split(/[/-]/);
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export default function DynamicDatePicker({
  value,
  onChange,
  required = false,
  label = "जन्म की तारीख (Date of Birth)",
  placeholder = "YYYY-MM-DD or select from calendar...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const containerRef = useRef(null);

  const openCalendar = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggleCalendar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeCalendar = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Lock body scroll and listen for Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeCalendar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCalendar]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const todayISO = useMemo(() => formatLocalISO(today), [today]);

  const parsedDate = useMemo(() => parseLocalISO(value), [value]);

  // Calendar browsing state (clamped to not exceed current year/month)
  const [overrideYear, setOverrideYear] = useState(null);
  const [overrideMonth, setOverrideMonth] = useState(null);

  const viewYear = overrideYear ?? (parsedDate ? Math.min(parsedDate.getFullYear(), today.getFullYear()) : today.getFullYear());
  const viewMonth = overrideMonth ?? (parsedDate ? parsedDate.getMonth() : today.getMonth());

  // Year list from current year down to 1920 (no future years permitted)
  const yearsList = useMemo(() => {
    const startYear = today.getFullYear();
    const list = [];
    for (let y = startYear; y >= 1920; y--) {
      list.push(y);
    }
    return list;
  }, [today]);

  // Future month navigation guard
  const isNextMonthDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  // Month navigation (cannot browse into future months)
  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setOverrideMonth(11);
      setOverrideYear(viewYear - 1);
    } else {
      setOverrideMonth(viewMonth - 1);
      setOverrideYear(viewYear);
    }
  }, [viewMonth, viewYear]);

  const nextMonth = useCallback(() => {
    if (isNextMonthDisabled) return;
    if (viewMonth === 11) {
      setOverrideMonth(0);
      setOverrideYear(viewYear + 1);
    } else {
      setOverrideMonth(viewMonth + 1);
      setOverrideYear(viewYear);
    }
  }, [viewMonth, viewYear, isNextMonthDisabled]);

  // Scroll & swipe navigation refs
  const daysGridRef = useRef(null);
  const lastWheelTimeRef = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Smooth mouse wheel / trackpad scroll navigation across months
  useEffect(() => {
    const el = daysGridRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) < 12) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 200) return;
      lastWheelTimeRef.current = now;

      if (e.deltaY > 0) {
        nextMonth();
      } else {
        prevMonth();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [nextMonth, prevMonth]);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe or vertical drag
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        nextMonth();
      } else {
        prevMonth();
      }
    } else if (Math.abs(deltaY) > 45) {
      if (deltaY < 0) {
        nextMonth();
      } else {
        prevMonth();
      }
    }
  };

  // Complete 42-cell calendar grid (all dates visible without any cutting off)
  const calendarCells = useMemo(() => {
    const cells = [];
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // 1. Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateObj = new Date(prevY, prevM, d);
      cells.push({
        day: d,
        year: prevY,
        month: prevM,
        isCurrentMonth: false,
        dateObj,
        iso: formatLocalISO(dateObj),
      });
    }

    // 2. All days in the current month (1 to 28/29/30/31) - ALWAYS FULLY VISIBLE & SELECTABLE
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      cells.push({
        day: d,
        year: viewYear,
        month: viewMonth,
        isCurrentMonth: true,
        dateObj,
        iso: formatLocalISO(dateObj),
      });
    }

    // 3. Leading days from next month to complete standard 35 or 42 grid slots
    const totalSlots = cells.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - cells.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateObj = new Date(nextY, nextM, d);
      cells.push({
        day: d,
        year: nextY,
        month: nextM,
        isCurrentMonth: false,
        dateObj,
        iso: formatLocalISO(dateObj),
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const selectDateCell = (cell) => {
    if (cell.iso > todayISO) return; // Disallow future dates
    setOverrideYear(cell.year);
    setOverrideMonth(cell.month);
    onChange(cell.iso);
    setTypedInput("");
    setIsOpen(false);
  };

  const selectPreset = (preset) => {
    const target = new Date(today);
    if (preset === "yesterday") {
      target.setDate(target.getDate() - 1);
    } else if (preset === "weekAgo") {
      target.setDate(target.getDate() - 7);
    } else if (preset === "monthAgo") {
      target.setMonth(target.getMonth() - 1);
    }
    setOverrideYear(target.getFullYear());
    setOverrideMonth(target.getMonth());
    onChange(formatLocalISO(target));
    setTypedInput("");
    setIsOpen(false);
  };

  const clearDate = (e) => {
    e?.stopPropagation();
    setOverrideYear(null);
    setOverrideMonth(null);
    setTypedInput("");
    onChange("");
  };

  // Handle direct manual typing
  const handleManualTyping = (e) => {
    const raw = e.target.value;
    setTypedInput(raw);
    const parsed = parseLocalISO(raw);
    if (parsed) {
      const iso = formatLocalISO(parsed);
      // Disallow future dates
      if (iso > todayISO) {
        return;
      }
      onChange(iso);
      setOverrideYear(parsed.getFullYear());
      setOverrideMonth(parsed.getMonth());
    }
  };

  // Human-readable formatted string for display
  const displayFormatted = useMemo(() => {
    if (!parsedDate) return "";
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = MONTHS[parsedDate.getMonth()].en;
    const year = parsedDate.getFullYear();
    const weekday = WEEKDAYS[parsedDate.getDay()].hi;
    return `${day} ${month} ${year} (${weekday})`;
  }, [parsedDate]);

  // Civil Registration System (CRS) statutory timeline & age calculation
  const crsAnalysis = useMemo(() => {
    if (!parsedDate) return null;
    const diffTime = today.getTime() - parsedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        diffDays,
        daysText: "Future Date (भविष्य की तारीख)",
        rule: "Please verify date of birth",
        badgeColor: "#dc2626",
      };
    }

    const daysText = diffDays === 1 ? "1 day from birth" : `${diffDays} days from birth`;

    let rule = "";
    let badgeColor = "#15803d";

    if (diffDays <= 21) {
      rule = "Within 21 Days (समय पर पंजीकरण)";
      badgeColor = "#15803d";
    } else if (diffDays <= 30) {
      rule = "21 – 30 Days (विलंबित पंजीकरण - Late Window)";
      badgeColor = "#b45309";
    } else if (diffDays <= 365) {
      rule = "30 Days to 1 Year (विशेष अनुमति - Delayed Registration)";
      badgeColor = "#c2410c";
    } else {
      rule = "Over 1 Year (अति विलंबित - SDM Order Required)";
      badgeColor = "#6b21a8";
    }

    return {
      diffDays,
      daysText,
      rule,
      badgeColor,
    };
  }, [parsedDate, today]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", zIndex: isOpen ? 60 : "auto" }}>
      {/* Dynamic Interactive Input Trigger */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Hidden input for HTML5 required form validation */}
          <input
            type="text"
            tabIndex={-1}
            value={value || ""}
            onChange={() => {}}
            required={required}
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              height: 0,
              width: 0,
              bottom: 0,
            }}
          />

          <div
            style={{
              width: "100%",
              padding: "6px 12px",
              border: isOpen ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
              borderRadius: 8,
              background: isOpen ? "#f8fafc" : "#ffffff",
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: isOpen ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
              transition: "all 0.18s ease",
              boxSizing: "border-box",
              gap: 8,
            }}
          >
            {/* Calendar Icon Button to toggle popup */}
            <button
              type="button"
              onClick={toggleCalendar}
              title="Toggle interactive calendar"
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              📅
            </button>

            {/* Editable / Formatted Date Text */}
            <div
              onClick={openCalendar}
              style={{ flex: 1, cursor: "pointer", overflow: "hidden" }}
            >
              {value ? (
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#0f172a",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                >
                  {displayFormatted}
                </span>
              ) : (
                <input
                  type="text"
                  placeholder={placeholder}
                  value={typedInput}
                  onChange={handleManualTyping}
                  onFocus={openCalendar}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 13.5,
                    color: "#0f172a",
                  }}
                />
              )}
            </div>

            {/* Action Buttons: Clear & Dropdown Chevron */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {value && (
                <button
                  type="button"
                  onClick={clearDate}
                  title="Clear selected date"
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    fontSize: 11,
                    color: "#64748b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={toggleCalendar}
                title="Open calendar"
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: 4,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▼
              </button>
            </div>
          </div>
        </div>

      {/* Centered Modal Dialog via Portal (Never cut off from up, down, or parent containers) */}
      {isOpen && isMounted && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Backdrop */}
          <div
            onClick={closeCalendar}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(2px)",
              zIndex: 1,
            }}
          />

          {/* Centered Dialog Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select Date of Birth"
            style={{
              position: "relative",
              zIndex: 2,
              width: "clamp(320px, 92vw, 375px)",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: 16,
              border: "1.5px solid #cbd5e1",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
              padding: "14px 16px 12px",
              boxSizing: "border-box",
            }}
          >
            {/* Modal Title Header with Close button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                  जन्म की तारीख (Select Date of Birth)
                </span>
              </div>
              <button
                type="button"
                onClick={closeCalendar}
                title="Close"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            {/* Header Controls: Month & Year Selectors with Fast Arrows */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={prevMonth}
                title="Previous Month"
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1e293b",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ‹
              </button>

              {/* Fast Month Dropdown */}
              <div style={{ display: "flex", gap: 6, flex: 1 }}>
                <select
                  value={viewMonth}
                  onChange={(e) => {
                    const newMonth = parseInt(e.target.value, 10);
                    if (viewYear === today.getFullYear() && newMonth > today.getMonth()) return;
                    setOverrideMonth(newMonth);
                    setOverrideYear(viewYear);
                  }}
                  style={{
                    flex: 1,
                    padding: "5px 6px",
                    borderRadius: 7,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#0f172a",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {MONTHS.map((m) => {
                    const isFutureMonth = viewYear === today.getFullYear() && m.index > today.getMonth();
                    return (
                      <option key={m.index} value={m.index} disabled={isFutureMonth}>
                        {m.en} ({m.hi})
                      </option>
                    );
                  })}
                </select>

                {/* Fast Year Dropdown */}
                <select
                  value={viewYear}
                  onChange={(e) => {
                    const selectedYear = parseInt(e.target.value, 10);
                    let targetMonth = viewMonth;
                    if (selectedYear === today.getFullYear() && targetMonth > today.getMonth()) {
                      targetMonth = today.getMonth();
                    }
                    setOverrideYear(selectedYear);
                    setOverrideMonth(targetMonth);
                  }}
                  style={{
                    width: 84,
                    padding: "5px 6px",
                    borderRadius: 7,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#0f172a",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                disabled={isNextMonthDisabled}
                title={isNextMonthDisabled ? "भविष्य के महीने उपलब्ध नहीं हैं (Future months not allowed)" : "Next Month"}
                style={{
                  background: isNextMonthDisabled ? "#f8fafc" : "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: isNextMonthDisabled ? "#cbd5e1" : "#1e293b",
                  cursor: isNextMonthDisabled ? "not-allowed" : "pointer",
                  opacity: isNextMonthDisabled ? 0.35 : 1,
                  flexShrink: 0,
                }}
              >
                ›
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => selectPreset("today")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🌟 आज (Today)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("yesterday")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                कल (Yesterday)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("weekAgo")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                7 दिन पूर्व (1 Wk)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("monthAgo")}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                1 माह पूर्व (1 Mo)
              </button>
            </div>

            {/* Day-of-Week Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                textAlign: "center",
                marginBottom: 4,
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
              }}
            >
              {WEEKDAYS.map((w) => (
                <div key={w.en} style={{ padding: "2px 0" }}>
                  {w.hi}
                </div>
              ))}
            </div>

            {/* Full Interactive 42-Cell Days Grid */}
            <div
              ref={daysGridRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 3,
                marginBottom: 8,
                touchAction: "pan-y",
              }}
            >
              {calendarCells.map((cell, idx) => {
                const isSelected = value === cell.iso;
                const isToday = todayISO === cell.iso;
                const isFuture = cell.iso > todayISO;

                return (
                  <button
                    key={`${cell.iso}-${idx}`}
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      if (!isFuture) selectDateCell(cell);
                    }}
                    style={{
                      height: 30,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 7,
                      border: isSelected
                        ? "1.5px solid #1e40af"
                        : isToday
                        ? "1.5px solid #3b82f6"
                        : "1px solid transparent",
                      background: isSelected
                        ? "#1e40af"
                        : isToday
                        ? "#eff6ff"
                        : "transparent",
                      color: isFuture
                        ? "#cbd5e1"
                        : isSelected
                        ? "#ffffff"
                        : isToday
                        ? "#1e40af"
                        : cell.isCurrentMonth
                        ? "#0f172a"
                        : "#94a3b8",
                      fontSize: 12.5,
                      fontWeight: isSelected || isToday ? 700 : cell.isCurrentMonth ? 600 : 400,
                      cursor: isFuture ? "not-allowed" : "pointer",
                      opacity: isFuture ? 0.35 : 1,
                      position: "relative",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isFuture) {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.color = "#1e40af";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isFuture) {
                        e.currentTarget.style.background = isToday ? "#eff6ff" : "transparent";
                        e.currentTarget.style.color = isToday
                          ? "#1e40af"
                          : cell.isCurrentMonth
                          ? "#0f172a"
                          : "#94a3b8";
                      }
                    }}
                    title={isFuture ? `${cell.iso} (भविष्य की तारीख अमान्य है / Future date not allowed)` : cell.iso}
                  >
                    {cell.day}
                    {isToday && !isSelected && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 2,
                          width: 3.5,
                          height: 3.5,
                          borderRadius: "50%",
                          background: "#3b82f6",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Age & Statutory Guidance Footer */}
            {crsAnalysis && (
              <div
                style={{
                  marginTop: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 11.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 600, color: "#1e293b" }}>
                  {crsAnalysis.daysText}
                </span>
                <span style={{ color: "#94a3b8" }}>•</span>
                <span style={{ fontWeight: 600, color: crsAnalysis.badgeColor }}>
                  {crsAnalysis.rule}
                </span>
              </div>
            )}

            {/* Modal Footer */}
            <div
              style={{
                paddingTop: 6,
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={closeCalendar}
                style={{
                  background: "#2563eb",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Done (पूर्ण)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Simple Days from Birth & Statutory Condition */}
      {crsAnalysis && !isOpen && (
        <div
          style={{
            marginTop: 5,
            fontSize: 12,
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 600, color: "#1e293b" }}>
            {crsAnalysis.daysText}
          </span>
          <span style={{ color: "#94a3b8" }}>•</span>
          <span style={{ fontWeight: 600, color: crsAnalysis.badgeColor }}>
            {crsAnalysis.rule}
          </span>
        </div>
      )}
    </div>
  );
}
