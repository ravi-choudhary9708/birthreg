"use client";

import { useEffect, useState } from "react";

/**
 * Enforces session security by detecting page reloads/refreshes on protected dashboards.
 * When a user reloads the dashboard, their session is invalidated and they are redirected
 * to /logout?reason=refresh.
 *
 * Prevents false positives when freshly logging in from the login page.
 */
export function useRefreshSecurity() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const terminateSession = (reason = "session_expired") => {
        try {
          sessionStorage.removeItem("dashboard_session_active");
          sessionStorage.removeItem("just_logged_in");
          sessionStorage.removeItem("dashboard_refreshed");
        } catch (_) {}

        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/auth/logout");
        } else {
          fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
        }

        setIsRefreshing(true);
        window.location.replace(`/logout?reason=${reason}`);
      };

      // 1. Check for bfcache restoration (Back/Forward Cache)
      const handlePageShow = (event) => {
        if (event.persisted) {
          terminateSession("session_expired");
        }
      };
      window.addEventListener("pageshow", handlePageShow);

      // 2. Check for popstate (Browser Back/Forward navigation in client SPA)
      const handlePopState = () => {
        terminateSession("session_expired");
      };
      window.addEventListener("popstate", handlePopState);

      // 3. Register beforeunload to capture browser reload vs departure
      const handleBeforeUnload = () => {
        sessionStorage.setItem("dashboard_refreshed", "true");
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      // 4. Register pagehide to invalidate session on unload/departure
      const handlePageHide = () => {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/auth/logout");
        }
      };
      window.addEventListener("pagehide", handlePageHide);

      // 5. Handshake: Check if user freshly logged in from /login
      const justLoggedInStr = sessionStorage.getItem("just_logged_in");
      let isFreshLogin = false;
      if (justLoggedInStr) {
        const justLoggedInTime = parseInt(justLoggedInStr, 10);
        if (Number.isFinite(justLoggedInTime) && Date.now() - justLoggedInTime < 15000) {
          isFreshLogin = true;
          sessionStorage.removeItem("just_logged_in");
          sessionStorage.setItem("dashboard_session_active", "true");
          sessionStorage.removeItem("dashboard_refreshed");
        } else {
          sessionStorage.removeItem("just_logged_in");
        }
      }

      // 6. Navigation Type Analysis
      const navEntries =
        typeof performance !== "undefined" && performance.getEntriesByType
          ? performance.getEntriesByType("navigation")
          : [];
      const navEntry = navEntries[0];
      const navType = navEntry?.type;
      const isLegacyReload =
        typeof performance !== "undefined" && performance.navigation?.type === 1;
      const isLegacyBackForward =
        typeof performance !== "undefined" && performance.navigation?.type === 2;

      const isBackForward = navType === "back_forward" || isLegacyBackForward;
      const isExplicitDashboardReload = sessionStorage.getItem("dashboard_refreshed") === "true";
      const wasDashboardActive = sessionStorage.getItem("dashboard_session_active") === "true";

      const docUrl = navEntry?.name || "";
      const isDashboardDoc = docUrl.includes("/dashboard");
      const isReload =
        isExplicitDashboardReload ||
        ((navType === "reload" || isLegacyReload) && isDashboardDoc && wasDashboardActive);

      // If user came via browser Back/Forward arrow button
      if (isBackForward) {
        terminateSession("session_expired");
        return;
      }

      // If page was reloaded/refreshed
      if (isReload) {
        terminateSession("refresh");
        return;
      }

      // If neither a fresh login nor previously active session, require re-login
      if (!isFreshLogin && !wasDashboardActive) {
        terminateSession("session_expired");
        return;
      }

      // Mark session active and clear reload flags
      sessionStorage.setItem("dashboard_session_active", "true");
      sessionStorage.removeItem("dashboard_refreshed");

      return () => {
        window.removeEventListener("pageshow", handlePageShow);
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("pagehide", handlePageHide);

        // If unmounting and navigating outside dashboard, invalidate session
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/dashboard")) {
          sessionStorage.removeItem("dashboard_session_active");
          sessionStorage.removeItem("just_logged_in");
          if (navigator.sendBeacon) {
            navigator.sendBeacon("/api/auth/logout");
          } else {
            fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
          }
        }
      };
    } catch (err) {
      console.error("Dashboard security check error:", err);
    }
  }, []);

  return { isRefreshing };
}
