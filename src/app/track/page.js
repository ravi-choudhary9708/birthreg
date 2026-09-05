"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function TrackPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".anim-track-header", {
        y: -15,
        opacity: 0,
        duration: 0.6,
      })
        .from(
          ".anim-track-seal",
          {
            scale: 0.8,
            opacity: 0,
            duration: 0.65,
            ease: "back.out(1.7)",
          },
          "-=0.2"
        )
        .from(
          ".anim-track-badge",
          {
            y: 12,
            opacity: 0,
            duration: 0.45,
          },
          "-=0.3"
        )
        .from(
          ".anim-track-title",
          {
            y: 18,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.3"
        )
        .from(
          ".anim-track-card",
          {
            y: 25,
            scale: 0.97,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.25"
        )
        .from(
          ".anim-track-cta",
          {
            y: 12,
            opacity: 0,
            duration: 0.4,
            ease: "back.out(1.4)",
          },
          "-=0.2"
        );

      gsap.to(".anim-track-seal", {
        y: -4,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your Application Number");
      return;
    }
    router.push(`/track/${trimmed}`);
  };

  const styles = `
    .track-btn {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
    }
    .track-btn:hover {
      background: #1e3a8a !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(30,64,175,0.35) !important;
    }
    .track-btn:active {
      transform: translateY(0);
    }
  `;

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{styles}</style>

      {/* Header */}
      <div
        className="anim-track-header"
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center" }}>
              <img
                src="/baby_birth.svg"
                alt="Govt of Bihar Logo"
                style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
              />
            </Link>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                Birth Certificate Portal
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                District Administration Madhubani • Govt. of Bihar
              </div>
            </div>
          </div>
          <Link
            href="/"
            style={{ color: "#6b7280", fontSize: 13, fontWeight: 500, padding: "4px 0" }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 40px) 16px",
        }}
      >
        <div style={{ maxWidth: 500, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div
              className="anim-track-seal"
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/baby_birth.svg"
                alt="Government of Bihar - Madhubani District Emblem"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div
              className="anim-track-badge"
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "#dbeafe",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                color: "#1e40af",
                marginBottom: 12,
              }}
            >
              Government of Bihar • Madhubani
            </div>
            <div className="anim-track-title">
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Track Application Status
              </h1>
              <p style={{ color: "#6b7280", fontSize: 14 }}>
                Enter your official Application Number to check the real-time
                processing status of your birth certificate.
              </p>
            </div>
          </div>

          <div
            className="anim-track-card"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: "clamp(22px, 5vw, 32px) clamp(16px, 4vw, 28px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}
          >
            <form onSubmit={handleTrack}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Application Number
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1.5px solid ${error ? "#fca5a5" : "#e5e7eb"}`,
                  borderRadius: 8,
                  fontSize: 15,
                  color: "#111827",
                  background: "white",
                  letterSpacing: "clamp(1px, 0.4vw, 2px)",
                  fontWeight: 500,
                  marginBottom: 8,
                  minHeight: 44,
                }}
                placeholder="e.g. APP-2024-ABC123"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
              />
              {error && (
                <p
                  style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}
                >
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                className="track-btn anim-track-cta"
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#1e40af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  marginTop: 8,
                  boxShadow: "0 2px 8px rgba(30,64,175,0.25)",
                }}
              >
                Track Application →
              </button>
            </form>

            <div
              style={{
                marginTop: 24,
                padding: "14px 16px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 12, color: "#92400e" }}>
                <strong>📧 Tip:</strong> Your Application Number was sent to
                your email and shown on screen after you submitted your
                application.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Haven&apos;t applied yet?{" "}
              <Link
                href="/apply"
                style={{ color: "#1e40af", fontWeight: 600 }}
              >
                Apply Now →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
