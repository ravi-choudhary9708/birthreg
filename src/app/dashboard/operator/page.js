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
  ExternalLink,
  Download,
  UserCheck,
  ShieldCheck,
  FileCheck,
  UserPlus,
  KeyRound,
  Check,
  X,
  Phone,
  Mail,
  User,
  Power,
  Lock,
  Users,
} from "lucide-react";
import { FACILITIES, FACILITIES_BY_BLOCK } from "@/utils/constants";
import { getDocumentViewUrl } from "@/utils/documentViewer";
import { useRefreshSecurity } from "@/hooks/useRefreshSecurity";

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
  const { isRefreshing } = useRefreshSecurity();
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

  // Verifier management state
  const [verifiers, setVerifiers] = useState([]);
  const [verifiersLoading, setVerifiersLoading] = useState(false);
  const [verifiersError, setVerifiersError] = useState("");
  const [verifierSearch, setVerifierSearch] = useState("");
  const [verifierStatusFilter, setVerifierStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [verifierPage, setVerifierPage] = useState(1);
  const [showNewVerifierModal, setShowNewVerifierModal] = useState(false);
  const [newVerifierForm, setNewVerifierForm] = useState({
    username: "",
    password: "",
    facility: "",
    authorityName: "",
    designation: "Facility Verification Officer / MOIC",
    contactNumber: "",
    email: "",
  });
  const [newVerifierLoading, setNewVerifierLoading] = useState(false);
  const [newVerifierError, setNewVerifierError] = useState("");
  const [newVerifierSuccess, setNewVerifierSuccess] = useState("");
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [toggleLoadingId, setToggleLoadingId] = useState(null);
  const [confirmToggleModal, setConfirmToggleModal] = useState(null);
  const [facilitiesByBlock, setFacilitiesByBlock] = useState(FACILITIES_BY_BLOCK);
  const [totalFacilitiesCount, setTotalFacilitiesCount] = useState(FACILITIES.length);

  const router = useRouter();
  const containerRef = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    if (
      viewingApp ||
      auditingFacility ||
      showRejectModal ||
      showUploadModal ||
      showNewVerifierModal ||
      showResetPasswordModal ||
      confirmToggleModal
    ) {
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
  }, [
    viewingApp,
    auditingFacility,
    showRejectModal,
    showUploadModal,
    showNewVerifierModal,
    showResetPasswordModal,
    confirmToggleModal,
  ]);

  // Entrance animations for stats counter
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        const safeFrom = (selector, vars) => {
          const els = containerRef.current?.querySelectorAll(selector);
          if (els && els.length > 0) {
            gsap.from(els, vars);
          }
        };

        if (activeTab === "analytics") {
          safeFrom(".anim-op-header", {
            y: -10,
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
          });
          safeFrom(".anim-op-hero", {
            y: 12,
            opacity: 0,
            duration: 0.5,
            delay: 0.1,
            ease: "power3.out",
          });
          safeFrom(".anim-op-stat", {
            y: 15,
            opacity: 0,
            duration: 0.45,
            stagger: 0.08,
            delay: 0.15,
            ease: "power3.out",
          });
          safeFrom(".anim-op-grid-widget", {
            scale: 0.98,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.25,
            ease: "power2.out",
          });
        } else if (activeTab === "queue") {
          safeFrom(".anim-op-queue-card", {
            y: 10,
            opacity: 0,
            duration: 0.45,
            ease: "back.out(1.4)",
          });
        } else if (activeTab === "verifiers") {
          safeFrom(".anim-op-verifier-card", {
            y: 10,
            opacity: 0,
            duration: 0.45,
            ease: "power2.out",
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
      if (res.status === 401) { router.push("/logout?reason=refresh"); return; }
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
      if (res.status === 401) { router.push("/logout?reason=refresh"); return; }
      if (!data.success) throw new Error(data.message);
      setStats(data.data);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [router]);

  // Fetch verifiers list
  // Fetch verifiers list with auto-retry on serverless cold-start
  const fetchVerifiers = useCallback(async (isRetry = false) => {
    setVerifiersLoading(true);
    setVerifiersError("");
    try {
      const res = await fetch("/api/admin/verifiers");
      const data = await res.json();
      if (res.status === 401) { router.push("/logout?reason=refresh"); return; }
      if (!data.success) throw new Error(data.message);
      setVerifiers(data.data || []);
      setVerifiersError("");
      setVerifiersLoading(false);
    } catch (err) {
      if (!isRetry) {
        // Automatic single retry in case of database cold start
        setTimeout(() => fetchVerifiers(true), 1200);
        return;
      }
      setVerifiersError(err.message || "Failed to load verifiers");
      setVerifiersLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApps();
    fetchStats();
    fetchVerifiers();
    fetch("/api/facilities")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.facilities?.length > 0) {
          const grouped = data.data.facilities.reduce((acc, f) => {
            const b = f.block || "Other";
            if (!acc[b]) acc[b] = [];
            acc[b].push(f.name);
            return acc;
          }, {});
          setFacilitiesByBlock(grouped);
          setTotalFacilitiesCount(data.data.facilities.length);
        }
      })
      .catch((err) => {
        console.error("Failed to load facilities from database in operator dashboard:", err);
      });
  }, [fetchApps, fetchStats, fetchVerifiers]);

  // Re-fetch verifiers if empty when switching to verifiers tab
  useEffect(() => {
    if (activeTab === "verifiers" && verifiers.length === 0 && !verifiersLoading) {
      fetchVerifiers();
    }
  }, [activeTab, verifiers.length, verifiersLoading, fetchVerifiers]);

  const handleCreateVerifier = async (e) => {
    e.preventDefault();
    setNewVerifierLoading(true);
    setNewVerifierError("");
    setNewVerifierSuccess("");
    try {
      const res = await fetch("/api/admin/verifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVerifierForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setNewVerifierSuccess(`सत्यापनकर्ता '${data.data.username}' सफलतापूर्वक पंजीकृत हो गया!`);
      await fetchVerifiers();
      setTimeout(() => {
        setShowNewVerifierModal(false);
        setNewVerifierForm({
          username: "",
          password: "",
          facility: "",
          authorityName: "",
          designation: "Facility Verification Officer / MOIC",
          contactNumber: "",
          email: "",
        });
        setNewVerifierSuccess("");
      }, 1200);
    } catch (err) {
      setNewVerifierError(err.message);
    } finally {
      setNewVerifierLoading(false);
    }
  };

  const handleToggleVerifierStatus = async (verifier) => {
    if (!verifier) return;
    setToggleLoadingId(verifier.id);
    try {
      const newStatus = !verifier.isActive;
      const res = await fetch(`/api/admin/verifiers/${verifier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setVerifiers((prev) =>
        prev.map((v) => (v.id === verifier.id ? { ...v, isActive: newStatus } : v))
      );
      setConfirmToggleModal(null);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!showResetPasswordModal || !resetPasswordVal.trim()) return;
    setResetPasswordLoading(true);
    setResetPasswordError("");
    try {
      const res = await fetch(`/api/admin/verifiers/${showResetPasswordModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordVal.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      alert(`सत्यापनकर्ता '${showResetPasswordModal.username}' का पासवर्ड सफलतापूर्वक अद्यतन कर दिया गया।`);
      setShowResetPasswordModal(null);
      setResetPasswordVal("");
    } catch (err) {
      setResetPasswordError(err.message);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const filteredVerifiers = useMemo(() => {
    return verifiers.filter((v) => {
      if (verifierStatusFilter === "ACTIVE" && !v.isActive) return false;
      if (verifierStatusFilter === "INACTIVE" && v.isActive) return false;
      if (verifierSearch.trim()) {
        const term = verifierSearch.toLowerCase();
        const u = (v.username || "").toLowerCase();
        const f = (v.facility || "").toLowerCase();
        const a = (v.authorityName || "").toLowerCase();
        const d = (v.designation || "").toLowerCase();
        const e = (v.email || "").toLowerCase();
        const c = (v.contactNumber || "").toLowerCase();
        return u.includes(term) || f.includes(term) || a.includes(term) || d.includes(term) || e.includes(term) || c.includes(term);
      }
      return true;
    });
  }, [verifiers, verifierStatusFilter, verifierSearch]);

  const VERIFIERS_PER_PAGE = 30;
  const verifierTotalPages = Math.ceil(filteredVerifiers.length / VERIFIERS_PER_PAGE) || 1;
  const paginatedVerifiers = useMemo(() => {
    const start = (verifierPage - 1) * VERIFIERS_PER_PAGE;
    return filteredVerifiers.slice(start, start + VERIFIERS_PER_PAGE);
  }, [filteredVerifiers, verifierPage]);

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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    router.push("/logout?reason=manual");
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
  if (isRefreshing) {
    return (
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
          padding: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: "3.5px solid #e5e7eb",
            borderTopColor: "#1e40af",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: 16,
          }}
        />
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#111827" }}>
          सुरक्षा नीति: सत्र समाप्त हो रहा है...
        </h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0" }}>
          पृष्ठ रीफ़्रेश करने के कारण लॉग आउट किया जा रहा है (Logging out due to page refresh...)
        </p>
      </div>
    );
  }

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

          <button
            onClick={() => setActiveTab("verifiers")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "14px 4px", fontSize: 14, fontWeight: 700,
              color: activeTab === "verifiers" ? "#7c3aed" : "#64748b",
              borderBottom: activeTab === "verifiers" ? "3px solid #7c3aed" : "3px solid transparent",
              background: "none", borderLeft: "none", borderRight: "none", borderTop: "none",
              cursor: "pointer", transition: "all 0.2s ease",
            }}>
            <UserCheck size={18} />
            Verifier Management (सत्यापनकर्ता नियंत्रण)
            <span style={{
              background: "#dbeafe", color: "#1e40af", fontSize: 11, fontWeight: 700,
              padding: "1px 7px", borderRadius: 10,
            }}>
              {verifiers.length}
            </span>
            {verifiers.some((v) => !v.isActive) && (
              <span style={{
                background: "#fef2f2", color: "#dc2626", fontSize: 10.5, fontWeight: 800,
                padding: "1px 6px", borderRadius: 10, border: "1px solid #fecaca",
              }}>
                {verifiers.filter((v) => !v.isActive).length} Inactive
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "clamp(16px, 2.5vw, 28px) 16px",
          scrollMarginTop: "90px",
          outline: "none",
        }}
      >

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
                Real-time performance audit of all 606 healthcare facilities across Madhubani District.
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
                    All {stats?.facilities?.length ?? 606} Facilities Fully Compliant (100% On-Track)
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
                  {statsLoading ? "..." : (stats?.facilities?.length ?? 606)}
                </p>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {stats?.summary?.hospitalsCompliant ?? (stats?.facilities?.length ?? 606)} Compliant • {stats?.summary?.hospitalsWithBacklog ?? 0} Delayed
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
                      <Building2 size={20} color="#7c3aed" /> All {stats?.facilities?.length ?? 606} Government Health Facilities Audit
                    </h2>
                    <p style={{ fontSize: 13, color: "#64748b", margin: "3px 0 0" }}>
                      Monitor verification adherence under the 7-day statutory period for every hospital, CHC, PHC, and health wellness centre.
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
                    { id: "ALL", label: `All Facilities (${stats?.facilities?.length ?? 606})` },
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
                <strong>Decentralized Facility Pipeline:</strong> All 606 primary health centers, community health centers, wellness centers, and referral hospitals process their applications locally. Central Operator audits SLA adherence, monitors verification timeliness, inspects verifier rejection reasons, and tracks certificate issuance.
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
                    maxWidth: 300,
                  }}>
                  <option value="ALL">All Health Facilities ({totalFacilitiesCount} Total)</option>
                  {Object.entries(facilitiesByBlock).map(([block, facList]) => (
                    <optgroup key={block} label={`📍 ${block} Block (${facList.length})`}>
                      {facList.map((fac) => {
                        const facName = typeof fac === "string" ? fac : fac?.name;
                        return (
                          <option key={facName} value={facName}>{facName}</option>
                        );
                      })}
                    </optgroup>
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
                              <div>{app.informationProvider?.name || app.parents?.mother?.name || "—"}</div>
                              {Boolean(
                                app.parents?.mother?.adharCardUrl ||
                                app.parents?.father?.adharCardUrl ||
                                app.informationProvider?.adharCardUrl ||
                                app.child?.adharCardUrl
                              ) && (
                                <div style={{ marginTop: 3 }}>
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    border: "1px solid #bfdbfe",
                                  }}>
                                    <FileText size={11} /> Aadhaar Attached
                                  </span>
                                </div>
                              )}
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

        {/* TAB 3: VERIFIER ACCOUNTS & CREDENTIALS CONTROL */}
        {activeTab === "verifiers" && (
          <div>
            {/* Header & New Verifier CTA */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1e40af",
                    marginBottom: 8,
                  }}
                >
                  <ShieldCheck size={14} /> District Administration • Verifier Credential & Jurisdiction Authority
                </div>
                <h1
                  style={{
                    fontSize: "clamp(22px, 3vw, 26px)",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 6px",
                  }}
                >
                  Hospital Verifier Accounts & Access Control (सत्यापनकर्ता प्रबंधन)
                </h1>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0, maxWidth: 840, lineHeight: 1.5 }}>
                  Manage hospital verifier login credentials, monitor real-time operational status, and configure facility-level registration rights. Deactivating a verifier account immediately disables their login and halts new application submissions for that hospital.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewVerifierError("");
                  setNewVerifierSuccess("");
                  setShowNewVerifierModal(true);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 20px",
                  background: "#1e40af",
                  color: "white",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(30, 64, 175, 0.25)",
                  transition: "all 0.2s ease",
                }}
              >
                <UserPlus size={17} /> + Register New Verifier (नया सत्यापनकर्ता जोड़ें)
              </button>
            </div>

            {/* KPI Summary Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Verifier Accounts</span>
                  <Users size={20} color="#6366f1" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                  {verifiers.length}
                </div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>
                  Registered hospital verification officers
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  border: "1px solid #bbf7d0",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Active Verifiers (सक्रिय)</span>
                  <CheckCircle2 size={20} color="#16a34a" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", marginTop: 6 }}>
                  {verifiers.filter((v) => v.isActive).length}
                </div>
                <div style={{ fontSize: 11.5, color: "#15803d", marginTop: 4 }}>
                  Login permitted • Accepting new applications
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  border: "1px solid #fecaca",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>Deactivated / Suspended</span>
                  <AlertTriangle size={20} color="#dc2626" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#dc2626", marginTop: 6 }}>
                  {verifiers.filter((v) => !v.isActive).length}
                </div>
                <div style={{ fontSize: 11.5, color: "#b91c1c", marginTop: 4 }}>
                  Login blocked • Hospital applications halted
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Healthcare Facilities Covered</span>
                  <Building2 size={20} color="#7c3aed" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#7c3aed", marginTop: 6 }}>
                  {new Set(verifiers.map((v) => v.facility)).size} / {totalFacilitiesCount}
                </div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>
                  District Sadar, SDH, CHC, and PHC centres
                </div>
              </div>
            </div>

            {/* Verifiers Filter and Search Bar */}
            <div
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "14px 18px",
                marginBottom: 20,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 300px" }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search by username, officer name, hospital, designation, or email..."
                  value={verifierSearch}
                  onChange={(e) => {
                    setVerifierSearch(e.target.value);
                    setVerifierPage(1);
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: 13.5,
                    color: "#0f172a",
                  }}
                />
                {verifierSearch && (
                  <button
                    onClick={() => {
                      setVerifierSearch("");
                      setVerifierPage(1);
                    }}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}
                  >
                    ×
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#64748b" }}>Status Filter:</span>
                {[
                  { label: "All Verifiers", val: "ALL" },
                  { label: `Active (${verifiers.filter((v) => v.isActive).length})`, val: "ACTIVE" },
                  { label: `Inactive (${verifiers.filter((v) => !v.isActive).length})`, val: "INACTIVE" },
                ].map((tab) => (
                  <button
                    key={tab.val}
                    onClick={() => {
                      setVerifierStatusFilter(tab.val);
                      setVerifierPage(1);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      border: "1px solid",
                      cursor: "pointer",
                      background: verifierStatusFilter === tab.val ? "#1e40af" : "#f8fafc",
                      borderColor: verifierStatusFilter === tab.val ? "#1e40af" : "#cbd5e1",
                      color: verifierStatusFilter === tab.val ? "white" : "#475569",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message if any */}
            {verifiersError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "12px 16px",
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={18} /> {verifiersError}
                </div>
                <button
                  type="button"
                  onClick={() => fetchVerifiers()}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} /> पुन: लोड करें (Retry)
                </button>
              </div>
            )}

            {/* Verifiers Table */}
            <div
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              }}
            >
              {verifiersLoading ? (
                <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: "3px solid #e2e8f0",
                      borderTopColor: "#1e40af",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 12px",
                    }}
                  />
                  सत्यापनकर्ता सूची लोड हो रही है... (Loading verifiers...)
                </div>
              ) : filteredVerifiers.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                  <UserCheck size={36} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
                    कोई सत्यापनकर्ता नहीं मिला (No Verifiers Found)
                  </h3>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                    खोज मानदंड या फ़िल्टर समायोजित करें, अथवा नया सत्यापनकर्ता पंजीकृत करें।
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569", fontWeight: 700 }}>
                          Authority Details (अधिकारी विवरण)
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569", fontWeight: 700 }}>
                          Health Facility Jurisdiction (अस्पताल अधिकार क्षेत्र)
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569", fontWeight: 700 }}>
                          Login ID (यूजरनेम)
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "center", color: "#475569", fontWeight: 700 }}>
                          Workload Activity
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "center", color: "#475569", fontWeight: 700 }}>
                          Status & Applications Control
                        </th>
                        <th style={{ padding: "12px 16px", textAlign: "right", color: "#475569", fontWeight: 700 }}>
                          Actions (कार्रवाई)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVerifiers.map((v) => (
                        <tr
                          key={v.id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: v.isActive ? "white" : "#fffbfa",
                            transition: "background 0.15s ease",
                          }}
                        >
                          {/* Column 1: Authority Details */}
                          <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "50%",
                                  background: v.isActive ? "#eff6ff" : "#fef2f2",
                                  border: `1px solid ${v.isActive ? "#bfdbfe" : "#fecaca"}`,
                                  color: v.isActive ? "#1d4ed8" : "#dc2626",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: 14,
                                  flexShrink: 0,
                                }}
                              >
                                {v.authorityName ? v.authorityName.charAt(0).toUpperCase() : <User size={16} />}
                              </div>
                              <div>
                                <strong style={{ display: "block", fontSize: 13.5, color: "#0f172a" }}>
                                  {v.authorityName || "Nodal Verification Officer"}
                                </strong>
                                <span style={{ fontSize: 11.5, color: "#64748b" }}>
                                  {v.designation || "Facility Verification Officer / MOIC"}
                                </span>
                                {(v.contactNumber || v.email) && (
                                  <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 11, color: "#64748b" }}>
                                    {v.contactNumber && (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                        <Phone size={11} /> {v.contactNumber}
                                      </span>
                                    )}
                                    {v.email && (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                        <Mail size={11} /> {v.email}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Health Facility Jurisdiction */}
                          <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>
                              {v.facility}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              {v.isActive ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: "#15803d",
                                    background: "#f0fdf4",
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    border: "1px solid #bbf7d0",
                                  }}
                                >
                                  ✓ Applications Allowed (आवेदन स्वीकार्य)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: "#b91c1c",
                                    background: "#fef2f2",
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    border: "1px solid #fecaca",
                                  }}
                                >
                                  ⚠️ Applications Suspended (आवेदन निलंबित)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Column 3: Login ID */}
                          <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                            <div
                              style={{
                                fontFamily: "ui-monospace, monospace",
                                fontWeight: 700,
                                fontSize: 12.5,
                                color: "#1e40af",
                                background: "#eff6ff",
                                padding: "4px 8px",
                                borderRadius: 6,
                                display: "inline-block",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              {v.username}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                              Added {new Date(v.createdAt).toLocaleDateString("en-IN")}
                            </div>
                          </td>

                          {/* Column 4: Workload Activity */}
                          <td style={{ padding: "14px 16px", textAlign: "center", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                              <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Pending</span>
                                <strong
                                  style={{
                                    fontSize: 13,
                                    color: (v.stats?.pendingVerifier ?? 0) > 0 ? "#d97706" : "#64748b",
                                  }}
                                >
                                  {v.stats?.pendingVerifier ?? 0}
                                </strong>
                              </div>
                              <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
                              <div style={{ textAlign: "center" }}>
                                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Verified</span>
                                <strong style={{ fontSize: 13, color: "#16a34a" }}>
                                  {(v.stats?.pendingOperator ?? 0) + (v.stats?.completed ?? 0)}
                                </strong>
                              </div>
                            </div>
                          </td>

                          {/* Column 5: Operational Status & Effects */}
                          <td style={{ padding: "14px 16px", textAlign: "center", verticalAlign: "middle" }}>
                            {v.isActive ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "4px 10px",
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: "#dcfce7",
                                  color: "#15803d",
                                  border: "1px solid #86efac",
                                }}
                              >
                                <Check size={13} /> Active (सक्रिय)
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "4px 10px",
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                }}
                              >
                                <X size={13} /> Inactive (निष्क्रिय)
                              </span>
                            )}
                          </td>

                          {/* Column 6: Actions */}
                          <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
                              {/* Toggle Active/Inactive Button */}
                              <button
                                disabled={toggleLoadingId === v.id}
                                onClick={() => setConfirmToggleModal(v)}
                                title={
                                  v.isActive
                                    ? "Click to deactivate this verifier (blocks login and hospital applications)"
                                    : "Click to activate this verifier (allows login and hospital applications)"
                                }
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: "1px solid",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  background: v.isActive ? "#fef2f2" : "#f0fdf4",
                                  borderColor: v.isActive ? "#fecaca" : "#bbf7d0",
                                  color: v.isActive ? "#dc2626" : "#16a34a",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <Power size={12} />
                                {v.isActive ? "Deactivate (निष्क्रिय करें)" : "Activate (सक्रिय करें)"}
                              </button>

                              {/* Reset Password Button */}
                              <button
                                onClick={() => {
                                  setShowResetPasswordModal(v);
                                  setResetPasswordVal("");
                                  setResetPasswordError("");
                                }}
                                title="Reset login password"
                                style={{
                                  padding: "6px 10px",
                                  background: "white",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 6,
                                  color: "#475569",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <KeyRound size={12} /> Password
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Verifier Pagination Controls */}
              {verifierTotalPages > 1 && !verifiersLoading && filteredVerifiers.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    background: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Showing <strong>{((verifierPage - 1) * VERIFIERS_PER_PAGE) + 1}</strong> - <strong>{Math.min(verifierPage * VERIFIERS_PER_PAGE, filteredVerifiers.length)}</strong> of <strong>{filteredVerifiers.length}</strong> verifiers
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => setVerifierPage(1)}
                      disabled={verifierPage === 1}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: verifierPage === 1 ? "#f1f5f9" : "white",
                        color: verifierPage === 1 ? "#94a3b8" : "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: verifierPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      « First
                    </button>
                    <button
                      onClick={() => setVerifierPage((p) => Math.max(1, p - 1))}
                      disabled={verifierPage === 1}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: verifierPage === 1 ? "#f1f5f9" : "white",
                        color: verifierPage === 1 ? "#94a3b8" : "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: verifierPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      ‹ Prev
                    </button>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", margin: "0 6px" }}>
                      Page {verifierPage} of {verifierTotalPages}
                    </span>
                    <button
                      onClick={() => setVerifierPage((p) => Math.min(verifierTotalPages, p + 1))}
                      disabled={verifierPage === verifierTotalPages}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: verifierPage === verifierTotalPages ? "#f1f5f9" : "white",
                        color: verifierPage === verifierTotalPages ? "#94a3b8" : "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: verifierPage === verifierTotalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      Next ›
                    </button>
                    <button
                      onClick={() => setVerifierPage(verifierTotalPages)}
                      disabled={verifierPage === verifierTotalPages}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: verifierPage === verifierTotalPages ? "#f1f5f9" : "white",
                        color: verifierPage === verifierTotalPages ? "#94a3b8" : "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: verifierPage === verifierTotalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      Last »
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  <div>
                    <span style={{ color: "#6b7280", fontSize: 13 }}>Child Aadhaar:</span>
                    <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.adharNumber || "—"}</p>
                    {viewingApp.child.adharCardUrl && (
                      <div style={{ marginTop: 4 }}>
                        <a
                          href={getDocumentViewUrl(viewingApp.child.adharCardUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            color: "#1d4ed8",
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={11} /> View Child Aadhaar
                        </a>
                      </div>
                    )}
                  </div>
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
                      {viewingApp.parents.mother.adharCardUrl ? (
                        <div style={{ margin: "6px 0" }}>
                          <a
                            href={getDocumentViewUrl(viewingApp.parents.mother.adharCardUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              color: "#1d4ed8",
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={12} /> View Mother Aadhaar
                          </a>
                        </div>
                      ) : (
                        <p style={{ margin: "4px 0", fontSize: 11, color: "#9ca3af" }}>Aadhaar Card: Not uploaded</p>
                      )}
                      <p style={{ margin: "4px 0" }}><strong>Mobile:</strong> {viewingApp.parents.mother.mobileNumber}</p>
                      <p style={{ margin: "4px 0" }}><strong>Email:</strong> {viewingApp.parents.mother.email || "—"}</p>
                    </div>
                  </div>
                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>Father</p>
                    <div style={{ fontSize: 14, color: "#111827" }}>
                      <p style={{ margin: "4px 0" }}><strong>Name:</strong> {viewingApp.parents.father.name}</p>
                      <p style={{ margin: "4px 0" }}><strong>Aadhaar:</strong> {viewingApp.parents.father.adharNumber || "—"}</p>
                      {viewingApp.parents.father.adharCardUrl ? (
                        <div style={{ margin: "6px 0" }}>
                          <a
                            href={getDocumentViewUrl(viewingApp.parents.father.adharCardUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: 6,
                              color: "#1d4ed8",
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={12} /> View Father Aadhaar
                          </a>
                        </div>
                      ) : (
                        <p style={{ margin: "4px 0", fontSize: 11, color: "#9ca3af" }}>Aadhaar Card: Not uploaded</p>
                      )}
                      <p style={{ margin: "4px 0" }}><strong>Mobile:</strong> {viewingApp.parents.father.mobileNumber}</p>
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
                  <div>
                    <span style={{ color: "#6b7280", fontSize: 13 }}>Aadhaar:</span>
                    <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.adharNumber || "—"}</p>
                    {viewingApp.informationProvider.adharCardUrl && (
                      <div style={{ marginTop: 4 }}>
                        <a
                          href={getDocumentViewUrl(viewingApp.informationProvider.adharCardUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            color: "#1d4ed8",
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={11} /> View Informant Aadhaar
                        </a>
                      </div>
                    )}
                  </div>
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

              {/* Uploaded Aadhaar Documents for Verification */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <FileCheck size={16} /> Uploaded Aadhaar Documents for Verification (सत्यापन हेतु आधार दस्तावेज़)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {[
                    { title: "Mother's Aadhaar (माता)", num: viewingApp.parents?.mother?.adharNumber, url: viewingApp.parents?.mother?.adharCardUrl },
                    { title: "Father's Aadhaar (पिता)", num: viewingApp.parents?.father?.adharNumber, url: viewingApp.parents?.father?.adharCardUrl },
                    { title: "Informant's Aadhaar (सूचनादाता)", num: viewingApp.informationProvider?.adharNumber, url: viewingApp.informationProvider?.adharCardUrl },
                    { title: "Child's Aadhaar (शिशु)", num: viewingApp.child?.adharNumber, url: viewingApp.child?.adharCardUrl },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: doc.url ? "#f0fdf4" : "#f9fafb",
                        border: `1px solid ${doc.url ? "#86efac" : "#e5e7eb"}`,
                        borderRadius: 10,
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <strong style={{ fontSize: 12.5, color: "#1e293b" }}>{doc.title}</strong>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: doc.url ? "#dcfce7" : "#f1f5f9",
                              color: doc.url ? "#15803d" : "#64748b",
                            }}
                          >
                            {doc.url ? "✓ Cloudinary" : "Not Provided"}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#475569" }}>
                          <strong>No:</strong> {doc.num || "—"}
                        </p>
                      </div>
                      {doc.url ? (
                        <a
                          href={getDocumentViewUrl(doc.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            background: "#16a34a",
                            color: "white",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <ExternalLink size={13} /> View Document (देखें)
                        </a>
                      ) : (
                        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "6px 0" }}>
                          दस्तावेज़ संलग्न नहीं (No file uploaded)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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

      {/* ========================================================================= */}
      {/* REGISTER NEW VERIFIER MODAL */}
      {/* ========================================================================= */}
      {showNewVerifierModal && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget && !newVerifierLoading) setShowNewVerifierModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 18,
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Register New Hospital Verifier (नया सत्यापनकर्ता जोड़ें)
                </h3>
                <p style={{ color: "#64748b", fontSize: 12.5, margin: "3px 0 0" }}>
                  Create credentials and assign hospital jurisdiction in Madhubani District.
                </p>
              </div>
              <button
                disabled={newVerifierLoading}
                onClick={() => setShowNewVerifierModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ×
              </button>
            </div>

            {/* Body / Form */}
            <form onSubmit={handleCreateVerifier} style={{ padding: "20px 22px", overflowY: "auto" }}>
              {newVerifierError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "#dc2626",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  ⚠️ {newVerifierError}
                </div>
              )}

              {newVerifierSuccess && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "#16a34a",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  ✓ {newVerifierSuccess}
                </div>
              )}

              {/* Facility Dropdown */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Designated Healthcare Facility (स्वास्थ्य केंद्र) *
                </label>
                <select
                  required
                  value={newVerifierForm.facility}
                  onChange={(e) => {
                    const fac = e.target.value;
                    const slug = fac.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 20);
                    setNewVerifierForm((p) => ({
                      ...p,
                      facility: fac,
                      username: p.username ? p.username : `verifier_${slug}`,
                    }));
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13.5,
                    color: "#0f172a",
                    background: "white",
                  }}
                >
                  <option value="">— Select Hospital / Facility —</option>
                  {Object.entries(facilitiesByBlock).map(([block, facList]) => (
                    <optgroup key={block} label={`📍 ${block} Block (${facList.length})`}>
                      {facList.map((fac) => {
                        const facName = typeof fac === "string" ? fac : fac?.name;
                        return (
                          <option key={facName} value={facName}>
                            {facName}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Grid 2 cols for Username & Password */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Login ID / Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. verifier_sdh_jaynagar"
                    value={newVerifierForm.username}
                    onChange={(e) =>
                      setNewVerifierForm((p) => ({
                        ...p,
                        username: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "#0f172a",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>3-30 lowercase characters, underscores</span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Password (पासवर्ड) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={newVerifierForm.password}
                    onChange={(e) => setNewVerifierForm((p) => ({ ...p, password: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "#0f172a",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>At least 6 characters</span>
                </div>
              </div>

              {/* Authority Details: Name & Designation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Authority Officer Full Name (अधिकारी का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Anil Kumar Jha"
                    value={newVerifierForm.authorityName}
                    onChange={(e) => setNewVerifierForm((p) => ({ ...p, authorityName: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "#0f172a",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Official Designation (पदनाम)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MOIC / Health Manager / Registrar"
                    value={newVerifierForm.designation}
                    onChange={(e) => setNewVerifierForm((p) => ({ ...p, designation: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "#0f172a",
                    }}
                  />
                </div>
              </div>

              {/* Mobile & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Official Mobile Number (मोबाइल नंबर)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={newVerifierForm.contactNumber}
                    onChange={(e) =>
                      setNewVerifierForm((p) => ({
                        ...p,
                        contactNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "#0f172a",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Official Email (ईमेल)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. moic.jaynagar@bihar.gov.in"
                    value={newVerifierForm.email}
                    onChange={(e) => setNewVerifierForm((p) => ({ ...p, email: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: "#0f172a",
                    }}
                  />
                </div>
              </div>

              {/* Policy note */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#1e40af",
                  marginBottom: 20,
                  lineHeight: 1.45,
                }}
              >
                ℹ️ <strong>नोट:</strong> खाता बनते ही यह सत्यापनकर्ता सक्रिय (Active) रहेगा तथा इस अस्पताल के लिए नागरिक पोर्टल पर जन्म निबंधन आवेदन प्रस्तुत किए जा सकेंगे।
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={newVerifierLoading}
                  onClick={() => setShowNewVerifierModal(false)}
                  style={{
                    padding: "10px 18px",
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={newVerifierLoading}
                  style={{
                    padding: "10px 22px",
                    background: newVerifierLoading ? "#93c5fd" : "#1e40af",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: newVerifierLoading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {newVerifierLoading ? "Creating..." : "सत्यापनकर्ता पंजीकृत करें (Create Verifier)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET VERIFIER PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showResetPasswordModal && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget && !resetPasswordLoading) setShowResetPasswordModal(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Reset Password (पासवर्ड बदलें)
              </h3>
              <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>
                Username: <strong style={{ color: "#1e40af" }}>{showResetPasswordModal.username}</strong> ({showResetPasswordModal.facility})
              </p>
            </div>

            <form onSubmit={handleResetPassword} style={{ padding: "18px 20px" }}>
              {resetPasswordError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#dc2626",
                    fontSize: 12.5,
                    marginBottom: 14,
                  }}
                >
                  ⚠️ {resetPasswordError}
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  New Password (नया पासवर्ड) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13.5,
                    color: "#0f172a",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={resetPasswordLoading}
                  onClick={() => setShowResetPasswordModal(null)}
                  style={{
                    padding: "9px 16px",
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordLoading || !resetPasswordVal.trim()}
                  style={{
                    padding: "9px 18px",
                    background: resetPasswordLoading ? "#93c5fd" : "#1e40af",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: resetPasswordLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {resetPasswordLoading ? "Saving..." : "Save New Password (अपडेट करें)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM TOGGLE ACTIVE/INACTIVE MODAL */}
      {/* ========================================================================= */}
      {confirmToggleModal && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget && !toggleLoadingId) setConfirmToggleModal(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1250,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 18,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: confirmToggleModal.isActive ? "#fef2f2" : "#f0fdf4",
                borderBottom: `1px solid ${confirmToggleModal.isActive ? "#fecaca" : "#bbf7d0"}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {confirmToggleModal.isActive ? (
                <AlertTriangle size={22} color="#dc2626" />
              ) : (
                <CheckCircle2 size={22} color="#16a34a" />
              )}
              <h3 style={{ fontSize: 16, fontWeight: 800, color: confirmToggleModal.isActive ? "#991b1b" : "#166534", margin: 0 }}>
                {confirmToggleModal.isActive
                  ? "सत्यापनकर्ता को निष्क्रिय करें? (Deactivate Verifier?)"
                  : "सत्यापनकर्ता को पुनः सक्रिय करें? (Activate Verifier?)"}
              </h3>
            </div>

            <div style={{ padding: "20px" }}>
              <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.6, margin: "0 0 16px" }}>
                {confirmToggleModal.isActive ? (
                  <>
                    क्या आप सुनिश्चित हैं कि आप <strong>{confirmToggleModal.username}</strong> (
                    <em>{confirmToggleModal.facility}</em>) को निष्क्रिय (Inactive) करना चाहते हैं?
                  </>
                ) : (
                  <>
                    क्या आप <strong>{confirmToggleModal.username}</strong> (
                    <em>{confirmToggleModal.facility}</em>) को पुनः सक्रिय (Active) करना चाहते हैं?
                  </>
                )}
              </p>

              <div
                style={{
                  background: confirmToggleModal.isActive ? "#fffbeb" : "#eff6ff",
                  border: `1px solid ${confirmToggleModal.isActive ? "#fde68a" : "#bfdbfe"}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 12.5,
                  color: confirmToggleModal.isActive ? "#92400e" : "#1e40af",
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                {confirmToggleModal.isActive ? (
                  <>
                    ⚠️ <strong>प्रभाव (Impact):</strong>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                      <li>यह सत्यापनकर्ता तुरंत लॉग आउट हो जाएगा और पुनः लॉगिन नहीं कर सकेगा।</li>
                      <li>
                        नागरिक पोर्टल पर <strong>{confirmToggleModal.facility}</strong> के लिए नए जन्म प्रमाण पत्र आवेदन अवरुद्ध (Blocked) हो जाएँगे।
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    ✓ <strong>प्रभाव (Impact):</strong>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                      <li>सत्यापनकर्ता तुरंत अपने डैशबोर्ड में लॉगिन कर सकेंगे।</li>
                      <li>इस अस्पताल के लिए नए आवेदन पुनः स्वीकार किए जाने लगेंगे।</li>
                    </ul>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={toggleLoadingId !== null}
                  onClick={() => setConfirmToggleModal(null)}
                  style={{
                    padding: "10px 16px",
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="button"
                  disabled={toggleLoadingId !== null}
                  onClick={() => handleToggleVerifierStatus(confirmToggleModal)}
                  style={{
                    padding: "10px 18px",
                    background: confirmToggleModal.isActive ? "#dc2626" : "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {toggleLoadingId ? "Processing..." : confirmToggleModal.isActive ? "हाँ, निष्क्रिय करें (Deactivate)" : "हाँ, सक्रिय करें (Activate)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
