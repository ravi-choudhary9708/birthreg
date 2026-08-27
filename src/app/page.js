import Link from "next/link";

export default function HomePage() {
  const styles = `
    .nav-link:hover { background: #f3f4f6; }
    .hero-btn-primary:hover { background: #1e3a8a !important; }
    .hero-btn-secondary:hover { border-color: #93c5fd !important; background: #eff6ff !important; }
    .step-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  `;
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <style>{styles}</style>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, background: "#1e40af",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "white", fontSize: 18 }}>📋</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Birth Certificate Portal</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Madhubani, Bihar</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/track" className="nav-link" style={{
              padding: "8px 16px", borderRadius: 6, color: "#374151",
              fontSize: 14, fontWeight: 500, transition: "background 0.2s",
            }}>
              Track Application
            </Link>
            <Link href="/login" style={{
              padding: "8px 16px", borderRadius: 6, color: "#6b7280",
              fontSize: 14, fontWeight: 500,
            }}>
              Staff Login
            </Link>
            <Link href="/apply" style={{
              padding: "9px 20px", background: "#1e40af", color: "white",
              borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              transition: "background 0.2s",
            }}>
              Apply Now
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "80px 24px 72px",
        textAlign: "center",
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#dbeafe", borderRadius: 100, padding: "6px 16px", marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, background: "#2563eb", borderRadius: "50%", display: "inline-block" }}></span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1e40af" }}>Government of Bihar — Madhubani District</span>
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
            color: "#111827", lineHeight: 1.15, marginBottom: 20,
          }}>
            Birth Certificate<br />
            <span style={{ color: "#1e40af" }}>Online Portal</span>
          </h1>
          <p style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.7, marginBottom: 40 }}>
            Apply for a birth certificate from the comfort of your home.
            Track your application in real-time and download your certificate
            securely once it's ready.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/apply" className="hero-btn-primary" style={{
              padding: "14px 32px", background: "#1e40af", color: "white",
              borderRadius: 10, fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 14px rgba(30,64,175,0.3)",
              transition: "all 0.2s",
            }}>
              Apply for Certificate →
            </Link>
            <Link href="/track" className="hero-btn-secondary" style={{
              padding: "14px 32px", background: "white", color: "#1e40af",
              border: "1.5px solid #bfdbfe", borderRadius: 10, fontWeight: 600, fontSize: 16,
              transition: "all 0.2s",
            }}>
              Track My Application
            </Link>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section style={{ padding: "72px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 10 }}>How It Works</h2>
          <p style={{ color: "#6b7280", fontSize: 16 }}>Simple 4-step process to get your birth certificate</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {[
            { step: "01", icon: "📝", title: "Fill the Form", desc: "Complete the online application form with the child's and parents' details." },
            { step: "02", icon: "✅", title: "Verification", desc: "The facility verifier reviews and verifies your submitted documents." },
            { step: "03", icon: "🖥️", title: "CSC Processing", desc: "The operator submits your application on the CSC portal for certificate generation." },
            { step: "04", icon: "⬇️", title: "Download Certificate", desc: "Once ready, download your certificate securely using your Application No. & DOB." },
          ].map((item, i) => (
            <div key={i} className="step-card" style={{
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 16,
              padding: "28px 24px", position: "relative", overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 16, right: 20,
                fontSize: 42, fontWeight: 800, color: "#e5e7eb", lineHeight: 1,
              }}>{item.step}</div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Facilities Section */}
      <section style={{ padding: "56px 24px", background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Covered Facilities</h2>
            <p style={{ color: "#6b7280" }}>We serve all hospitals and PHCs across Madhubani District</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              "Sadar Hospital", "PHC Pandaul", "PHC Kaluahi", "PHC Babubarhi",
              "PHC Jhanjharpur", "PHC Khajauli", "PHC Benipatti", "PHC Madhwapur",
              "PHC Madhepur", "CHC Jaynagar", "CHC Phulparas", "CHC Harlakhi",
              "& 12 more facilities...",
            ].map((f, i) => (
              <span key={i} style={{
                padding: "6px 14px", background: "white", border: "1px solid #e5e7eb",
                borderRadius: 100, fontSize: 13, color: "#374151", fontWeight: 500,
              }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Track Banner */}
      <section style={{ padding: "56px 24px" }}>
        <div style={{
          maxWidth: 700, margin: "0 auto", background: "#eff6ff",
          border: "1px solid #bfdbfe", borderRadius: 20, padding: "40px 40px",
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e40af", marginBottom: 10 }}>Already Applied?</h2>
          <p style={{ color: "#374151", marginBottom: 24 }}>Track the real-time status of your application using your Application Number.</p>
          <Link href="/track" style={{
            padding: "12px 28px", background: "#1e40af", color: "white",
            borderRadius: 8, fontWeight: 600, fontSize: 15, boxShadow: "0 2px 8px rgba(30,64,175,0.25)",
          }}>
            Track Application Status →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #e5e7eb", padding: "32px 24px",
        background: "#f9fafb", textAlign: "center",
      }}>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>
          © {new Date().getFullYear()} Birth Certificate Portal — Madhubani, Bihar. All rights reserved.
        </p>
        <p style={{ color: "#d1d5db", fontSize: 12, marginTop: 4 }}>
          A Government of Bihar Initiative
        </p>
      </footer>
    </div>
  );
}
