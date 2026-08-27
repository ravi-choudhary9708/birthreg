"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_CONFIG } from "@/utils/constants";

const STEPS = [
  { key: "submitted", label: "Application Submitted" },
  { key: "verified", label: "Verified by Facility" },
  { key: "csc", label: "Applied on CSC Portal" },
  { key: "completed", label: "Certificate Ready" },
];

function getStepStatus(appStatus) {
  const map = {
    PENDING_VERIFIER: 0,
    REJECTED_BY_VERIFIER: -1,
    PENDING_OPERATOR: 1,
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

  const handleDownload = async (e) => {
    e.preventDefault();
    setDownloadLoading(true);
    setDownloadError("");
    try {
      const res = await fetch("/api/applications/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationNumber: trackingNumber, dateOfBirth: dob }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      let fileUrl = json.data.certificateUrl;
      if (!fileUrl) {
          throw new Error("Certificate file is missing or corrupted. Please contact support.");
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: "#bfdbfe", borderTopColor: "#1e40af", margin: "0 auto 16px" }} />
          <p style={{ color: "#6b7280" }}>Fetching application details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Application Not Found</h2>
          <p style={{ color: "#6b7280", marginBottom: 28 }}>{error}</p>
          <Link href="/track" style={{
            padding: "12px 24px", background: "#1e40af", color: "white",
            borderRadius: 8, fontWeight: 600, fontSize: 14,
          }}>Try Again</Link>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[data.status];
  const stepIndex = getStepStatus(data.status);
  const isRejected = data.status === "REJECTED_BY_VERIFIER" || data.status === "REJECTED_BY_OPERATOR";
  const isCompleted = data.status === "COMPLETED";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/track" style={{ color: "#6b7280", fontSize: 13, fontWeight: 500 }}>← Track Another</Link>
          <Link href="/" style={{ color: "#6b7280", fontSize: 13 }}>Home</Link>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        {/* Application Header */}
        <div style={{
          background: "white", border: "1px solid #e5e7eb",
          borderRadius: 16, padding: "28px 28px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>APPLICATION NUMBER</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#1e40af", letterSpacing: 2 }}>{data.applicationNumber}</p>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                👶 {data.childName} &nbsp;|&nbsp; 🏥 {data.facility}
              </p>
            </div>
            <div style={{
              padding: "8px 16px", borderRadius: 100,
              background: config.bg, border: `1px solid ${config.border}`,
              color: config.color, fontWeight: 600, fontSize: 13,
            }}>
              {config.label}
            </div>
          </div>
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: config.bg, border: `1px solid ${config.border}`,
            borderRadius: 10,
          }}>
            <p style={{ fontSize: 14, color: config.color }}>{config.description}</p>
          </div>
        </div>

        {/* Timeline */}
        {!isRejected && (
          <div style={{
            background: "white", border: "1px solid #e5e7eb",
            borderRadius: 16, padding: "28px 28px", marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 24 }}>Application Progress</h3>
            <div style={{ position: "relative" }}>
              {STEPS.map((step, i) => {
                const isDone = stepIndex >= i;
                const isCurrent = stepIndex === i;
                return (
                  <div key={step.key} style={{ display: "flex", gap: 16, marginBottom: i < STEPS.length - 1 ? 0 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: isDone ? "#1e40af" : "#f3f4f6",
                        border: isCurrent ? "2px solid #1e40af" : "2px solid transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isDone ? "white" : "#9ca3af",
                        fontWeight: 700, fontSize: 14, flexShrink: 0,
                        boxShadow: isCurrent ? "0 0 0 4px #dbeafe" : "none",
                        transition: "all 0.3s",
                      }}>
                        {isDone ? "✓" : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{
                          width: 2, height: 40,
                          background: stepIndex > i ? "#1e40af" : "#e5e7eb",
                          margin: "4px 0", transition: "background 0.3s",
                        }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < STEPS.length - 1 ? 28 : 0, paddingTop: 8 }}>
                      <p style={{
                        fontSize: 14, fontWeight: isCurrent ? 700 : 500,
                        color: isDone ? "#111827" : "#9ca3af",
                      }}>{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rejected Banner */}
        {isRejected && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 16, padding: "24px 28px", marginBottom: 20,
          }}>
            <p style={{ fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>❌ Application Rejected</p>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Please check your email for the reason. You may need to re-apply or contact the facility directly.</p>
          </div>
        )}

        {/* Download Section */}
        {isCompleted && (
          <div style={{
            background: "white", border: "1.5px solid #bbf7d0",
            borderRadius: 16, padding: "28px 28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>🎉</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#15803d", marginBottom: 2 }}>Certificate is Ready!</h3>
                <p style={{ fontSize: 13, color: "#6b7280" }}>Enter the child's Date of Birth to unlock your certificate.</p>
              </div>
            </div>

            {downloadUrl ? (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: "#16a34a", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>✅ Download Started!</p>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>If the file did not download automatically, you can download it manually below:</p>
                <a href={downloadUrl} target="_blank" rel="noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", background: "#f3f4f6", color: "#374151",
                  borderRadius: 8, fontWeight: 600, fontSize: 13, border: "1px solid #e5e7eb"
                }}>
                  ⬇️ Download Manually
                </a>
              </div>
            ) : (
              <form onSubmit={handleDownload}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Child's Date of Birth <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input
                    type="date" required value={dob}
                    onChange={e => { setDob(e.target.value); setDownloadError(""); }}
                    style={{
                      flex: 1, minWidth: 180, padding: "10px 14px",
                      border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14,
                    }}
                  />
                  <button type="submit" disabled={downloadLoading} style={{
                    padding: "10px 22px", background: "#16a34a", color: "white",
                    border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
                    cursor: downloadLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {downloadLoading && <span className="spinner" style={{ width: 16, height: 16 }} />}
                    {downloadLoading ? "Verifying..." : "Verify & Download"}
                  </button>
                </div>
                {downloadError && (
                  <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>⚠️ {downloadError}</p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Dates */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <p style={{ color: "#d1d5db", fontSize: 12 }}>
            Submitted: {new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            &nbsp; | &nbsp;
            Last Updated: {new Date(data.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
