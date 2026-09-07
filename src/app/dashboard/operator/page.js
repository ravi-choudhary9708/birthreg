"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import gsap from "gsap";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  BarChart3,
  FileText,
  Search,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe,
  Upload,
  Eye,
  Download,
  UserCheck,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { FACILITIES } from "@/utils/constants";

const STATUS_LABELS = {
  PENDING_VERIFIER: { label: "Pending Verification", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  REJECTED_BY_VERIFIER: { label: "Rejected by Facility", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  PENDING_OPERATOR: { label: "Verified • Ready for CRS", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  APPLIED_ON_CRS: { label: "Applied on CRS", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  APPLIED_ON_CSC: { label: "Applied on CRS", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  COMPLETED: { label: "Certificate Issued", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  REJECTED_BY_OPERATOR: { label: "Rejected by Admin", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#ef4444", "#9ca3af"];

const HospitalNetwork3D = dynamic(() => import("@/components/HospitalNetwork3D"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%",
      height: 380,
      borderRadius: 16,
      background: "radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 80%)",
      border: "1px solid #334155",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#94a3b8",
      fontSize: 13,
      fontWeight: 600,
    }}>
      Loading 3D Health Facilities Topology...
    </div>
  ),
});

export default function OperatorDashboard() {
  const [activeTab, setActiveTab] = useState("analytics"); // "analytics" | "queue"
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(null);
  const [viewingApp, setViewingApp] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");

  // Facility filter and search
  const [facilitySearch, setFacilitySearch] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("ALL"); // ALL | OVERDUE | PENDING | COMPLIANT
  const [expandedHospital, setExpandedHospital] = useState(null);
  const [auditingFacility, setAuditingFacility] = useState(null);
  const [auditFacilityFilter, setAuditFacilityFilter] = useState("ALL");
  const [auditStatusFilter, setAuditStatusFilter] = useState("ALL");
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const containerRef = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    if (viewingApp || auditingFacility || showRejectModal || showUploadModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      if (typeof window !== "undefined" && window.__lenis) {
        window.__lenis.stop();
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        if (typeof window !== "undefined" && window.__lenis) {
          window.__lenis.start();
        }
      };
    }
  }, [viewingApp, auditingFacility, showRejectModal, showUploadModal]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        if (containerRef.current.querySelector(".anim-op-header")) {
          gsap.from(".anim-op-header", {
            y: -15,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
          });
        }
        if (containerRef.current.querySelectorAll(".anim-op-stat").length > 0) {
          gsap.from(".anim-op-stat", {
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
  }, [loading, activeTab]);

  // Fetch applications queue
  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      if (res.status === 401) { router.push("/login"); return; }
      if (!data.success) throw new Error(data.message);
      const list = Array.isArray(data.data) ? data.data : (data.data?.applications || []);
      setApps(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/statistics");
      const data = await res.json();
      if (res.status === 401) { router.push("/login"); return; }
      if (!data.success) throw new Error(data.message);
      setStats(data.data);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApps();
    fetchStats();
  }, [fetchApps, fetchStats]);

  const handleApplyCRS = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}/operate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_crs" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchApps();
      await fetchStats();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal || !remarks.trim()) return;
    setActionLoading(showRejectModal);
    try {
      const res = await fetch(`/api/admin/applications/${showRejectModal}/operate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", remarks }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowRejectModal(null);
      setRemarks("");
      await fetchApps();
      await fetchStats();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async () => {
    if (!showUploadModal || !uploadFile) return;
    setActionLoading(showUploadModal);
    try {
      const formData = new FormData();
      formData.append("certificate", uploadFile);
      const res = await fetch(`/api/admin/applications/${showUploadModal}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowUploadModal(null);
      setUploadFile(null);
      await fetchApps();
      await fetchStats();
      alert("Certificate uploaded successfully! Parent has been notified.");
    } catch (err) {
      alert("Upload Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const pending = apps.filter(a => a.status === "PENDING_OPERATOR").length;
  const crsCount = apps.filter(a => a.status === "APPLIED_ON_CRS" || a.status === "APPLIED_ON_CSC").length;
  const completed = apps.filter(a => a.status === "COMPLETED").length;

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    if (!stats?.facilities) return [];
    return stats.facilities.filter(f => {
      const matchesSearch = f.facility.toLowerCase().includes(facilitySearch.toLowerCase());
      if (!matchesSearch) return false;

      if (facilityFilter === "OVERDUE") return f.overdueVerifier > 0;
      if (facilityFilter === "PENDING") return f.pendingVerifier > 0;
      if (facilityFilter === "COMPLIANT") return f.overdueVerifier === 0 && f.totalReceived > 0;
      return true;
    });
  }, [stats, facilitySearch, facilityFilter]);

  // Filtered applications for District Audit Log
  const auditFilteredApps = useMemo(() => {
    return apps.filter(app => {
      if (auditFacilityFilter !== "ALL" && app.facility?.toUpperCase() !== auditFacilityFilter.toUpperCase()) {
        return false;
      }
      if (auditStatusFilter !== "ALL") {
        if (auditStatusFilter === "PENDING_VERIFIER" && app.status !== "PENDING_VERIFIER") return false;
        if (auditStatusFilter === "PENDING_OPERATOR" && app.status !== "PENDING_OPERATOR") return false;
        if (auditStatusFilter === "APPLIED_ON_CRS" && (app.status !== "APPLIED_ON_CRS" && app.status !== "APPLIED_ON_CSC")) return false;
        if (auditStatusFilter === "COMPLETED" && app.status !== "COMPLETED") return false;
        if (auditStatusFilter === "REJECTED" && (app.status !== "REJECTED_BY_VERIFIER" && app.status !== "REJECTED_BY_OPERATOR")) return false;
      }
      if (auditSearchTerm.trim()) {
        const term = auditSearchTerm.toLowerCase();
        const appNum = (app.applicationNumber || "").toLowerCase();
        const child = (app.child?.name || "").toLowerCase();
        const applicant = (app.informationProvider?.name || app.parents?.mother?.name || "").toLowerCase();
        const fac = (app.facility || "").toLowerCase();
        return appNum.includes(term) || child.includes(term) || applicant.includes(term) || fac.includes(term);
      }
      return true;
    });
  }, [apps, auditFacilityFilter, auditStatusFilter, auditSearchTerm]);

  // Top 10 Facilities for Comparison Bar Chart
  const topFacilitiesChartData = useMemo(() => {
    if (!stats?.facilities) return [];
    return stats.facilities
      .slice(0, 10)
      .map(f => ({
        name: f.facility
          .replace("PRIMARY HEALTH CENTRE", "PHC")
          .replace("REFERRAL HOSPITAL", "RH")
          .replace("SUB DIVISIONAL HOSPITAL,", "SDH")
          .replace("SUPRITENDENT SUB DIVISIONAL HOSPITAL", "SDH")
          .replace("PRIMARI HEALTH CENTRE", "PHC"),
        Verified: f.verifiedCount,
        OnTrack: f.onTrackVerifier,
        Overdue: f.overdueVerifier,
      }));
  }, [stats]);

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top Navbar */}
      <header className="anim-op-header" style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 16px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64, flexWrap: "wrap", gap: 12, padding: "8px 0" }}>
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
                  height: 40,
                  width: "auto",
                  maxHeight: 40,
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
                height: 34,
                backgroundColor: "#cbd5e1",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />

            <img
              src="/baby_birth.svg"
              alt="Birth Portal Icon"
              style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", lineHeight: 1.2 }}>Operator Central Command</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#7c3aed", color: "white", padding: "2px 8px", borderRadius: 100 }}>
                  District Super Admin
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Madhubani District • Department of Planning & Development, Govt. of Bihar</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => { fetchApps(); fetchStats(); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1",
                borderRadius: 8, color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
              title="Refresh all metrics">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleLogout} style={{
              padding: "8px 16px", background: "white", border: "1px solid #e2e8f0",
              borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Logout
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 24, borderTop: "1px solid #f1f5f9" }}>
          <button
            onClick={() => setActiveTab("analytics")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "14px 4px", fontSize: 14, fontWeight: 700,
              color: activeTab === "analytics" ? "#7c3aed" : "#64748b",
              borderBottom: activeTab === "analytics" ? "3px solid #7c3aed" : "3px solid transparent",
              background: "none", borderLeft: "none", borderRight: "none", borderTop: "none",
              cursor: "pointer", transition: "all 0.2s ease",
            }}>
            <BarChart3 size={18} />
            7-Day Hospital Monitoring & SLA Analytics
            {stats?.summary?.totalOverdueVerifier > 0 && (
              <span style={{
                background: "#ef4444", color: "white", fontSize: 11, fontWeight: 800,
                padding: "1px 7px", borderRadius: 10,
              }}>
                {stats.summary.totalOverdueVerifier} OVERDUE
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("queue")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "14px 4px", fontSize: 14, fontWeight: 700,
              color: activeTab === "queue" ? "#7c3aed" : "#64748b",
              borderBottom: activeTab === "queue" ? "3px solid #7c3aed" : "3px solid transparent",
              background: "none", borderLeft: "none", borderRight: "none", borderTop: "none",
              cursor: "pointer", transition: "all 0.2s ease",
            }}>
            <Layers size={18} />
            Application Processing Queue
            <span style={{
              background: "#e2e8f0", color: "#334155", fontSize: 11, fontWeight: 700,
              padding: "1px 7px", borderRadius: 10,
            }}>
              {pending}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(16px, 2.5vw, 28px) 16px" }}>

        {/* TAB 1: 7-DAY SLA MONITORING & ANALYTICS */}
        {activeTab === "analytics" && (
          <div>
            {/* Title Section */}
            <div className="anim-op-header" style={{ marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#6d28d9", marginBottom: 8 }}>
                <Clock size={14} /> Section 23 Statutory SLA: 7 Days Hospital Verification Mandate
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3vw, 26px)", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                Hospital Verification Compliance Dashboard
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                Real-time performance audit of all 39 primary health centers (PHC), community health centers (CHC), and sub-divisional hospitals in Madhubani District.
              </p>
            </div>

            {/* SLA Alert Banner */}
            {stats?.summary?.hospitalsWithBacklog > 0 ? (
              <div style={{
                background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 12,
                padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14,
              }}>
                <ShieldAlert size={28} color="#e11d48" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#9f1239" }}>
                    CRITICAL: {stats.summary.hospitalsWithBacklog} Hospital{stats.summary.hospitalsWithBacklog > 1 ? "s" : ""} Breached the 7-Day Verification SLA
                  </h4>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: "#be123c" }}>
                    There are {stats.summary.totalOverdueVerifier} applications awaiting verification past the statutory 7-day turnaround window. Action required by Block Medical Officers.
                  </p>
                </div>
                <button
                  onClick={() => setFacilityFilter("OVERDUE")}
                  style={{
                    padding: "6px 14px", background: "#e11d48", color: "white", border: "none",
                    borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                  View Defaulters
                </button>
              </div>
            ) : (
              <div style={{
                background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12,
                padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
              }}>
                <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#166534" }}>
                    All 39 Facilities Fully Compliant (100% On-Track)
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#15803d" }}>
                    Zero applications are pending beyond the 7-day statutory limit across Madhubani District.
                  </p>
                </div>
              </div>
            )}

            {/* Key KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
              {/* Total Applications */}
              <div className="anim-op-stat" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Total Inflow</span>
                  <FileText size={18} color="#6366f1" />
                </div>
                <p style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", margin: "8px 0 2px" }}>
                  {statsLoading ? "..." : (stats?.summary?.totalApplications ?? 0)}
                </p>
                <span style={{ fontSize: 12, color: "#64748b" }}>District-wide submissions</span>
              </div>

              {/* 7-Day SLA Compliance */}
              <div className="anim-op-stat" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>SLA Compliance</span>
                  <TrendingUp size={18} color="#10b981" />
                </div>
                <p style={{ fontSize: 30, fontWeight: 800, color: (stats?.summary?.districtComplianceRate ?? 100) >= 90 ? "#10b981" : "#e11d48", margin: "8px 0 2px" }}>
                  {statsLoading ? "..." : `${stats?.summary?.districtComplianceRate ?? 100}%`}
                </p>
                <span style={{ fontSize: 12, color: "#64748b" }}>Target: 100% within 7 days</span>
              </div>

              {/* Overdue (>7 Days) */}
              <div className="anim-op-stat" style={{
                background: (stats?.summary?.totalOverdueVerifier ?? 0) > 0 ? "#fef2f2" : "white",
                border: (stats?.summary?.totalOverdueVerifier ?? 0) > 0 ? "1.5px solid #fecaca" : "1px solid #e2e8f0",
                borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: (stats?.summary?.totalOverdueVerifier ?? 0) > 0 ? "#dc2626" : "#64748b" }}>
                    🚨 Overdue (&gt;7 Days)
                  </span>
                  <AlertTriangle size={18} color="#dc2626" />
                </div>
                <p style={{ fontSize: 30, fontWeight: 800, color: (stats?.summary?.totalOverdueVerifier ?? 0) > 0 ? "#dc2626" : "#0f172a", margin: "8px 0 2px" }}>
                  {statsLoading ? "..." : (stats?.summary?.totalOverdueVerifier ?? 0)}
                </p>
                <span style={{ fontSize: 12, color: (stats?.summary?.totalOverdueVerifier ?? 0) > 0 ? "#b91c1c" : "#64748b" }}>
                  SLA Breached backlog
                </span>
              </div>

              {/* On-Track Pending (<=7 Days) */}
              <div className="anim-op-stat" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>On-Track (&le;7d)</span>
                  <Clock size={18} color="#3b82f6" />
                </div>
                <p style={{ fontSize: 30, fontWeight: 800, color: "#2563eb", margin: "8px 0 2px" }}>
                  {statsLoading ? "..." : (stats?.summary?.totalOnTrackVerifier ?? 0)}
                </p>
                <span style={{ fontSize: 12, color: "#64748b" }}>Within allowable window</span>
              </div>

              {/* Hospitals Monitored */}
              <div className="anim-op-stat" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Hospitals</span>
                  <Building2 size={18} color="#8b5cf6" />
                </div>
                <p style={{ fontSize: 30, fontWeight: 800, color: "#7c3aed", margin: "8px 0 2px" }}>
                  {statsLoading ? "..." : "39"}
                </p>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {stats?.summary?.hospitalsCompliant ?? 39} Compliant • {stats?.summary?.hospitalsWithBacklog ?? 0} Delayed
                </span>
              </div>
            </div>

            {/* 3D WebGL Hospital Network Topology Grid */}
            {isMounted && (
              <div style={{ marginBottom: 26 }}>
                <HospitalNetwork3D
                  facilities={stats?.facilities || []}
                  onSelectFacility={(name) => {
                    setFacilitySearch(name);
                    setFacilityFilter("ALL");
                    const el = document.getElementById("hospital-audit-directory");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </div>
            )}

            {/* Charts Grid */}
            {isMounted && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20, marginBottom: 30 }}>
                {/* Chart 1: 7-Day SLA Status Distribution */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>7-Day SLA Status Distribution</h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>District application compliance breakdown</p>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    {stats?.statusDistribution && stats.statusDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.statusDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}>
                            {stats.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
                        No applications registered yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart 2: Pending Applications Aging Breakdown */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Verification Aging Buckets</h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Days pending at hospital verification desk</p>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.agingBuckets || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                          {(stats?.agingBuckets || []).map((entry, index) => {
                            const isOverdue = entry.range.includes("Overdue") || entry.range.includes("Critical");
                            return <Cell key={`bar-${index}`} fill={isOverdue ? "#ef4444" : "#3b82f6"} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: 14-Day Timeline Trend */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>14-Day Inflow vs Clearance Trend</h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Daily incoming vs verified applications</p>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="received" name="Received" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" />
                        <Area type="monotone" dataKey="verified" name="Verified" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Top Active Facilities Performance */}
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Top Facilities: Volume &amp; SLA Status</h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Breakdown for key block hospitals</p>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFacilitiesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12, top: 0 }} />
                        <Bar dataKey="Verified" stackId="a" fill="#10b981" />
                        <Bar dataKey="OnTrack" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="Overdue" stackId="a" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* MASTER 39-HOSPITAL COMPLIANCE DIRECTORY */}
            <div id="hospital-audit-directory" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              {/* Header & Filter Controls */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <Building2 size={20} color="#7c3aed" /> All 39 Government Health Facilities Audit
                    </h2>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "3px 0 0" }}>
                      Monitor verification adherence under the 7-day statutory period for every PHC, CHC, and Referral Hospital.
                    </p>
                  </div>

                  {/* Search Input */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ position: "relative" }}>
                      <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input
                        type="text"
                        placeholder="Search hospital name..."
                        value={facilitySearch}
                        onChange={(e) => setFacilitySearch(e.target.value)}
                        style={{
                          padding: "8px 14px 8px 36px", border: "1px solid #cbd5e1", borderRadius: 8,
                          fontSize: 13, width: 220, outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Pills */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {[
                    { id: "ALL", label: `All Facilities (${stats?.facilities?.length ?? 39})` },
                    { id: "OVERDUE", label: `🚨 SLA Overdue (${stats?.facilities?.filter(f => f.overdueVerifier > 0).length ?? 0})` },
                    { id: "PENDING", label: `⏳ With Active Pending (${stats?.facilities?.filter(f => f.pendingVerifier > 0).length ?? 0})` },
                    { id: "COMPLIANT", label: `✅ 100% Compliant (${stats?.facilities?.filter(f => f.overdueVerifier === 0 && f.totalReceived > 0).length ?? 0})` },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setFacilityFilter(btn.id)}
                      style={{
                        padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700,
                        border: facilityFilter === btn.id ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                        background: facilityFilter === btn.id ? "#7c3aed" : "#f8fafc",
                        color: facilityFilter === btn.id ? "white" : "#475569",
                        cursor: "pointer", transition: "all 0.15s ease",
                      }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Facility Name</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569" }}>SLA Status</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569" }}>Inflow</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#d97706" }}>Pending (≤7d)</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Overdue (&gt;7d)</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#2563eb" }}>Ready CRS</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>Applied CRS</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#16a34a" }}>Certs Ready</th>
                      <th style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Rejections</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>Compliance %</th>
                      <th style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569" }}>Supervision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsLoading ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                          Loading hospital statistics...
                        </td>
                      </tr>
                    ) : filteredFacilities.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                          No facilities match the current search or filter.
                        </td>
                      </tr>
                    ) : (
                      filteredFacilities.map((fac, idx) => {
                        const isOverdue = fac.overdueVerifier > 0;
                        const isExpanded = expandedHospital === fac.facility;
                        return (
                          <React.Fragment key={fac.facility}>
                            <tr style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: isOverdue ? "#fff1f2" : (idx % 2 === 0 ? "white" : "#fafafa"),
                            }}>
                              <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                <div>{fac.facility}</div>
                                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                                  👤 Verifier: {fac.facility.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20)}
                                </span>
                              </td>

                              <td style={{ padding: "14px 12px", textAlign: "center" }}>
                                {isOverdue ? (
                                  <span style={{ padding: "3px 8px", borderRadius: 100, fontSize: 11, fontWeight: 800, background: "#ffe4e6", color: "#e11d48" }}>
                                    🚨 BREACHED
                                  </span>
                                ) : fac.pendingVerifier > 0 ? (
                                  <span style={{ padding: "3px 8px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8" }}>
                                    ⏳ ON TRACK
                                  </span>
                                ) : (
                                  <span style={{ padding: "3px 8px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                                    ✓ COMPLIANT
                                  </span>
                                )}
                              </td>

                              <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#334155" }}>
                                {fac.totalReceived}
                              </td>

                              <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#d97706" }}>
                                {fac.onTrackVerifier}
                              </td>

                              <td style={{
                                padding: "14px 12px", textAlign: "center", fontSize: 13, fontWeight: 800,
                                color: isOverdue ? "#e11d48" : "#94a3b8",
                              }}>
                                {isOverdue ? (
                                  <span style={{ background: "#e11d48", color: "white", padding: "2px 8px", borderRadius: 100 }}>
                                    {fac.overdueVerifier}
                                  </span>
                                ) : "0"}
                              </td>

                              <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#2563eb" }}>
                                {fac.verifiedAwaitingCRS ?? 0}
                              </td>

                              <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>
                                {fac.appliedCRSCount ?? 0}
                              </td>

                              <td style={{ padding: "14px 12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                                {fac.completedCount}
                              </td>

                              <td style={{ padding: "14px 12px", textAlign: "center" }}>
                                {fac.rejectedCount > 0 ? (
                                  <button
                                    onClick={() => setAuditingFacility(fac)}
                                    title="View audited rejection reasons"
                                    style={{
                                      padding: "2px 8px", background: "#fef2f2", color: "#dc2626",
                                      border: "1px solid #fecaca", borderRadius: 100, fontSize: 11, fontWeight: 800,
                                      cursor: "pointer",
                                    }}>
                                    {fac.rejectedCount} Rejected
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 12, color: "#94a3b8" }}>0</span>
                                )}
                              </td>

                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 100, overflow: "hidden" }}>
                                    <div style={{
                                      width: `${fac.complianceRate}%`, height: "100%",
                                      background: fac.complianceRate >= 90 ? "#10b981" : (fac.complianceRate >= 70 ? "#f59e0b" : "#ef4444"),
                                    }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, minWidth: 36, color: "#475569" }}>
                                    {fac.complianceRate}%
                                  </span>
                                </div>
                              </td>

                              <td style={{ padding: "14px 14px", textAlign: "center" }}>
                                <button
                                  onClick={() => setAuditingFacility(fac)}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "6px 12px", background: "#7c3aed", color: "white",
                                    border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                    cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                  }}>
                                  <Eye size={12} /> Audit Verifier
                                </button>
                              </td>
                            </tr>

                            {/* Expanded delayed applications row */}
                            {isExpanded && fac.overdueApplications?.length > 0 && (
                              <tr style={{ background: "#fff5f5", borderBottom: "1px solid #fecdd3" }}>
                                <td colSpan={9} style={{ padding: "12px 24px" }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#9f1239", marginBottom: 6 }}>
                                    🚨 Applications Pending Overdue at {fac.facility}:
                                  </div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {fac.overdueApplications.map(app => (
                                      <div key={app.applicationNumber} style={{
                                        background: "white", border: "1px solid #fda4af",
                                        borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#0f172a",
                                      }}>
                                        <span style={{ fontWeight: 800, color: "#be123c" }}>{app.applicationNumber}</span>
                                        <span style={{ marginLeft: 6, color: "#e11d48", fontWeight: 700 }}>
                                          ({app.daysPending} days delayed)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DISTRICT APPLICATIONS AUDIT LEDGER */}
        {activeTab === "queue" && (
          <div>
            <div className="anim-op-header" style={{ marginBottom: 20 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#6d28d9", marginBottom: 8 }}>
                <ShieldCheck size={14} /> District Command Center • Registry Supervisory Audit
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3vw, 26px)", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                District-Wide Applications Audit Ledger
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                Supervisory log of all birth registrations processed across Madhubani District. Each hospital verifier independently approves, rejects with reason, enters CRS details, and uploads certificates.
              </p>
            </div>

            {/* Advisory / Role Separation Notice */}
            <div style={{
              background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12,
              padding: "14px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12,
            }}>
              <Building2 size={24} color="#2563eb" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.5 }}>
                <strong>Decentralized Facility Pipeline:</strong> All 39 primary health centers and referral hospitals process their applications locally. Central Operator audits SLA adherence, monitors verification timeliness, inspects verifier rejection reasons, and tracks certificate issuance.
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{
              background: "white", border: "1px solid #e2e8f0", borderRadius: 16,
              padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 14,
              justifyContent: "space-between", alignItems: "center",
            }}>
              {/* Facility Select Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Hospital Filter:</label>
                <select
                  value={auditFacilityFilter}
                  onChange={(e) => setAuditFacilityFilter(e.target.value)}
                  style={{
                    padding: "7px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
                    fontSize: 13, color: "#0f172a", outline: "none", background: "white",
                    maxWidth: 280,
                  }}>
                  <option value="ALL">All 39 Health Facilities</option>
                  {FACILITIES.map(fac => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div style={{ position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search application #, child, parent..."
                  value={auditSearchTerm}
                  onChange={(e) => setAuditSearchTerm(e.target.value)}
                  style={{
                    padding: "7px 12px 7px 32px", border: "1px solid #cbd5e1", borderRadius: 8,
                    fontSize: 13, width: 260, outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: `All Applications (${apps.length})` },
                { id: "PENDING_VERIFIER", label: `Needs Verification (${apps.filter(a => a.status === "PENDING_VERIFIER").length})` },
                { id: "PENDING_OPERATOR", label: `Ready for CRS (${apps.filter(a => a.status === "PENDING_OPERATOR").length})` },
                { id: "APPLIED_ON_CRS", label: `Applied on CRS (${apps.filter(a => a.status === "APPLIED_ON_CRS" || a.status === "APPLIED_ON_CSC").length})` },
                { id: "COMPLETED", label: `Completed Certs (${apps.filter(a => a.status === "COMPLETED").length})` },
                { id: "REJECTED", label: `Audited Rejections (${apps.filter(a => a.status === "REJECTED_BY_VERIFIER" || a.status === "REJECTED_BY_OPERATOR").length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAuditStatusFilter(tab.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700,
                    border: auditStatusFilter === tab.id ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                    background: auditStatusFilter === tab.id ? "#7c3aed" : "#f8fafc",
                    color: auditStatusFilter === tab.id ? "white" : "#475569",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Applications Audit Table */}
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: "#ddd6fe", borderTopColor: "#7c3aed", margin: "0 auto 12px" }} />
                <p style={{ color: "#6b7280" }}>Loading district application records...</p>
              </div>
            ) : auditFilteredApps.length === 0 ? (
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
                <FileCheck size={44} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>No Applications Matched</h3>
                <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Try changing your hospital or status filter criteria.</p>
              </div>
            ) : (
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        {["App. No. & Date", "Facility / Hospital", "Child Particulars", "Parent / Applicant", "Status", "Verifier Notes / Reason", "Certificate", "Supervision"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditFilteredApps.map((app, i) => {
                        const sc = STATUS_LABELS[app.status] || { label: app.status, color: "#374151", bg: "#f3f4f6" };
                        const isRejected = app.status === "REJECTED_BY_VERIFIER" || app.status === "REJECTED_BY_OPERATOR";
                        return (
                          <tr key={app._id} style={{ borderBottom: i < auditFilteredApps.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                              <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: 13, fontFamily: "monospace" }}>
                                {app.applicationNumber}
                              </span>
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a", verticalAlign: "middle" }}>
                              {app.facility}
                            </td>
                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{app.child?.name || "—"}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{app.child?.gender}</div>
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13, color: "#334151", verticalAlign: "middle" }}>
                              {app.informationProvider?.name || app.parents?.mother?.name || "—"}
                            </td>
                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                              <span style={{
                                padding: "4px 10px", borderRadius: 100,
                                background: sc.bg, color: sc.color,
                                border: `1px solid ${sc.border || sc.color}`,
                                fontSize: 11, fontWeight: 700,
                              }}>
                                {sc.label}
                              </span>
                            </td>
                            <td style={{ padding: "14px 16px", verticalAlign: "middle", maxWidth: 220 }}>
                              {app.remarks ? (
                                <span style={{ fontSize: 12, color: isRejected ? "#dc2626" : "#475569", fontWeight: isRejected ? 600 : 400 }}>
                                  {isRejected ? `🚨 ${app.remarks}` : app.remarks}
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                              {app.status === "COMPLETED" && app.certificateUrl ? (
                                <a
                                  href={app.certificateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "5px 10px", background: "#f0fdf4", color: "#16a34a",
                                    border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                                  }}>
                                  <Download size={12} /> View Cert
                                </a>
                              ) : (
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>Pending</span>
                              )}
                            </td>
                            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                              <button
                                onClick={() => setViewingApp(app)}
                                style={{
                                  padding: "6px 12px", background: "#f8fafc", color: "#334151",
                                  border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                <Eye size={13} /> Inspect
                              </button>
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
        )}
      </main>

      {/* ========================================================================= */}
      {/* FACILITY VERIFIER AUDIT & COMPLIANCE MODAL */}
      {/* ========================================================================= */}
      {auditingFacility && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => { if (e.target === e.currentTarget) setAuditingFacility(null); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1100, padding: 16, backdropFilter: "blur(4px)",
          }}>
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 18, width: "100%", maxWidth: 740,
              maxHeight: "90vh", display: "flex", flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden",
            }}>
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Building2 size={20} color="#7c3aed" />
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {auditingFacility.facility}
                  </h3>
                </div>
                <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>
                  Verifier Account: <strong style={{ color: "#7c3aed" }}>{auditingFacility.facility.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 24)}</strong> • 7-Day Statutory SLA Audit
                </p>
              </div>
              <button
                onClick={() => setAuditingFacility(null)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}>
                ×
              </button>
            </div>

            {/* Body */}
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              style={{ padding: "20px 24px", overflowY: "auto", flex: 1, minHeight: 0, maxHeight: "calc(90vh - 85px)", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
              {/* Scorecard */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Total Inflow</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{auditingFacility.totalReceived}</div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>SLA Compliance</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: auditingFacility.complianceRate >= 90 ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                    {auditingFacility.complianceRate}%
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Overdue (&gt;7d)</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: auditingFacility.overdueVerifier > 0 ? "#dc2626" : "#16a34a", marginTop: 2 }}>
                    {auditingFacility.overdueVerifier}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Applied on CRS</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed", marginTop: 2 }}>{auditingFacility.appliedCRSCount ?? 0}</div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Certs Ready</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a", marginTop: 2 }}>{auditingFacility.completedCount}</div>
                </div>
              </div>

              {/* Section 1: Audited Rejection Reasons */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <ShieldAlert size={18} color="#dc2626" />
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Audited Verifier Rejection Reasons ({auditingFacility.rejections?.length ?? 0})
                  </h4>
                </div>
                {auditingFacility.rejections && auditingFacility.rejections.length > 0 ? (
                  <div style={{ border: "1px solid #fecaca", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#fff1f2", borderBottom: "1px solid #fecdd3" }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#9f1239" }}>App #</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#9f1239" }}>Child Name</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#9f1239" }}>Audited Reason Recorded by Verifier</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", color: "#9f1239" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditingFacility.rejections.map((rej, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #fef2f2", background: "white" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "#be123c", fontFamily: "monospace" }}>
                              {rej.applicationNumber}
                            </td>
                            <td style={{ padding: "10px 12px", color: "#0f172a" }}>{rej.childName}</td>
                            <td style={{ padding: "10px 12px", color: "#b91c1c", fontWeight: 600 }}>{rej.reason}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>
                              {new Date(rej.date).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", color: "#166534", fontSize: 13 }}>
                    ✓ No applications have been rejected by this facility verifier.
                  </div>
                )}
              </div>

              {/* Section 2: Overdue Applications (>7 Days Delayed) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Clock size={18} color="#d97706" />
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    SLA Delayed Queue ({auditingFacility.overdueVerifier})
                  </h4>
                </div>
                {auditingFacility.overdueApplications && auditingFacility.overdueApplications.length > 0 ? (
                  <div style={{ border: "1px solid #fed7aa", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#92400e" }}>App #</th>
                          <th style={{ padding: "8px 12px", textAlign: "center", color: "#92400e" }}>Days Delayed</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#92400e" }}>Statutory Alert</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditingFacility.overdueApplications.map((app, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #fef3c7", background: "white" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "#b45309", fontFamily: "monospace" }}>
                              {app.applicationNumber}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, color: "#dc2626" }}>
                              {app.daysPending} days
                            </td>
                            <td style={{ padding: "10px 12px", color: "#991b1b", fontWeight: 600 }}>
                              Action required by Block Medical Officer (BMO)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", color: "#166534", fontSize: 13 }}>
                    ✓ All pending applications at this facility are within the statutory 7-day turnaround period.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setAuditingFacility(null)}
                style={{
                  padding: "8px 20px", background: "#7c3aed", color: "white",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Full Application Modal */}
      {viewingApp && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => { if (e.target === e.currentTarget) setViewingApp(null); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1100, padding: "clamp(10px, 3vw, 24px)",
            backdropFilter: "blur(4px)",
          }}>
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 16, width: "100%", maxWidth: 800,
              maxHeight: "90vh", display: "flex", flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #e5e7eb",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0, background: "#ffffff",
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>Application Details</h3>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>{viewingApp.applicationNumber} - {new Date(viewingApp.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <button onClick={() => setViewingApp(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              style={{
                padding: "clamp(16px, 3vw, 24px)",
                overflowY: "auto",
                flex: 1,
                minHeight: 0,
                maxHeight: "calc(90vh - 130px)",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}>
              {/* Child Details */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Child Information (प्रारूप 1)</h4>
                <div className="resp-grid-2">
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Name:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.name}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Gender:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.gender}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Date of Birth:</span> <p style={{ fontWeight: 600, margin: 0 }}>{new Date(viewingApp.child.dateOfBirth).toLocaleDateString("en-IN")}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Child Aadhaar:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.adharNumber || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Weight (kg):</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.weight ? viewingApp.child.weight + " kg" : "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Pregnancy Duration:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.pregnancyDuration ? viewingApp.child.pregnancyDuration + " weeks" : "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Delivery Method:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.deliveryMethod || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Delivery Attention:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.deliveryAttention || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Place of Birth:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.placeOfBirth}</p></div>
                </div>
                {viewingApp.child.birthPlaceAddress && (
                  <div style={{ marginTop: 12, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Birth Place Address</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {viewingApp.child.birthPlaceAddress.plotNumber ? viewingApp.child.birthPlaceAddress.plotNumber + ", " : ""}
                      {viewingApp.child.birthPlaceAddress.mohalla ? viewingApp.child.birthPlaceAddress.mohalla + ", " : ""}
                      {viewingApp.child.birthPlaceAddress.village}, Ward {viewingApp.child.birthPlaceAddress.wardNumber}, 
                      {viewingApp.child.birthPlaceAddress.subDistrict}, {viewingApp.child.birthPlaceAddress.block ? viewingApp.child.birthPlaceAddress.block + ", " : ""}{viewingApp.child.birthPlaceAddress.district}, 
                      {viewingApp.child.birthPlaceAddress.state} - {viewingApp.child.birthPlaceAddress.postOffice ? "PO: " + viewingApp.child.birthPlaceAddress.postOffice + ", " : ""}{viewingApp.child.birthPlaceAddress.pinCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Parents Details */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Parents Information</h4>
                <div className="resp-grid-2">
                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>Mother</p>
                    <div style={{ fontSize: 14, color: "#111827" }}>
                      <p style={{ margin: "4px 0" }}><strong>Name:</strong> {viewingApp.parents.mother.name}</p>
                      <p style={{ margin: "4px 0" }}><strong>Aadhaar:</strong> {viewingApp.parents.mother.adharNumber || "—"}</p>
                      <p style={{ margin: "4px 0" }}><strong>Mobile:</strong> {viewingApp.parents.mother.mobileNumber}</p>
                      <p style={{ margin: "4px 0" }}><strong>Email:</strong> {viewingApp.parents.mother.email || "—"}</p>
                    </div>
                  </div>
                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>Father</p>
                    <div style={{ fontSize: 14, color: "#111827" }}>
                      <p style={{ margin: "4px 0" }}><strong>Name:</strong> {viewingApp.parents.father.name}</p>
                      <p style={{ margin: "4px 0" }}><strong>Aadhaar:</strong> {viewingApp.parents.father.adharNumber || "—"}</p>
                      <p style={{ margin: "4px 0" }}><strong>Mobile:</strong> {viewingApp.parents.father.mobileNumber || "—"}</p>
                      <p style={{ margin: "4px 0" }}><strong>Email:</strong> {viewingApp.parents.father.email || "—"}</p>
                    </div>
                  </div>
                </div>
                
                {/* Parent Addresses */}
                <div className="resp-grid-2" style={{ marginTop: 16 }}>
                  {viewingApp.parents.address && (
                    <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                      <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Current Address</p>
                      <p style={{ margin: 0, fontSize: 13 }}>
                        {viewingApp.parents.address.plotNumber ? viewingApp.parents.address.plotNumber + ", " : ""}
                        {viewingApp.parents.address.village}, Ward {viewingApp.parents.address.wardNumber}, 
                        {viewingApp.parents.address.subDistrict}, {viewingApp.parents.address.block ? viewingApp.parents.address.block + ", " : ""}{viewingApp.parents.address.district}, 
                        {viewingApp.parents.address.state} - {viewingApp.parents.address.postOffice ? "PO: " + viewingApp.parents.address.postOffice + ", " : ""}{viewingApp.parents.address.pinCode}
                      </p>
                    </div>
                  )}
                  {viewingApp.parents.permanentAddress && (
                    <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                      <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Permanent Address</p>
                      <p style={{ margin: 0, fontSize: 13 }}>
                        {viewingApp.parents.permanentAddress.plotNumber ? viewingApp.parents.permanentAddress.plotNumber + ", " : ""}
                        {viewingApp.parents.permanentAddress.village}, Ward {viewingApp.parents.permanentAddress.wardNumber}, 
                        {viewingApp.parents.permanentAddress.subDistrict}, {viewingApp.parents.permanentAddress.block ? viewingApp.parents.permanentAddress.block + ", " : ""}{viewingApp.parents.permanentAddress.district}, 
                        {viewingApp.parents.permanentAddress.state} - {viewingApp.parents.permanentAddress.postOffice ? "PO: " + viewingApp.parents.permanentAddress.postOffice + ", " : ""}{viewingApp.parents.permanentAddress.pinCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Provider Details */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Information Provider (सूचनादाता)</h4>
                <div className="resp-grid-2">
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Name:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.name}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Relation:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.relationToChild || viewingApp.informationProvider.relation || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Aadhaar:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.adharNumber || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mobile:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.mobileNumber}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Email:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.email || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Legal Declaration:</span> <p style={{ fontWeight: 600, margin: 0, color: viewingApp.informationProvider.declarationAccepted ? "#16a34a" : "#dc2626" }}>{viewingApp.informationProvider.declarationAccepted ? "✓ Accepted (Sec 23)" : "Not Accepted"}</p></div>
                </div>
                {viewingApp.informationProvider.informaionProviderAddress && (
                  <div style={{ marginTop: 12, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Provider Address</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {viewingApp.informationProvider.informaionProviderAddress.plotNumber ? viewingApp.informationProvider.informaionProviderAddress.plotNumber + ", " : ""}
                      {viewingApp.informationProvider.informaionProviderAddress.village}, Ward {viewingApp.informationProvider.informaionProviderAddress.wardNumber}, 
                      {viewingApp.informationProvider.informaionProviderAddress.subDistrict}, {viewingApp.informationProvider.informaionProviderAddress.block ? viewingApp.informationProvider.informaionProviderAddress.block + ", " : ""}{viewingApp.informationProvider.informaionProviderAddress.district}, 
                      {viewingApp.informationProvider.informaionProviderAddress.state} - {viewingApp.informationProvider.informaionProviderAddress.postOffice ? "PO: " + viewingApp.informationProvider.informaionProviderAddress.postOffice + ", " : ""}{viewingApp.informationProvider.informaionProviderAddress.pinCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Statistical/Demographic Details */}
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Demographic Information</h4>
                <div className="resp-grid-2">
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother&apos;s Religion:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherReligion || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Father&apos;s Religion:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.fatherReligion || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother&apos;s Literacy:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherLiteracy || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Father&apos;s Literacy:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.fatherLiteracy || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother&apos;s Profession:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherProfession || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Father&apos;s Profession:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.fatherProfession || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother&apos;s Age at Marriage:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherAgeAtMirrage || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother&apos;s Age at Birth:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherAgeAtChildBirth || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Number of Children:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherChildNumber || "—"}</p></div>
                </div>
                {viewingApp.informationProvider.motherAddress && (
                  <div style={{ marginTop: 12, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Mother&apos;s Address (At time of birth)</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {viewingApp.informationProvider.motherAddress.city}, {viewingApp.informationProvider.motherAddress.subDistrict}, 
                      {viewingApp.informationProvider.motherAddress.block ? viewingApp.informationProvider.motherAddress.block + ", " : ""}{viewingApp.informationProvider.motherAddress.district}, {viewingApp.informationProvider.motherAddress.state} - {viewingApp.informationProvider.motherAddress.postOffice ? "PO: " + viewingApp.informationProvider.motherAddress.postOffice + ", " : ""}{viewingApp.informationProvider.motherAddress.pinCode}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              padding: "16px 24px", borderTop: "1px solid #e5e7eb", background: "#f9fafb",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Status: <span style={{ color: STATUS_LABELS[viewingApp.status]?.color || "#000" }}>{STATUS_LABELS[viewingApp.status]?.label || viewingApp.status}</span></span>
              <button onClick={() => setViewingApp(null)} style={{
                padding: "8px 24px", background: "#e5e7eb", border: "none",
                borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer"
              }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowRejectModal(null); setRemarks(""); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1100, padding: "clamp(12px, 3vw, 24px)", backdropFilter: "blur(4px)",
          }}>
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: 20, padding: "clamp(20px, 4vw, 32px) clamp(16px, 4vw, 28px)", maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto", overscrollBehavior: "contain" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Reject Application</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This reason will be emailed to the applicant.</p>
            <textarea
              value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="Enter reason..." rows={4}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, resize: "vertical", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => { setShowRejectModal(null); setRemarks(""); }}
                style={{ minHeight: 44, padding: "10px 20px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={!remarks.trim()}
                style={{ minHeight: 44, padding: "10px 20px", background: remarks.trim() ? "#dc2626" : "#fca5a5", border: "none", borderRadius: 8, color: "white", fontWeight: 600, cursor: remarks.trim() ? "pointer" : "not-allowed" }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowUploadModal(null); setUploadFile(null); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1100, padding: "clamp(12px, 3vw, 24px)", backdropFilter: "blur(4px)",
          }}>
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: 20, padding: "clamp(20px, 4vw, 32px) clamp(16px, 4vw, 28px)", maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto", overscrollBehavior: "contain" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Upload Certificate</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              Upload the certificate generated from the CRS portal. The parent will be notified automatically.
            </p>
            <div style={{
              border: "2px dashed #e5e7eb", borderRadius: 12, padding: "clamp(16px, 4vw, 32px)",
              textAlign: "center", marginBottom: 20, cursor: "pointer",
              background: uploadFile ? "#f0fdf4" : "#f9fafb",
            }}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setUploadFile(e.target.files[0])}
                style={{ display: "none" }}
                id="cert-upload"
              />
              <label htmlFor="cert-upload" style={{ cursor: "pointer" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{uploadFile ? "✅" : "📄"}</div>
                <p style={{ fontSize: 14, color: uploadFile ? "#16a34a" : "#6b7280", fontWeight: 500, wordBreak: "break-all" }}>
                  {uploadFile ? uploadFile.name : "Click to select PDF or Image"}
                </p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Supported: PDF, JPG, PNG</p>
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => { setShowUploadModal(null); setUploadFile(null); }}
                style={{ minHeight: 44, padding: "10px 20px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleUpload} disabled={!uploadFile || actionLoading === showUploadModal}
                style={{
                  minHeight: 44,
                  padding: "10px 20px",
                  background: uploadFile ? "#16a34a" : "#86efac",
                  border: "none", borderRadius: 8, color: "white", fontWeight: 600,
                  cursor: uploadFile ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                {actionLoading === showUploadModal && <span className="spinner" style={{ width: 16, height: 16 }} />}
                Upload & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
