"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FACILITIES } from "@/utils/constants";

function getFacilityMeta(name) {
  const block = name
    .replace(/SUPRITENDENT\s+/i, "")
    .replace(/SUB DIVISIONAL HOSPITAL,?/i, "")
    .replace(/REFERRAL HOSPITAL/i, "")
    .replace(/SADAR HOSPITAL/i, "")
    .replace(/PRIMARY HEALTH CENT(?:RE|ER)/i, "")
    .replace(/PRIMARI HEALTH CENTRE/i, "")
    .replace(/APHC/i, "")
    .replace(/PHC/i, "")
    .replace(/CHC/i, "")
    .replace(/MADHUBANI/i, "")
    .replace(/[,]/g, "")
    .trim();

  const formattedBlock = block
    ? block.charAt(0).toUpperCase() + block.slice(1).toLowerCase()
    : "Madhubani Sadar";

  if (name.includes("SADAR HOSPITAL")) {
    return {
      name,
      categoryKey: "SADAR",
      type: "District Apex Hospital",
      tag: "District Apex",
      badgeColor: "#92400e",
      badgeBg: "#fef3c7",
      badgeBorder: "#fde68a",
      icon: "🏥",
      level: "Apex Civil Hospital",
      block: formattedBlock,
    };
  }

  if (name.includes("SUB DIVISIONAL") || name.includes("REFERRAL")) {
    return {
      name,
      categoryKey: "SDH",
      type: "Sub-Divisional / Referral Hospital",
      tag: "SDH / Referral",
      badgeColor: "#6b21a8",
      badgeBg: "#f3e8ff",
      badgeBorder: "#e9d5ff",
      icon: "🏛️",
      level: "Secondary Referral Hub",
      block: formattedBlock,
    };
  }

  if (name.startsWith("CHC ") || name.includes(" CHC")) {
    return {
      name,
      categoryKey: "CHC",
      type: "Community Health Centre",
      tag: "CHC",
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      icon: "🏨",
      level: "Community Health Hub",
      block: formattedBlock,
    };
  }

  return {
    name,
    categoryKey: "PHC",
    type: name.includes("APHC") ? "Additional Primary Health Centre" : "Primary Health Centre",
    tag: name.includes("APHC") ? "APHC" : "PHC",
    badgeColor: "#1e40af",
    badgeBg: "#eff6ff",
    badgeBorder: "#bfdbfe",
    icon: "🩺",
    level: "Primary Care Registry",
    block: formattedBlock,
  };
}

const FACILITY_METAS = FACILITIES.map(getFacilityMeta);
const MARQUEE_ROW_1 = FACILITY_METAS.slice(0, 20);
const MARQUEE_ROW_2 = FACILITY_METAS.slice(20);

export default function HomePage() {
  const mainRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // GSAP animations within context for automatic cleanup
    const ctx = gsap.context(() => {
      // 1. Header entrance
      gsap.from(".anim-header", {
        y: -18,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      });

      // 2. Hero entrance timeline
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .from(".anim-hero-seal", {
          scale: 0.75,
          opacity: 0,
          duration: 0.75,
          ease: "back.out(1.8)",
        })
        .from(
          ".anim-hero-badge",
          {
            y: 16,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.35"
        )
        .from(
          ".anim-hero-title",
          {
            y: 28,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.3"
        )
        .from(
          ".anim-hero-desc",
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.35"
        )
        .from(
          ".anim-hero-btn",
          {
            y: 16,
            opacity: 0,
            stagger: 0.12,
            duration: 0.5,
            ease: "back.out(1.5)",
          },
          "-=0.25"
        );

      // Subtle float oscillation on the seal
      gsap.to(".anim-hero-seal", {
        y: -6,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // 3. "How It Works" Section ScrollTrigger
      gsap.from(".anim-steps-header", {
        scrollTrigger: {
          trigger: ".anim-steps-header",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        y: 25,
        opacity: 0,
        duration: 0.65,
        ease: "power2.out",
      });

      gsap.from(".anim-step-card", {
        scrollTrigger: {
          trigger: ".anim-steps-grid",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        y: 35,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });

      // Watermark numbers parallax drift
      gsap.utils.toArray(".anim-step-number").forEach((num) => {
        gsap.to(num, {
          scrollTrigger: {
            trigger: num,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
          y: -18,
          ease: "none",
        });
      });

      // 4. "Covered Facilities" Section ScrollTrigger
      if (document.querySelector(".anim-fac-header")) {
        gsap.from(".anim-fac-header", {
          scrollTrigger: {
            trigger: ".anim-fac-header",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          y: 25,
          opacity: 0,
          duration: 0.65,
          ease: "power2.out",
        });
      }

      if (document.querySelector(".anim-fac-stats")) {
        gsap.from(".anim-fac-stat-card", {
          scrollTrigger: {
            trigger: ".anim-fac-stats",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          y: 20,
          opacity: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      // 5. Quick Track Banner ScrollTrigger
      gsap.from(".anim-track-banner", {
        scrollTrigger: {
          trigger: ".anim-track-banner",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        scale: 0.96,
        y: 30,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
      });

      // 6. Footer ScrollTrigger
      gsap.from(".anim-footer", {
        scrollTrigger: {
          trigger: ".anim-footer",
          start: "top 92%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 18,
        duration: 0.7,
        ease: "power2.out",
      });
    }, mainRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const styles = `
    .nav-link:hover { background: #f3f4f6; }
    .hero-btn-primary {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
    }
    .hero-btn-primary:hover {
      background: #1e3a8a !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(30,64,175,0.35) !important;
    }
    .hero-btn-primary:active {
      transform: translateY(0);
    }
    .hero-btn-secondary {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, border-color 0.2s;
    }
    .hero-btn-secondary:hover {
      border-color: #93c5fd !important;
      background: #eff6ff !important;
      transform: translateY(-2px);
    }
    .hero-btn-secondary:active {
      transform: translateY(0);
    }
    .step-card {
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s, border-color 0.25s;
    }
    .step-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(30,64,175,0.08);
      border-color: #bfdbfe;
    }
    .anim-fac-pill {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, border-color 0.2s, color 0.2s;
    }
    .anim-fac-pill:hover {
      transform: translateY(-2px);
      border-color: #93c5fd;
      background: #eff6ff;
      color: #1e40af;
    }

    /* Responsive Navigation */
    .desktop-nav {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 20px;
      line-height: 1;
      color: #374151;
      cursor: pointer;
    }
    .mobile-nav-drawer {
      display: none;
      flex-direction: column;
      gap: 8px;
      padding: 14px 0 16px;
      border-top: 1px solid #e5e7eb;
    }

    @media (max-width: 768px) {
      .desktop-nav {
        display: none !important;
      }
      .mobile-menu-btn {
        display: flex !important;
        align-items: center;
        justify-content: center;
      }
      .mobile-nav-drawer.open {
        display: flex !important;
      }
      .header-subtext {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .hero-cta-group {
        flex-direction: column !important;
        width: 100% !important;
        gap: 12px !important;
      }
      .hero-cta-group a {
        width: 100% !important;
        text-align: center;
      }
      .anim-steps-grid {
        grid-template-columns: 1fr !important;
      }
      .anim-track-banner {
        padding: 32px 20px !important;
      }
    }
  `;

  return (
    <div
      ref={mainRef}
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{styles}</style>

      {/* Header */}
      <header
        className="anim-header"
        style={{
          borderBottom: "1px solid #e5e7eb",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(10px)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Government of Bihar Emblem */}
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
              title="Government of Bihar"
            >
              <img
                src="/bihar_government.webp"
                alt="Government of Bihar Seal"
                style={{
                  height: 42,
                  width: "auto",
                  maxHeight: 42,
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/logo.png";
                }}
              />
            </Link>

            {/* Vertical Divider */}
            <div
              style={{
                width: 1,
                height: 36,
                backgroundColor: "#d1d5db",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />

            {/* Birth Portal Logo & Title */}
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
            >
              <img
                src="/baby_birth.svg"
                alt="Birth Certificate Portal Logo"
                style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#111827",
                    lineHeight: 1.2,
                  }}
                >
                  Birth Certificate Portal
                </div>
                <div
                  className="header-subtext"
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  District Administration Madhubani • Govt. of Bihar
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="desktop-nav">
            <Link
              href="/facilities"
              className="nav-link"
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                color: "#374151",
                fontSize: 14,
                fontWeight: 500,
                transition: "background 0.2s",
              }}
            >
              Facility Directory
            </Link>
            <Link
              href="/track"
              className="nav-link"
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                color: "#374151",
                fontSize: 14,
                fontWeight: 500,
                transition: "background 0.2s",
              }}
            >
              Track Application
            </Link>
            <Link
              href="/login"
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                color: "#6b7280",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Staff Login
            </Link>
            <Link
              href="/apply"
              className="hero-btn-primary"
              style={{
                padding: "9px 20px",
                background: "#1e40af",
                color: "white",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              Apply Now
            </Link>
          </nav>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        <div className={`mobile-nav-drawer ${mobileMenuOpen ? "open" : ""}`}>
          <Link
            href="/facilities"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              color: "#1e40af",
              fontSize: 14,
              fontWeight: 600,
              background: "#eff6ff",
            }}
          >
            🏥 Facility Directory (39 Facilities)
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              background: "#f9fafb",
            }}
          >
            🔍 Track Application
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              color: "#6b7280",
              fontSize: 14,
              fontWeight: 500,
              background: "#f9fafb",
            }}
          >
            🔒 Staff Login
          </Link>
          <Link
            href="/apply"
            onClick={() => setMobileMenuOpen(false)}
            className="hero-btn-primary"
            style={{
              padding: "11px 16px",
              background: "#1e40af",
              color: "white",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Apply Now →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: "clamp(48px, 8vw, 72px) clamp(16px, 4vw, 24px)",
          textAlign: "center",
          background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div
              className="anim-hero-seal"
              style={{
                width: "clamp(80px, 15vw, 96px)",
                height: "clamp(80px, 15vw, 96px)",
                borderRadius: "50%",
                background: "white",
                padding: 6,
                boxShadow: "0 4px 20px rgba(30,64,175,0.12)",
                border: "1px solid #bfdbfe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/baby_birth.svg"
                alt="Official Seal of Madhubani District Birth Portal"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </div>

          <div
            className="anim-hero-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#dbeafe",
              borderRadius: 100,
              padding: "6px 14px",
              marginBottom: 20,
              maxWidth: "100%",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: "#2563eb",
                borderRadius: "50%",
                display: "inline-block",
                flexShrink: 0,
              }}
            ></span>
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "#1e40af", lineHeight: 1.3 }}
            >
              Government of Bihar — Madhubani District Initiative
            </span>
          </div>

          <h1
            className="anim-hero-title"
            style={{
              fontSize: "clamp(28px, 6vw, 52px)",
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.15,
              marginBottom: 18,
            }}
          >
            Birth Certificate
            <br />
            <span style={{ color: "#1e40af" }}>Online Portal</span>
          </h1>

          <p
            className="anim-hero-desc"
            style={{
              fontSize: "clamp(15px, 2.5vw, 18px)",
              color: "#6b7280",
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            Official civil registration initiative by the Government of Bihar
            for Madhubani District. Apply for a birth certificate from hospital
            or home, track progress in real-time, and download your verified
            certificate securely.
          </p>

          <div
            className="hero-cta-group"
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/apply"
              className="hero-btn-primary anim-hero-btn"
              style={{
                padding: "14px 32px",
                background: "#1e40af",
                color: "white",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 16,
                boxShadow: "0 4px 14px rgba(30,64,175,0.3)",
              }}
            >
              Apply for Certificate →
            </Link>
            <Link
              href="/track"
              className="hero-btn-secondary anim-hero-btn"
              style={{
                padding: "14px 32px",
                background: "white",
                color: "#1e40af",
                border: "1.5px solid #bfdbfe",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Track My Application
            </Link>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section
        style={{
          padding: "clamp(48px, 6vw, 72px) clamp(16px, 4vw, 24px)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          className="anim-steps-header"
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <h2
            style={{
              fontSize: "clamp(22px, 4vw, 28px)",
              fontWeight: 700,
              color: "#111827",
              marginBottom: 8,
            }}
          >
            How It Works
          </h2>
          <p style={{ color: "#6b7280", fontSize: "clamp(14px, 2vw, 16px)" }}>
            Simple 4-step process to get your birth certificate
          </p>
        </div>

        <div
          className="anim-steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              step: "01",
              icon: "📝",
              title: "Fill the Form",
              desc: "Complete the online application form with the child's and parents' details.",
            },
            {
              step: "02",
              icon: "✅",
              title: "Verification",
              desc: "The facility verifier reviews and verifies your submitted documents.",
            },
            {
              step: "03",
              icon: "🖥️",
              title: "CRS Processing",
              desc: "The operator submits your application on the official CRS portal for certificate generation.",
            },
            {
              step: "04",
              icon: "⬇️",
              title: "Download Certificate",
              desc: "Once ready, download your certificate securely using your Application No. & DOB.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="step-card anim-step-card"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "24px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                className="anim-step-number"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 18,
                  fontSize: 38,
                  fontWeight: 800,
                  color: "#e5e7eb",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {item.step}
              </div>
              <div style={{ fontSize: 30, marginBottom: 14 }}>{item.icon}</div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                {item.title}
              </h3>
              <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Facilities Showcase Section */}
      <section
        style={{
          padding: "clamp(48px, 7vw, 72px) clamp(16px, 4vw, 32px)",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div
            className="anim-fac-header"
            style={{ textAlign: "center", marginBottom: 36 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                color: "#1e40af",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#16a34a",
                  boxShadow: "0 0 0 2px #bbf7d0",
                }}
              />
              Civil Registration System (CRS) • Madhubani District
            </div>
            <h2
              style={{
                fontSize: "clamp(24px, 4vw, 34px)",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                marginBottom: 12,
              }}
            >
              Covered Healthcare Facilities
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "clamp(14px, 2vw, 16px)",
                maxWidth: 680,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Official civil birth registration across all 39 authorized government hospitals,
              Sub-Divisional referral units, CHCs, and PHCs in Madhubani District.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div
            className="anim-fac-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 36,
            }}
          >
            <div
              className="anim-fac-stat-card"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "18px 20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🏥
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", lineHeight: 1.1 }}>
                  39
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                  Total Authorized Facilities
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Covering all 21 Blocks</div>
              </div>
            </div>

            <div
              className="anim-fac-stat-card"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "18px 20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                ⭐
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#92400e", lineHeight: 1.1 }}>
                  1
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                  District Apex Hospital
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Sadar Hospital Madhubani</div>
              </div>
            </div>

            <div
              className="anim-fac-stat-card"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "18px 20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#f3e8ff",
                  border: "1px solid #e9d5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🏛️
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#6b21a8", lineHeight: 1.1 }}>
                  4
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                  Sub-Divisional & Referral
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Jaynagar, Jhanjharpur, etc.</div>
              </div>
            </div>

            <div
              className="anim-fac-stat-card"
              style={{
                background: "white",
                borderRadius: 14,
                padding: "18px 20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🏨
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#065f46", lineHeight: 1.1 }}>
                  34
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                  CHCs & PHCs Network
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>12 CHCs + 22 PHCs / APHCs</div>
              </div>
            </div>
          </div>

          {/* Dual Infinite Smooth Floating Marquee */}
          <div
            className="marquee-wrapper marquee-mask"
            style={{
              marginBottom: 40,
              position: "relative",
              overflow: "hidden",
              padding: "8px 0",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Row 1: Drift Left */}
            <div className="marquee-track-left">
              {[...MARQUEE_ROW_1, ...MARQUEE_ROW_1].map((f, i) => (
                <div
                  key={`r1-${i}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    background: "white",
                    borderRadius: 100,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{f.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: f.badgeBg,
                      color: f.badgeColor,
                      border: `1px solid ${f.badgeBorder}`,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {f.tag}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    {f.name}
                  </span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22c55e",
                      flexShrink: 0,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Row 2: Drift Right */}
            <div className="marquee-track-right">
              {[...MARQUEE_ROW_2, ...MARQUEE_ROW_2].map((f, i) => (
                <div
                  key={`r2-${i}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 16px",
                    background: "white",
                    borderRadius: 100,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{f.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: f.badgeBg,
                      color: f.badgeColor,
                      border: `1px solid ${f.badgeBorder}`,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {f.tag}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    {f.name}
                  </span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22c55e",
                      flexShrink: 0,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Facility Directory Showcase Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: 20,
              padding: "clamp(24px, 4vw, 36px)",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
                marginBottom: 24,
              }}
            >
              <div style={{ maxWidth: 640 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 99,
                    background: "#eff6ff",
                    color: "#1e40af",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 12,
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <span>🏥</span>
                  <span>Comprehensive Coverage Across All 21 Blocks</span>
                </div>
                <h3
                  style={{
                    fontSize: "clamp(20px, 3vw, 26px)",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.01em",
                    marginBottom: 10,
                  }}
                >
                  Explore Madhubani Healthcare Directory
                </h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                  Looking for your local PHC, CHC, or Sub-Divisional Hospital? Visit our dedicated, searchable
                  directory with all 39 facilities, their blocks, jurisdiction tiers, and direct 1-click registration links.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 260 }}>
                <Link
                  href="/facilities"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 24px",
                    background: "#1e40af",
                    color: "white",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(30,64,175,0.25)",
                    textAlign: "center",
                  }}
                >
                  <span>Browse All 39 Facilities Directory</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/apply"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "11px 20px",
                    background: "#ffffff",
                    color: "#334155",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  <span>Direct Online Application Form</span>
                </Link>
              </div>
            </div>

            {/* Quick Badges Preview */}
            <div
              style={{
                paddingTop: 18,
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              <span style={{ fontWeight: 600, color: "#334155" }}>Key Hubs:</span>
              <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>Sadar Hospital Madhubani</span>
              <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>SDH Jaynagar</span>
              <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>SDH Jhanjharpur</span>
              <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>SDH Phulparas</span>
              <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>Referral Andhrathari</span>
              <span style={{ color: "#94a3b8" }}>+ 34 CHCs & PHCs across all blocks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Track Banner */}
      <section style={{ padding: "clamp(40px, 6vw, 56px) clamp(16px, 4vw, 24px)" }}>
        <div
          className="anim-track-banner"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 20,
            padding: "clamp(28px, 5vw, 40px) clamp(20px, 5vw, 36px)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(20px, 4vw, 24px)",
              fontWeight: 700,
              color: "#1e40af",
              marginBottom: 10,
            }}
          >
            Already Applied?
          </h2>
          <p style={{ color: "#374151", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Track the real-time status of your application using your Application
            Number.
          </p>
          <Link
            href="/track"
            className="hero-btn-primary"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "#1e40af",
              color: "white",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              boxShadow: "0 2px 8px rgba(30,64,175,0.25)",
            }}
          >
            Track Application Status →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="anim-footer"
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "36px 16px 28px",
          background: "#f9fafb",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <img
            src="/baby_birth.svg"
            alt="Govt. of Bihar Logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <span
            style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}
          >
            Government of Bihar • District Administration Madhubani
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", margin: "14px 0 12px", fontSize: 13 }}>
          <Link href="/" style={{ color: "#4b5563", textDecoration: "none", fontWeight: 500 }}>Home</Link>
          <span style={{ color: "#d1d5db" }}>•</span>
          <Link href="/facilities" style={{ color: "#1e40af", textDecoration: "none", fontWeight: 600 }}>Facility Directory</Link>
          <span style={{ color: "#d1d5db" }}>•</span>
          <Link href="/track" style={{ color: "#4b5563", textDecoration: "none", fontWeight: 500 }}>Track Application</Link>
          <span style={{ color: "#d1d5db" }}>•</span>
          <Link href="/apply" style={{ color: "#4b5563", textDecoration: "none", fontWeight: 500 }}>Apply Online</Link>
          <span style={{ color: "#d1d5db" }}>•</span>
          <Link href="/login" style={{ color: "#4b5563", textDecoration: "none", fontWeight: 500 }}>Staff Login</Link>
        </div>
        <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.5 }}>
          Official Birth Registration & Certification Portal — Civil Registration
          System (CRS)
        </p>
        <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 6 }}>
          © {new Date().getFullYear()} District Health Society & Civil Surgeon
          Office, Madhubani, Bihar. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
