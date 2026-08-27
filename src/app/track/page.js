"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TrackPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleTrack = (e) => {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your Application Number");
      return;
    }
    router.push(`/track/${trimmed}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}>← Back to Home</Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 500, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{
              width: 72, height: 72, background: "#eff6ff", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <span style={{ fontSize: 32 }}>🔍</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Track Application</h1>
            <p style={{ color: "#6b7280", fontSize: 15 }}>
              Enter your Application Number to check the real-time status of your birth certificate application.
            </p>
          </div>

          <div style={{
            background: "white", border: "1px solid #e5e7eb",
            borderRadius: 16, padding: "32px 28px",
          }}>
            <form onSubmit={handleTrack}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Application Number
              </label>
              <input
                style={{
                  width: "100%", padding: "12px 16px", border: `1.5px solid ${error ? "#fca5a5" : "#e5e7eb"}`,
                  borderRadius: 8, fontSize: 15, color: "#111827", background: "white",
                  letterSpacing: 2, fontWeight: 500, marginBottom: 8,
                }}
                placeholder="e.g. APP-2024-ABC123"
                value={value}
                onChange={e => { setValue(e.target.value); setError(""); }}
              />
              {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</p>}

              <button type="submit" style={{
                width: "100%", padding: "13px", background: "#1e40af",
                color: "white", border: "none", borderRadius: 8, fontWeight: 700,
                fontSize: 15, cursor: "pointer", marginTop: 8,
                boxShadow: "0 2px 8px rgba(30,64,175,0.25)",
              }}>
                Track Application →
              </button>
            </form>

            <div style={{
              marginTop: 24, padding: "14px 16px",
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
            }}>
              <p style={{ fontSize: 12, color: "#92400e" }}>
                <strong>📧 Tip:</strong> Your Application Number was sent to your email and shown on screen after you submitted your application.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Haven't applied yet?{" "}
              <Link href="/apply" style={{ color: "#1e40af", fontWeight: 600 }}>Apply Now →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
