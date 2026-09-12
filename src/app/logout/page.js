"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, Home, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

function LogoutContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const isRefresh = reason === "refresh";

  // Invalidate any active session cookies immediately
  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  const styles = `
    .logout-primary-btn {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
    }
    .logout-primary-btn:hover {
      background: #1e3a8a !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(30, 64, 175, 0.35) !important;
    }
    .logout-primary-btn:active {
      transform: translateY(0);
    }
    .logout-sec-btn {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, border-color 0.2s;
    }
    .logout-sec-btn:hover {
      background: #f8fafc !important;
      border-color: #cbd5e1 !important;
      transform: translateY(-1px);
    }
    .logout-sec-btn:active {
      transform: translateY(0);
    }
  `;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{styles}</style>

      {/* Official Government Top Navigation Bar */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "10px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
              title="Government of Bihar"
            >
              <img
                src="/bihar_government.webp"
                alt="Government of Bihar Seal"
                style={{
                  height: 38,
                  width: "auto",
                  maxHeight: 38,
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/baby_birth.svg";
                }}
              />
            </Link>

            <div
              style={{
                width: 1,
                height: 32,
                backgroundColor: "#cbd5e1",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />

            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
            >
              <img
                src="/baby_birth.svg"
                alt="Birth Portal Logo"
                style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }}
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

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              href="/"
              style={{ fontSize: 13, color: "#4b5563", textDecoration: "none", fontWeight: 500 }}
            >
              मुख्य पृष्ठ (Home)
            </Link>
            <Link
              href="/track"
              style={{ fontSize: 13, color: "#4b5563", textDecoration: "none", fontWeight: 500 }}
            >
              Track Application
            </Link>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                color: "#1e40af",
                textDecoration: "none",
                fontWeight: 600,
                padding: "4px 10px",
                background: "#eff6ff",
                borderRadius: 6,
                border: "1px solid #bfdbfe",
              }}
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 40px) 16px",
        }}
      >
        <div style={{ maxWidth: 460, width: "100%" }}>
          {/* Header Seal & Titles */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Link href="/">
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/baby_birth.svg"
                  alt="Government of Bihar Emblem"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
            </Link>

            {/* Pill Badge */}
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: isRefresh ? "#fffbeb" : "#dbeafe",
                border: `1px solid ${isRefresh ? "#fde68a" : "#bfdbfe"}`,
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                color: isRefresh ? "#92400e" : "#1e40af",
                marginBottom: 10,
              }}
            >
              {isRefresh
                ? "सुरक्षा नीति • Security Policy Enforcement"
                : "सत्र समाप्त • Session Terminated"}
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#111827",
                margin: "0 0 6px",
              }}
            >
              {isRefresh ? "सत्र समाप्त (Session Logged Out)" : "लॉग आउट सफल (Logged Out)"}
            </h1>
            <p style={{ color: "#6b7280", fontSize: 13.5, margin: 0 }}>
              Civil Registration System (CRS) • Verifier & Operator Portal
            </p>
          </div>

          {/* White Card */}
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: "clamp(24px, 6vw, 32px) clamp(18px, 5vw, 28px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Notice Callout Box */}
            {isRefresh ? (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1.5px solid #fde68a",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  display: "flex",
                  gap: 12,
                }}
              >
                <AlertTriangle size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ display: "block", fontSize: 13.5, color: "#92400e", marginBottom: 4 }}>
                    पृष्ठ रीफ़्रेश करने के कारण सत्र समाप्त हो गया है
                  </strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#78350f", lineHeight: 1.55 }}>
                    सुरक्षा मानकों के अनुसार, संवेदनशील डेटा की सुरक्षा तथा अनधिकृत पहुंच रोकने हेतु पृष्ठ को रीफ़्रेश करने पर आपका लॉगिन सत्र स्वतः समाप्त कर दिया गया है।
                  </p>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #bbf7d0",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  display: "flex",
                  gap: 12,
                }}
              >
                <CheckCircle2 size={20} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ display: "block", fontSize: 13.5, color: "#166534", marginBottom: 4 }}>
                    आप सफलतापूर्वक लॉग आउट हो चुके हैं
                  </strong>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#15803d", lineHeight: 1.55 }}>
                    जन्म निबंधन प्रणाली (CRS) से आपका लॉगिन सत्र सुरक्षित रूप से समाप्त कर दिया गया है।
                  </p>
                </div>
              </div>
            )}

            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 18px", fontWeight: 500 }}>
              कृपया पोर्टल पर कार्य जारी रखने के लिए नीचे दिए गए विकल्पों में से चुनें:
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/login"
                className="logout-primary-btn"
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#1e40af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(30, 64, 175, 0.2)",
                  boxSizing: "border-box",
                }}
              >
                <KeyRound size={17} /> पुनः लॉगिन करें (Log In Again) <ArrowRight size={16} />
              </Link>

              <Link
                href="/"
                className="logout-sec-btn"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "white",
                  border: "1.5px solid #e5e7eb",
                  color: "#374151",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                <Home size={17} /> मुख्य पृष्ठ पर जाएँ (Go to Home)
              </Link>
            </div>

            {/* Advisory Note */}
            <div
              style={{
                marginTop: 20,
                padding: "12px 14px",
                background: "#eff6ff",
                borderRadius: 8,
                border: "1px solid #bfdbfe",
              }}
            >
              <p style={{ fontSize: 12, color: "#1e40af", margin: 0, lineHeight: 1.5 }}>
                🔒 <strong>सुरक्षा सुझाव:</strong> सार्वजनिक अथवा साझा कंप्यूटर पर कार्य समाप्त होने के उपरांत ब्राउज़र विंडो अवश्य बंद करें। यदि आप आवेदक हैं, तो कृपया{" "}
                <Link href="/track" style={{ fontWeight: 600, textDecoration: "underline", color: "#1d4ed8" }}>
                  यहाँ आवेदन ट्रैक करें
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Back link */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href="/" style={{ color: "#9ca3af", fontSize: 13, textDecoration: "none" }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          background: "white",
          padding: "14px 16px",
          textAlign: "center",
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        Civil Registration System (CRS) • District Administration Madhubani • Govt. of Bihar
      </footer>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
            color: "#111827",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              border: "3px solid #e5e7eb",
              borderTopColor: "#1e40af",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: 12,
            }}
          />
          <span style={{ fontSize: 13, color: "#6b7280" }}>लॉग आउट हो रहा है... (Processing...)</span>
        </div>
      }
    >
      <LogoutContent />
    </Suspense>
  );
}
