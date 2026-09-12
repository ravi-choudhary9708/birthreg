"use client";

import { useEffect, useState } from "react";

/**
 * Enforces session security by detecting page reloads/refreshes on protected dashboards.
 * When a user reloads the dashboard, their session is invalidated and they are redirected
 * to /logout?reason=refresh.
 */
export function useRefreshSecurity() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      const navEntries =
        typeof performance !== "undefined" && performance.getEntriesByType
          ? performance.getEntriesByType("navigation")
          : [];
      const navType = navEntries[0]?.type;
      const isReload =
        navType === "reload" ||
        (typeof performance !== "undefined" && performance.navigation?.type === 1);

      if (isReload) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsRefreshing(true);
        fetch("/api/auth/logout", { method: "POST" })
          .catch(() => {})
          .finally(() => {
            window.location.replace("/logout?reason=refresh");
          });
      }
    } catch (err) {
      console.error("Refresh security check error:", err);
    }
  }, []);

  return { isRefreshing };
}
