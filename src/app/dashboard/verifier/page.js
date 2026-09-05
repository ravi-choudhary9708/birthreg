"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Upload,
  Globe,
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  Download,
  Building2,
  Check,
  X,
  FileCheck,
  Send,
} from "lucide-react";

const STATUS_COLORS = {
  PENDING_VERIFIER: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Pending Verification", step: 1 },
  REJECTED_BY_VERIFIER: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Rejected by Facility", step: 1 },
  PENDING_OPERATOR: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Verified • Ready for CRS", step: 2 },
  APPLIED_ON_CRS: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", label: "Applied on CRS", step: 3 },
  APPLIED_ON_CSC: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", label: "Applied on CRS", step: 3 },
  COMPLETED: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Certificate Issued", step: 4 },
  REJECTED_BY_OPERATOR: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Rejected", step: 2 },
};

const COMMON_REJECTION_REASONS = [
  "Hospital birth discharge summary slip missing or illegible",
  "Date of birth does not match hospital institutional register",
  "Mother or father Aadhaar card unverified or mismatched",
  "Duplicate registration found in facility birth log",
  "Delivery occurred outside this health facility jurisdiction",
  "Parent names on ID proof differ from registration details",
];

export default function VerifierDashboard() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL | PENDING_VERIFIER | PENDING_OPERATOR | APPLIED_ON_CRS | COMPLETED | REJECTED_BY_VERIFIER
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showCrsModal, setShowCrsModal] = useState(null);
  const [crsNumber, setCrsNumber] = useState("");
  const [crsRemarks, setCrsRemarks] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [viewingApp, setViewingApp] = useState(null);
  
  const [facility, setFacility] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const containerRef = useRef(null);

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      if (res.status === 401) { router.push("/login"); return; }
      if (!data.success) throw new Error(data.message);
      const list = Array.isArray(data.data) ? data.data : (data.data?.applications || []);
      setApps(list);
      if (data.data?.facility) {
        setFacility(data.data.facility);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // GSAP Animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        if (containerRef.current.querySelector(".anim-ver-header")) {
          gsap.from(".anim-ver-header", {
            y: -15,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
          });
        }
        if (containerRef.current.querySelectorAll(".anim-ver-stat").length > 0) {
          gsap.from(".anim-ver-stat", {
            scale: 0.94,
            opacity: 0,
            y: 12,
            stagger: 0.08,
            duration: 0.45,
            ease: "back.out(1.4)",
          });
        }
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  // Handler: Approve Application
  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setViewingApp(null);
      await fetchApps();
    } catch (err) {
      alert("Verification Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Reject Application with Mandatory Reason
  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      alert("A specific rejection reason is mandatory.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", remarks: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowRejectModal(null);
      setViewingApp(null);
      setRejectionReason("");
      await fetchApps();
    } catch (err) {
      alert("Rejection Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Apply on CRS Portal
  const handleApplyCrs = async (id) => {
    setActionLoading(true);
    try {
      const remarksText = crsNumber.trim()
        ? `CRS Ack #${crsNumber.trim()}${crsRemarks.trim() ? " - " + crsRemarks.trim() : ""}`
        : crsRemarks.trim();
      const res = await fetch(`/api/admin/applications/${id}/operate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_crs", remarks: remarksText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowCrsModal(null);
      setViewingApp(null);
      setCrsNumber("");
      setCrsRemarks("");
      await fetchApps();
    } catch (err) {
      alert("CRS Submission Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Upload Final Certificate
  const handleUploadCertificate = async (id) => {
    if (!uploadFile) {
      alert("Please select a certificate file (PDF, PNG, or JPG)");
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("certificate", uploadFile);

      const res = await fetch(`/api/admin/applications/${id}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowUploadModal(null);
      setViewingApp(null);
      setUploadFile(null);
      await fetchApps();
    } catch (err) {
      alert("Certificate Upload Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Metrics
  const now = useMemo(() => new Date(), []);
  const SLA_DAYS = 7;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const metrics = useMemo(() => {
    let pendingVerifier = 0;
    let overdueVerifier = 0;
    let readyForCrs = 0;
    let appliedCrs = 0;
    let completed = 0;
    let rejected = 0;

    apps.forEach((app) => {
      if (app.status === "PENDING_VERIFIER") {
        pendingVerifier++;
        const age = Math.floor((now.getTime() - new Date(app.createdAt).getTime()) / MS_PER_DAY);
        if (age > SLA_DAYS) overdueVerifier++;
      } else if (app.status === "PENDING_OPERATOR") {
        readyForCrs++;
      } else if (app.status === "APPLIED_ON_CRS" || app.status === "APPLIED_ON_CSC") {
        appliedCrs++;
      } else if (app.status === "COMPLETED") {
        completed++;
      } else if (app.status === "REJECTED_BY_VERIFIER" || app.status === "REJECTED_BY_OPERATOR") {
        rejected++;
      }
    });

    return {
      total: apps.length,
      pendingVerifier,
      overdueVerifier,
      readyForCrs,
      appliedCrs,
      completed,
      rejected,
    };
  }, [apps, now]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Status Filter
      if (activeFilter === "PENDING_VERIFIER" && app.status !== "PENDING_VERIFIER") return false;
      if (activeFilter === "PENDING_OPERATOR" && app.status !== "PENDING_OPERATOR") return false;
      if (activeFilter === "APPLIED_ON_CRS" && (app.status !== "APPLIED_ON_CRS" && app.status !== "APPLIED_ON_CSC")) return false;
      if (activeFilter === "COMPLETED" && app.status !== "COMPLETED") return false;
      if (activeFilter === "REJECTED_BY_VERIFIER" && (app.status !== "REJECTED_BY_VERIFIER" && app.status !== "REJECTED_BY_OPERATOR")) return false;

      // Search Term Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const appNum = (app.applicationNumber || "").toLowerCase();
        const childName = (app.child?.name || "").toLowerCase();
        const parentName = (app.informationProvider?.name || app.parents?.father?.name || "").toLowerCase();
        return appNum.includes(term) || childName.includes(term) || parentName.includes(term);
      }

      return true;
    });
  }, [apps, activeFilter, searchTerm]);

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Top Nav */}
      <div className="anim-ver-header" style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 60, flexWrap: "wrap", gap: 10, padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/baby_birth.svg"
              alt="Government of Bihar Seal"
              style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", lineHeight: 1.2 }}>Verifier Dashboard</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {facility ? (
                  <span style={{ color: "#1e40af", fontWeight: 600 }}>🏥 {facility}</span>
                ) : (
                  "District Administration Madhubani • Govt. of Bihar"
                )}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: "7px 16px", background: "white", border: "1px solid #e5e7eb",
            borderRadius: 7, color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(20px, 3vw, 28px) clamp(14px, 2.5vw, 24px)" }}>
        {/* Header */}
        <div className="anim-ver-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <div style={{ display: "inline-block", padding: "2px 8px", background: "#dbeafe", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#1e40af" }}>
                Government of Bihar • Civil Registration System
              </div>
              {facility && (
                <div style={{ display: "inline-block", padding: "2px 8px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#92400e" }}>
                  🏥 {facility}
                </div>
              )}
            </div>
            <h1 style={{ fontSize: "clamp(19px, 3.5vw, 22px)", fontWeight: 800, color: "#111827", marginBottom: 4 }}>Facility Verification Queue</h1>
            <p style={{ color: "#4b5563", fontSize: 14 }}>
              Review and verify birth certificate applications registered at {facility ? <strong style={{ color: "#1e40af" }}>{facility}</strong> : "your assigned facility"}
            </p>
          </div>
          <button onClick={fetchApps} style={{
            padding: "8px 16px", background: "white", border: "1px solid #e5e7eb",
            borderRadius: 8, color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 24 }}>
          {/* Card 1: Needs Verification */}
          <div
            onClick={() => setActiveFilter("PENDING_VERIFIER")}
            className="anim-ver-stat"
            style={{
              background: activeFilter === "PENDING_VERIFIER" ? "#fef3c7" : "white",
              border: activeFilter === "PENDING_VERIFIER" ? "2px solid #f59e0b" : "1px solid #e2e8f0",
              borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>1. Needs Verification</span>
              <Clock size={16} color="#d97706" />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#d97706", margin: "8px 0 2px" }}>{metrics.pendingVerifier}</p>
            <span style={{ fontSize: 11, color: metrics.overdueVerifier > 0 ? "#dc2626" : "#78350f", fontWeight: 600 }}>
              {metrics.overdueVerifier > 0 ? `🚨 ${metrics.overdueVerifier} Overdue (>7d)` : "All within 7d SLA"}
            </span>
          </div>

          {/* Card 2: Ready for CRS */}
          <div
            onClick={() => setActiveFilter("PENDING_OPERATOR")}
            className="anim-ver-stat"
            style={{
              background: activeFilter === "PENDING_OPERATOR" ? "#eff6ff" : "white",
              border: activeFilter === "PENDING_OPERATOR" ? "2px solid #3b82f6" : "1px solid #e2e8f0",
              borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>2. Ready for CRS</span>
              <Globe size={16} color="#2563eb" />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#2563eb", margin: "8px 0 2px" }}>{metrics.readyForCrs}</p>
            <span style={{ fontSize: 11, color: "#64748b" }}>Verified • Apply on portal</span>
          </div>

          {/* Card 3: Awaiting Certificate */}
          <div
            onClick={() => setActiveFilter("APPLIED_ON_CRS")}
            className="anim-ver-stat"
            style={{
              background: activeFilter === "APPLIED_ON_CRS" ? "#f5f3ff" : "white",
              border: activeFilter === "APPLIED_ON_CRS" ? "2px solid #8b5cf6" : "1px solid #e2e8f0",
              borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9" }}>3. Awaiting Certificate</span>
              <Upload size={16} color="#7c3aed" />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#7c3aed", margin: "8px 0 2px" }}>{metrics.appliedCrs}</p>
            <span style={{ fontSize: 11, color: "#64748b" }}>CRS Done • Upload cert</span>
          </div>

          {/* Card 4: Completed */}
          <div
            onClick={() => setActiveFilter("COMPLETED")}
            className="anim-ver-stat"
            style={{
              background: activeFilter === "COMPLETED" ? "#f0fdf4" : "white",
              border: activeFilter === "COMPLETED" ? "2px solid #22c55e" : "1px solid #e2e8f0",
              borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>4. Completed</span>
              <CheckCircle2 size={16} color="#16a34a" />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", margin: "8px 0 2px" }}>{metrics.completed}</p>
            <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Certificates Issued</span>
          </div>

          {/* Card 5: Rejected */}
          <div
            onClick={() => setActiveFilter("REJECTED_BY_VERIFIER")}
            className="anim-ver-stat"
            style={{
              background: activeFilter === "REJECTED_BY_VERIFIER" ? "#fef2f2" : "white",
              border: activeFilter === "REJECTED_BY_VERIFIER" ? "2px solid #ef4444" : "1px solid #e2e8f0",
              borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c" }}>Rejected</span>
              <ShieldAlert size={16} color="#dc2626" />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#dc2626", margin: "8px 0 2px" }}>{metrics.rejected}</p>
            <span style={{ fontSize: 11, color: "#64748b" }}>With audited reason</span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: `All (${metrics.total})` },
              { id: "PENDING_VERIFIER", label: `Needs Verification (${metrics.pendingVerifier})` },
              { id: "PENDING_OPERATOR", label: `Ready for CRS (${metrics.readyForCrs})` },
              { id: "APPLIED_ON_CRS", label: `Awaiting Cert (${metrics.appliedCrs})` },
              { id: "COMPLETED", label: `Completed (${metrics.completed})` },
              { id: "REJECTED_BY_VERIFIER", label: `Rejected (${metrics.rejected})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700,
                  border: activeFilter === tab.id ? "1px solid #1e40af" : "1px solid #e2e8f0",
                  background: activeFilter === tab.id ? "#1e40af" : "#f8fafc",
                  color: activeFilter === tab.id ? "white" : "#475569",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search app #, child or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "7px 12px 7px 32px", border: "1px solid #cbd5e1", borderRadius: 8,
                fontSize: 13, width: 230, outline: "none",
              }}
            />
          </div>
        </div>

        {/* Applications Master Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: "#bfdbfe", borderTopColor: "#1e40af", margin: "0 auto 12px" }} />
            <p style={{ color: "#6b7280", fontSize: 14 }}>Loading {facility || "hospital"} records...</p>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 24, color: "#dc2626" }}>
            ⚠️ {error}
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
            <FileCheck size={44} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>No Applications Found</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
              {searchTerm ? "No records matched your search query." : `No applications in the selected category for ${facility}.`}
            </p>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Application No.", "Child Particulars", "Parent / Informant", "Statutory 7-Day SLA", "Stage & Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: 0.4 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app, i) => {
                    const sc = STATUS_COLORS[app.status] || { bg: "#f3f4f6", color: "#374151", label: app.status };
                    const ageInDays = Math.max(0, Math.floor((now.getTime() - new Date(app.createdAt).getTime()) / MS_PER_DAY));
                    const isPending = app.status === "PENDING_VERIFIER";
                    const isReadyForCrs = app.status === "PENDING_OPERATOR";
                    const isAppliedCrs = app.status === "APPLIED_ON_CRS" || app.status === "APPLIED_ON_CSC";
                    const isCompleted = app.status === "COMPLETED";
                    const isRejected = app.status === "REJECTED_BY_VERIFIER" || app.status === "REJECTED_BY_OPERATOR";
                    const isOverdue = isPending && ageInDays > SLA_DAYS;

                    return (
                      <tr
                        key={app._id}
                        style={{
                          borderBottom: i < filteredApps.length - 1 ? "1px solid #f1f5f9" : "none",
                          background: isOverdue ? "#fff5f5" : "transparent",
                          transition: "background 0.1s ease",
                        }}>
                        {/* 1. App No */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          <span style={{ fontWeight: 800, color: "#1e40af", fontSize: 13, fontFamily: "monospace" }}>
                            {app.applicationNumber}
                          </span>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                            {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </td>

                        {/* 2. Child */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                            {app.child?.name || "—"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                            {app.child?.gender} • DOB: {app.child?.dateOfBirth ? new Date(app.child.dateOfBirth).toLocaleDateString("en-IN") : "—"}
                          </div>
                        </td>

                        {/* 3. Parent / Informant */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#334151" }}>
                            {app.informationProvider?.name || app.parents?.mother?.name || "—"}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {app.informationProvider?.mobileNumber || "—"}
                          </div>
                        </td>

                        {/* 4. Statutory 7-Day SLA Counter */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          {isPending ? (
                            isOverdue ? (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, fontSize: 11, fontWeight: 800, color: "#dc2626" }}>
                                <AlertTriangle size={13} /> Day {ageInDays} of 7 (OVERDUE)
                              </div>
                            ) : (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#166534" }}>
                                <Clock size={13} /> Day {ageInDays} of 7 ({7 - ageInDays}d left)
                              </div>
                            )
                          ) : (
                            <span style={{ fontSize: 12, color: "#64748b" }}>
                              {isCompleted ? "Issued" : isRejected ? "Rejected" : "Verified"}
                            </span>
                          )}
                        </td>

                        {/* 5. Status Badge */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "4px 10px", borderRadius: 100,
                            background: sc.bg, color: sc.color,
                            border: `1px solid ${sc.border || sc.color}`,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {sc.label}
                          </span>
                          {app.remarks && (
                            <div style={{ fontSize: 11, color: isRejected ? "#dc2626" : "#64748b", marginTop: 3, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {app.remarks}
                            </div>
                          )}
                        </td>

                        {/* 6. Contextual Action Buttons */}
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            {/* View Details always available */}
                            <button
                              onClick={() => setViewingApp(app)}
                              title="View full record"
                              style={{
                                padding: "6px 10px", background: "#f8fafc", color: "#334151",
                                border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                              }}>
                              <Eye size={13} /> View
                            </button>

                            {/* Stage 1: If Pending Verification -> Approve or Reject */}
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApprove(app._id)}
                                  disabled={actionLoading}
                                  title="Verify and Approve"
                                  style={{
                                    padding: "6px 12px", background: "#16a34a", color: "white",
                                    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                                    cursor: actionLoading ? "not-allowed" : "pointer",
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                  }}>
                                  <Check size={13} /> Approve
                                </button>
                                <button
                                  onClick={() => setShowRejectModal(app._id)}
                                  disabled={actionLoading}
                                  title="Reject with mandatory reason"
                                  style={{
                                    padding: "6px 10px", background: "#fef2f2", color: "#dc2626",
                                    border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                    cursor: actionLoading ? "not-allowed" : "pointer",
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                  }}>
                                  <X size={13} /> Reject
                                </button>
                              </>
                            )}

                            {/* Stage 2: If Ready for CRS -> Mark Applied on CRS */}
                            {isReadyForCrs && (
                              <button
                                onClick={() => { setShowCrsModal(app._id); setCrsNumber(""); setCrsRemarks(""); }}
                                style={{
                                  padding: "6px 12px", background: "#2563eb", color: "white",
                                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                <Globe size={13} /> Apply CRS
                              </button>
                            )}

                            {/* Stage 3: If Applied on CRS -> Upload Certificate */}
                            {isAppliedCrs && (
                              <button
                                onClick={() => { setShowUploadModal(app._id); setUploadFile(null); }}
                                style={{
                                  padding: "6px 12px", background: "#7c3aed", color: "white",
                                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                <Upload size={13} /> Upload Cert
                              </button>
                            )}

                            {/* Stage 4: If Completed -> View Certificate */}
                            {isCompleted && app.certificateUrl && (
                              <a
                                href={app.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: "6px 12px", background: "#f0fdf4", color: "#16a34a",
                                  border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, fontWeight: 700,
                                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                <Download size={13} /> Certificate
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW APPLICATION FULL DETAILS & ACTIONS */}
      {/* ========================================================================= */}
      {viewingApp && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "white", borderRadius: 18, width: "100%", maxWidth: 820,
            maxHeight: "92vh", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden",
          }}>
            {/* Modal Header */}
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {viewingApp.applicationNumber}
                  </h3>
                  <span style={{
                    padding: "3px 8px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                    background: STATUS_COLORS[viewingApp.status]?.bg || "#f1f5f9",
                    color: STATUS_COLORS[viewingApp.status]?.color || "#475569",
                  }}>
                    {STATUS_COLORS[viewingApp.status]?.label || viewingApp.status}
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0" }}>
                  Registered at {viewingApp.facility} • {new Date(viewingApp.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setViewingApp(null)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b" }}>
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {/* Rejection / Note banner if present */}
              {viewingApp.remarks && (
                <div style={{
                  padding: "12px 16px", borderRadius: 10, marginBottom: 18,
                  background: viewingApp.status.includes("REJECT") ? "#fef2f2" : "#f0fdf4",
                  border: viewingApp.status.includes("REJECT") ? "1px solid #fecaca" : "1px solid #bbf7d0",
                }}>
                  <strong style={{ fontSize: 13, color: viewingApp.status.includes("REJECT") ? "#991b1b" : "#166534" }}>
                    {viewingApp.status.includes("REJECT") ? "🚨 Rejection Reason / Auditor Remarks:" : "📝 Verification / CRS Note:"}
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: viewingApp.status.includes("REJECT") ? "#b91c1c" : "#15803d" }}>
                    {viewingApp.remarks}
                  </p>
                </div>
              )}

              {/* Child Details */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", margin: "0 0 10px", paddingBottom: 4, borderBottom: "1.5px solid #dbeafe" }}>
                  1. Child Information (जन्म सम्बन्धी विवरण)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, fontSize: 13 }}>
                  <div><span style={{ color: "#64748b" }}>Name:</span> <strong style={{ display: "block" }}>{viewingApp.child?.name || "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Gender:</span> <strong style={{ display: "block" }}>{viewingApp.child?.gender || "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Date of Birth:</span> <strong style={{ display: "block" }}>{viewingApp.child?.dateOfBirth ? new Date(viewingApp.child.dateOfBirth).toLocaleDateString("en-IN") : "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Birth Weight:</span> <strong style={{ display: "block" }}>{viewingApp.child?.weight ? `${viewingApp.child.weight} kg` : "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Place of Birth:</span> <strong style={{ display: "block" }}>{viewingApp.child?.placeOfBirth || "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Delivery Attention:</span> <strong style={{ display: "block" }}>{viewingApp.child?.deliveryAttention || "—"}</strong></div>
                </div>
              </div>

              {/* Parents Details */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", margin: "0 0 10px", paddingBottom: 4, borderBottom: "1.5px solid #dbeafe" }}>
                  2. Parents Information (माता एवं पिता का विवरण)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <p style={{ fontWeight: 800, color: "#1e293b", margin: "0 0 6px", fontSize: 13 }}>Mother (माता)</p>
                    <div style={{ fontSize: 12, color: "#334151", lineHeight: 1.6 }}>
                      <div><strong>Name:</strong> {viewingApp.parents?.mother?.name || "—"}</div>
                      <div><strong>Aadhaar:</strong> {viewingApp.parents?.mother?.adharNumber || "—"}</div>
                      <div><strong>Mobile:</strong> {viewingApp.parents?.mother?.mobileNumber || "—"}</div>
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <p style={{ fontWeight: 800, color: "#1e293b", margin: "0 0 6px", fontSize: 13 }}>Father (पिता)</p>
                    <div style={{ fontSize: 12, color: "#334151", lineHeight: 1.6 }}>
                      <div><strong>Name:</strong> {viewingApp.parents?.father?.name || "—"}</div>
                      <div><strong>Aadhaar:</strong> {viewingApp.parents?.father?.adharNumber || "—"}</div>
                      <div><strong>Mobile:</strong> {viewingApp.parents?.father?.mobileNumber || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informant Details */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1e40af", margin: "0 0 10px", paddingBottom: 4, borderBottom: "1.5px solid #dbeafe" }}>
                  3. Information Provider (सूचनादाता)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, fontSize: 13 }}>
                  <div><span style={{ color: "#64748b" }}>Provider Name:</span> <strong style={{ display: "block" }}>{viewingApp.informationProvider?.name || "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Relation:</span> <strong style={{ display: "block" }}>{viewingApp.informationProvider?.relationToChild || "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Contact Phone:</span> <strong style={{ display: "block" }}>{viewingApp.informationProvider?.mobileNumber || "—"}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Email:</span> <strong style={{ display: "block" }}>{viewingApp.informationProvider?.email || "—"}</strong></div>
                </div>
              </div>

              {/* Issued Certificate Link */}
              {viewingApp.certificateUrl && (
                <div style={{ padding: "14px 18px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#166534", fontSize: 13 }}>Birth Certificate Ready</strong>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#15803d" }}>Official digitally signed certificate issued for this registration.</p>
                  </div>
                  <a
                    href={viewingApp.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 16px", background: "#16a34a", color: "white",
                      borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}>
                    <Download size={15} /> Download
                  </a>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <button
                onClick={() => setViewingApp(null)}
                style={{
                  padding: "8px 16px", background: "white", border: "1px solid #cbd5e1",
                  borderRadius: 8, color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                Close
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                {viewingApp.status === "PENDING_VERIFIER" && (
                  <>
                    <button
                      onClick={() => { setShowRejectModal(viewingApp._id); }}
                      style={{
                        padding: "8px 16px", background: "#fef2f2", color: "#dc2626",
                        border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 700,
                        cursor: "pointer",
                      }}>
                      ✕ Reject Application
                    </button>
                    <button
                      onClick={() => handleApprove(viewingApp._id)}
                      disabled={actionLoading}
                      style={{
                        padding: "8px 20px", background: "#16a34a", color: "white",
                        border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                      }}>
                      ✓ Verify & Approve
                    </button>
                  </>
                )}

                {viewingApp.status === "PENDING_OPERATOR" && (
                  <button
                    onClick={() => { setShowCrsModal(viewingApp._id); }}
                    style={{
                      padding: "8px 20px", background: "#2563eb", color: "white",
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}>
                    <Globe size={15} /> Apply on CRS Portal
                  </button>
                )}

                {(viewingApp.status === "APPLIED_ON_CRS" || viewingApp.status === "APPLIED_ON_CSC") && (
                  <button
                    onClick={() => { setShowUploadModal(viewingApp._id); }}
                    style={{
                      padding: "8px 20px", background: "#7c3aed", color: "white",
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}>
                    <Upload size={15} /> Upload Certificate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT APPLICATION WITH MANDATORY REASON */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "white", borderRadius: 18, padding: "24px 28px",
            maxWidth: 520, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <ShieldAlert size={24} color="#dc2626" />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>
                Reject Birth Registration
              </h3>
            </div>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px" }}>
              Under Bihar Civil Registration rules, every rejection must state a clear, audited statutory reason. This will be recorded and emailed to the parent.
            </p>

            {/* Quick Reason Chips */}
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Select Quick Reason:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {COMMON_REJECTION_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    onClick={() => setRejectionReason(reason)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, textAlign: "left",
                      border: rejectionReason === reason ? "1px solid #dc2626" : "1px solid #e2e8f0",
                      background: rejectionReason === reason ? "#fef2f2" : "#f8fafc",
                      color: rejectionReason === reason ? "#b91c1c" : "#475569",
                      cursor: "pointer",
                    }}>
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Or type custom rejection reason in detail..."
              style={{
                width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1",
                borderRadius: 8, fontSize: 13, outline: "none", color: "#0f172a",
                boxSizing: "border-box", resize: "vertical",
              }}
            />

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setShowRejectModal(null); setRejectionReason(""); }}
                style={{
                  padding: "9px 18px", background: "white", border: "1px solid #cbd5e1",
                  borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
                }}>
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectionReason.trim() || actionLoading}
                style={{
                  padding: "9px 20px", background: rejectionReason.trim() ? "#dc2626" : "#fca5a5",
                  border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700,
                  cursor: rejectionReason.trim() ? "pointer" : "not-allowed",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                {actionLoading ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: APPLY ON CRS PORTAL */}
      {/* ========================================================================= */}
      {showCrsModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "white", borderRadius: 18, padding: "24px 28px",
            maxWidth: 500, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Globe size={24} color="#2563eb" />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>
                Record CRS Portal Submission
              </h3>
            </div>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px" }}>
              Enter the Civil Registration System (crsorgi.gov.in) Acknowledgment or Application Reference Number.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334151", marginBottom: 5 }}>
                CRS Acknowledgment / Application Number (Optional)
              </label>
              <input
                type="text"
                value={crsNumber}
                onChange={(e) => setCrsNumber(e.target.value)}
                placeholder="e.g. CRS/2026/BR/098421"
                style={{
                  width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1",
                  borderRadius: 8, fontSize: 13, outline: "none", color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334151", marginBottom: 5 }}>
                Verification Notes / Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={crsRemarks}
                onChange={(e) => setCrsRemarks(e.target.value)}
                placeholder="e.g. Registered under institutional birth register Vol. 4 Page 12"
                style={{
                  width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1",
                  borderRadius: 8, fontSize: 13, outline: "none", color: "#0f172a",
                  boxSizing: "border-box", resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setShowCrsModal(null); setCrsNumber(""); setCrsRemarks(""); }}
                style={{
                  padding: "9px 18px", background: "white", border: "1px solid #cbd5e1",
                  borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
                }}>
                Cancel
              </button>
              <button
                onClick={() => handleApplyCrs(showCrsModal)}
                disabled={actionLoading}
                style={{
                  padding: "9px 20px", background: "#2563eb", border: "none",
                  borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                {actionLoading ? "Updating..." : "Mark as Applied on CRS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: UPLOAD CERTIFICATE */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100, padding: 16, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "white", borderRadius: 18, padding: "24px 28px",
            maxWidth: 500, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Upload size={24} color="#7c3aed" />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>
                Upload Official Birth Certificate
              </h3>
            </div>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 18px" }}>
              Upload the signed/stamped birth certificate generated from CRS. The application will be marked as Completed, and the certificate will be delivered to the parent&apos;s email.
            </p>

            <div style={{
              border: "2px dashed #cbd5e1", borderRadius: 12, padding: "24px 16px",
              textAlign: "center", background: "#f8fafc", marginBottom: 18,
            }}>
              <FileText size={36} color="#7c3aed" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: "#334151", margin: "0 0 4px" }}>
                {uploadFile ? uploadFile.name : "Select certificate file (PDF, PNG, JPG)"}
              </p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 12px" }}>
                {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : "Maximum file size: 10 MB"}
              </p>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setUploadFile(e.target.files[0] || null)}
                style={{ fontSize: 12 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => { setShowUploadModal(null); setUploadFile(null); }}
                style={{
                  padding: "9px 18px", background: "white", border: "1px solid #cbd5e1",
                  borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
                }}>
                Cancel
              </button>
              <button
                onClick={() => handleUploadCertificate(showUploadModal)}
                disabled={!uploadFile || actionLoading}
                style={{
                  padding: "9px 20px", background: uploadFile ? "#7c3aed" : "#c4b5fd",
                  border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700,
                  cursor: uploadFile ? "pointer" : "not-allowed",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                {actionLoading ? "Uploading to Cloud..." : "Upload & Issue Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
