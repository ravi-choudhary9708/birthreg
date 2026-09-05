"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".anim-login-seal", {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
      })
        .from(".anim-login-badge", {
          y: 12,
          opacity: 0,
          duration: 0.4,
        }, "-=0.25")
        .from(".anim-login-heading", {
          y: 18,
          opacity: 0,
          duration: 0.5,
        }, "-=0.25")
        .from(".anim-login-card", {
          y: 25,
          scale: 0.97,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        }, "-=0.2")
        .from(".anim-login-input", {
          y: 12,
          opacity: 0,
          stagger: 0.08,
          duration: 0.4,
        }, "-=0.3")
        .from(".anim-login-btn", {
          y: 10,
          opacity: 0,
          duration: 0.4,
          ease: "back.out(1.4)",
        }, "-=0.2");

      gsap.to(".anim-login-seal", {
        y: -4,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      // Redirect based on role
      router.push(`/dashboard/${data.data.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = `
    .login-btn {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
    }
    .login-btn:hover:not(:disabled) {
      background: #1e3a8a !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(30,64,175,0.35) !important;
    }
    .login-btn:active:not(:disabled) {
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
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(20px, 5vw, 36px) 16px",
      }}
    >
      <style>{styles}</style>
      <div style={{ maxWidth: 420, width: "100%" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/">
            <div
              className="anim-login-seal"
              style={{
                width: 76,
                height: 76,
                margin: "0 auto 14px",
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
          </Link>
          <div
            className="anim-login-badge"
            style={{
              display: "inline-block",
              padding: "4px 12px",
              background: "#dbeafe",
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              color: "#1e40af",
              marginBottom: 10,
            }}
          >
            Government of Bihar • Madhubani District
          </div>
          <div className="anim-login-heading">
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Official Staff Portal
            </h1>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Civil Registration System (CRS) • Verifier & Operator Login
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div
          className="anim-login-card"
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: "clamp(24px, 6vw, 36px) clamp(18px, 5vw, 32px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="anim-login-input" style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#111827",
                }}
              />
            </div>
            <div className="anim-login-input" style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#111827",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 20,
                  color: "#dc2626",
                  fontSize: 13,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-btn anim-login-btn"
              style={{
                width: "100%",
                padding: "13px",
                background: loading ? "#93c5fd" : "#1e40af",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 2px 8px rgba(30,64,175,0.2)",
              }}
            >
              {loading && <span className="spinner" />}
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              padding: "12px 14px",
              background: "#eff6ff",
              borderRadius: 8,
              border: "1px solid #bfdbfe",
            }}
          >
            <p style={{ fontSize: 12, color: "#1e40af" }}>
              🔒 This portal is for authorized staff only (Verifiers and
              Operators). If you are a parent, please{" "}
              <Link href="/track" style={{ fontWeight: 600 }}>
                track your application here
              </Link>
              .
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/" style={{ color: "#9ca3af", fontSize: 13 }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
