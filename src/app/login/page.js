"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/">
            <div style={{
              width: 56, height: 56, background: "#1e40af",
              borderRadius: 14, display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 14px",
            }}>
              <span style={{ fontSize: 26 }}>📋</span>
            </div>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 6 }}>Staff Login</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Birth Certificate Portal — Madhubani</p>
        </div>

        {/* Form Card */}
        <div style={{
          background: "white", border: "1px solid #e5e7eb",
          borderRadius: 20, padding: "36px 32px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
                style={{
                  width: "100%", padding: "12px 14px",
                  border: "1.5px solid #e5e7eb", borderRadius: 8,
                  fontSize: 14, color: "#111827",
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                style={{
                  width: "100%", padding: "12px 14px",
                  border: "1.5px solid #e5e7eb", borderRadius: 8,
                  fontSize: 14, color: "#111827",
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 8, padding: "12px 14px", marginBottom: 20,
                color: "#dc2626", fontSize: 13,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "#93c5fd" : "#1e40af",
              color: "white", border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 2px 8px rgba(30,64,175,0.2)",
            }}>
              {loading && <span className="spinner" />}
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div style={{
            marginTop: 24, padding: "12px 14px",
            background: "#eff6ff", borderRadius: 8,
            border: "1px solid #bfdbfe",
          }}>
            <p style={{ fontSize: 12, color: "#1e40af" }}>
              🔒 This portal is for authorized staff only (Verifiers and Operators). If you are a parent, please{" "}
              <Link href="/track" style={{ fontWeight: 600 }}>track your application here</Link>.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/" style={{ color: "#9ca3af", fontSize: 13 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
