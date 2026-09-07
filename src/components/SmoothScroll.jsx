"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8,
      prevent: (node) => {
        if (!node) return false;
        const el = node instanceof Element ? node : node.parentElement;
        return Boolean(el?.closest?.("[data-lenis-prevent]"));
      },
    });

    lenisRef.current = lenis;
    if (typeof window !== "undefined") {
      window.__lenis = lenis;
    }

    const updateLenis = (time) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // Automatically synchronize Lenis stop/start with document body/html overflow locks
    const checkBodyLock = () => {
      if (typeof document === "undefined") return;
      const isLocked =
        document.body?.style?.overflow === "hidden" ||
        document.documentElement?.style?.overflow === "hidden";
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    const observer = new MutationObserver(checkBodyLock);
    if (document.body) {
      observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    }
    if (document.documentElement) {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    }

    return () => {
      observer.disconnect();
      lenis.destroy();
      gsap.ticker.remove(updateLenis);
      lenisRef.current = null;
      if (typeof window !== "undefined" && window.__lenis === lenis) {
        window.__lenis = null;
      }
    };
  }, []);

  // Reset scroll to top on route navigation
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return <>{children}</>;
}
