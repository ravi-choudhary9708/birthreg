"use client";
import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { STATUS_CONFIG } from "@/utils/constants";
import gsap from "gsap";

const STEPS = [
  { key: "submitted", label: "Application Submitted" },
  { key: "verified", label: "Verified by Facility" },
  { key: "crs", label: "Applied on CRS Portal" },
  { key: "completed", label: "Certificate Ready" },
];

function getStepStatus(appStatus) {
  const map = {
    PENDING_VERIFIER: 0,
    REJECTED_BY_VERIFIER: -1,
    PENDING_OPERATOR: 1,
    APPLIED_ON_CRS: 2,
    APPLIED_ON_CSC: 2,
    REJECTED_BY_OPERATOR: -2,
    COMPLETED: 3,
  };
  return map[appStatus] ?? 0;
}

export default function TrackDetailPage({ params }) {
  const { trackingNumber } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  // For secure download
  const [showDownload, setShowDownload] = useState(false);
  const [dob, setDob] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/applications/${trackingNumber}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [trackingNumber]);

  // GSAP animation when data is loaded
  useEffect(() => {
    if (!loading && data && containerRef.current) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".anim-detail-header", {
          y: -15,
          opacity: 0,
          duration: 0.5,
        })
          .from(".anim-app-card", {
            y: 20,
            scale: 0.98,
            opacity: 0,
            duration: 0.6,
          }, "-=0.2")
          .from(".anim-timeline-card", {
            y: 20,
            opacity: 0,
            duration: 0.5,
          }, "-=0.3")
          .from(".anim-step-row", {
            x: -10,
            opacity: 0,
            stagger: 0.1,
            duration: 0.4,
          }, "-=0.2");

        if (containerRef.current.querySelector(".anim-download-card")) {
          tl.from(".anim-download-card", {
            scale: 0.96,
            opacity: 0,
            duration: 0.5,
            ease: "back.out(1.4)",
          }, "-=0.2");
        }
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading, data]);

  const handleDownload = async (e) => {
    e.preventDefault();
    setDownloadLoading(true);
    setDownloadError("");
    try {
      const res = await fetch("/api/applications/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationNumber: trackingNumber,
          dateOfBirth: dob,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      let fileUrl = json.data.certificateUrl;
      if (!fileUrl) {
        throw new Error(
          "Certificate file is missing or corrupted. Please contact support."
        );
      }

      setDownloadUrl(fileUrl);

      // Trick for Cloudinary to force auto-download instead of opening in browser tab
      if (fileUrl.includes("upload/") && !fileUrl.includes("fl_attachment")) {
        fileUrl = fileUrl.replace("upload/", "upload/fl_attachment/");
      }

      // Auto-trigger download
      const link = document.createElement("a");
      link.href = fileUrl;

      // Extract file extension to prevent "corrupted file" errors in Windows/Mac
      let extension = "pdf"; // fallback
      try {
        const parts = fileUrl.split(".");
        if (parts.length > 1) {
          extension = parts.pop();
        }
      } catch (e) {}

      link.download = `Certificate_${trackingNumber}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="spinner"
            style={{
              width: 40,
              height: 40,
              borderWidth: 3,
              borderColor: "#bfdbfe",
              borderTopColor: "#1e40af",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280" }}>Fetching application details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 10,
            }}
          >
            Application Not Found
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 28 }}>{error}</p>
          <Link
            href="/track"
            style={{
              padding: "12px 24px",
              background: "#1e40af",
              color: "white",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[data.status];
  const stepIndex = getStepStatus(data.status);
  const isRejected =
    data.status === "REJECTED_BY_VERIFIER" ||
    data.status === "REJECTED_BY_OPERATOR";
  const isCompleted = data.status === "COMPLETED";

  return (
    <div
      ref={containerRef}
      style={{ minHeight: "100vh", background: "#f9fafb" }}
    >
      {/* Header */}
      <div
        className="anim-detail-header"
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
                  e.currentTarget.src = "/logo.png";
                }}
              />
            </Link>

            <div
              style={{
                width: 1,
                height: 32,
                backgroundColor: "#d1d5db",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />

            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <img
                src="/baby_birth.svg"
                alt="Birth Certificate Portal Logo"
                style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }}
              />
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
            </Link>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <Link
              href="/track"
              style={{ color: "#6b7280", fontSize: 13, fontWeight: 500, padding: "4px 0" }}
            >
              ← Track Another
            </Link>
            <Link href="/" style={{ color: "#6b7280", fontSize: 13, padding: "4px 0" }}>
              Home
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(20px, 4vw, 32px) clamp(14px, 3vw, 24px)" }}>
        {/* Application Header */}
        <div
          id="main-content"
          tabIndex={-1}
          className="anim-app-card"
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "clamp(20px, 4vw, 28px)",
            marginBottom: 20,
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            scrollMarginTop: "90px",
            outline: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <div
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    background: "#dbeafe",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#1e40af",
                  }}
                >
                  Government of Bihar • Madhubani
                </div>
                {data.isVerified ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#16a34a",
                    }}
                  >
                    ✓ 6-Digit Email OTP Verified
                  </div>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#92400e",
                    }}
                  >
                    🔒 OTP Verification Required
                  </div>
                )}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  fontWeight: 600,
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                APPLICATION NUMBER
              </p>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1e40af",
                  letterSpacing: 2,
                }}
              >
                {data.applicationNumber}
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                👶 {data.childName} &nbsp;|&nbsp; 🏥 {data.facility}
              </p>
            </div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 100,
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: config.color,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {config.label}
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: config.bg,
              border: `1px solid ${config.border}`,
              borderRadius: 10,
            }}
          >
            <p style={{ fontSize: 14, color: config.color }}>
              {config.description}
            </p>
          </div>

          {!data.isVerified && (
            <div
              style={{
                marginTop: 16,
                padding: "14px 16px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#92400e" }}>
                  🔒 Identity Verification Required
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#b45309", lineHeight: 1.4 }}>
                  Verify your identity using the 6-digit OTP sent to your linked email address to unlock certificate downloads and full records.
                </p>
              </div>
              <Link
                href={`/track?app=${data.applicationNumber}`}
                style={{
                  padding: "8px 16px",
                  background: "#1e40af",
                  color: "white",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                Verify with Email OTP →
              </Link>
            </div>
          )}
        </div>

        {/* Timeline */}
        {!isRejected && (
          <div
            className="anim-timeline-card"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: "28px 28px",
              marginBottom: 20,
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 24,
              }}
            >
              Application Progress
            </h3>
            <div style={{ position: "relative" }}>
              {STEPS.map((step, i) => {
                const isDone = stepIndex >= i;
                const isCurrent = stepIndex === i;
                return (
                  <div
                    key={step.key}
                    className="anim-step-row"
                    style={{
                      display: "flex",
                      gap: 16,
                      marginBottom: i < STEPS.length - 1 ? 0 : 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isDone ? "#1e40af" : "#f3f4f6",
                          border: isCurrent
                            ? "2px solid #1e40af"
                            : "2px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isDone ? "white" : "#9ca3af",
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0,
                          boxShadow: isCurrent ? "0 0 0 4px #dbeafe" : "none",
                          transition: "all 0.3s",
                        }}
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          style={{
                            width: 2,
                            height: 40,
                            background: stepIndex > i ? "#1e40af" : "#e5e7eb",
                            margin: "4px 0",
                            transition: "background 0.3s",
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        paddingBottom: i < STEPS.length - 1 ? 28 : 0,
                        paddingTop: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: isCurrent ? 700 : 500,
                          color: isDone ? "#111827" : "#9ca3af",
                        }}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rejected Banner */}
        {isRejected && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 16,
              padding: "24px 28px",
              marginBottom: 20,
            }}
          >
            <p style={{ fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>
              ❌ Application Rejected
            </p>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Please check your email for the reason. You may need to re-apply or
              contact the facility directly.
            </p>
          </div>
        )}

        {/* Download Section */}
        {isCompleted && (
          <div
            className="anim-download-card"
            style={{
              background: "white",
              border: "1.5px solid #bbf7d0",
              borderRadius: 16,
              padding: "28px 28px",
              boxShadow: "0 4px 16px rgba(22,163,74,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 28 }}>🎉</span>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#15803d",
                    marginBottom: 2,
                  }}
                >
                  Certificate is Ready!
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280" }}>
                  Enter the child&apos;s Date of Birth to unlock your
                  certificate.
                </p>
              </div>
            </div>

            {downloadUrl ? (
              <div style={{ marginTop: 12 }}>
                <p
                  style={{
                    color: "#16a34a",
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                >
                  ✅ Download Started!
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginBottom: 12,
                  }}
                >
                  If the file did not download automatically, you can download it
                  manually below:
                </p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    background: "#f3f4f6",
                    color: "#374151",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  ⬇️ Download Manually
                </a>
              </div>
            ) : (
              <form onSubmit={handleDownload}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Child&apos;s Date of Birth{" "}
                  <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      setDownloadError("");
                    }}
                    style={{
                      flex: 1,
                      minWidth: 180,
                      padding: "10px 14px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={downloadLoading}
                    style={{
                      padding: "10px 22px",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: downloadLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {downloadLoading && (
                      <span
                        className="spinner"
                        style={{ width: 16, height: 16 }}
                      />
                    )}
                    {downloadLoading ? "Verifying..." : "Verify & Download"}
                  </button>
                </div>
                {downloadError && (
                  <p
                    style={{
                      color: "#dc2626",
                      fontSize: 13,
                      marginTop: 8,
                    }}
                  >
                    ⚠️ {downloadError}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Dates */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <p style={{ color: "#9ca3af", fontSize: 12 }}>
            Submitted:{" "}
            {new Date(data.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            &nbsp; | &nbsp; Last Updated:{" "}
            {new Date(data.updatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
