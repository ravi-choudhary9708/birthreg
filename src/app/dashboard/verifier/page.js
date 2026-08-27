"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS = {
  PENDING_VERIFIER: { bg: "#fffbeb", color: "#d97706", label: "Pending Verification" },
  REJECTED_BY_VERIFIER: { bg: "#fef2f2", color: "#dc2626", label: "Rejected" },
  PENDING_OPERATOR: { bg: "#eff6ff", color: "#2563eb", label: "Verified & Forwarded" },
  APPLIED_ON_CSC: { bg: "#f5f3ff", color: "#7c3aed", label: "Applied on CSC" },
  COMPLETED: { bg: "#f0fdf4", color: "#16a34a", label: "Certificate Ready" },
  REJECTED_BY_OPERATOR: { bg: "#fef2f2", color: "#dc2626", label: "Rejected by Operator" },
};

export default function VerifierDashboard() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [viewingApp, setViewingApp] = useState(null);
  
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      if (res.status === 401) { router.push("/login"); return; }
      if (!data.success) throw new Error(data.message);
      setApps(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleAction = async (id, action, remarksText = "") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks: remarksText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowRejectModal(null);
      setViewingApp(null);
      setRemarks("");
      await fetchApps();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const pendingCount = apps.filter(a => a.status === "PENDING_VERIFIER").length;
  const verifiedCount = apps.filter(a => a.status !== "PENDING_VERIFIER" && a.status !== "REJECTED_BY_VERIFIER").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Top Nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, background: "#1e40af", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 16 }}>📋</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Verifier Dashboard</span>
              <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>Birth Certificate Portal</span>
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

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Facility Applications</h1>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Review and verify birth certificate applications (sorted oldest first)</p>
          </div>
          <button onClick={fetchApps} style={{
            padding: "8px 16px", background: "white", border: "1px solid #e5e7eb",
            borderRadius: 8, color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "20px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#d97706" }}>{pendingCount}</p>
            <p style={{ fontSize: 13, color: "#b45309", marginTop: 4, fontWeight: 600 }}>Pending Action</p>
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "20px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>{verifiedCount}</p>
            <p style={{ fontSize: 13, color: "#1d4ed8", marginTop: 4, fontWeight: 600 }}>Verified & Applied</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: "#bfdbfe", borderTopColor: "#1e40af", margin: "0 auto 12px" }} />
            <p style={{ color: "#6b7280" }}>Loading applications...</p>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 24, color: "#dc2626" }}>
            ⚠️ {error}
          </div>
        ) : apps.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>All Clear!</h3>
            <p style={{ color: "#6b7280" }}>No applications are available for your facility.</p>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {["App. No.", "Child Name", "Applicant", "Date", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app, i) => {
                    const sc = STATUS_COLORS[app.status] || { bg: "#f3f4f6", color: "#374151", label: app.status };
                    const isPending = app.status === "PENDING_VERIFIER";
                    
                    return (
                      <tr key={app._id} style={{ borderBottom: i < apps.length - 1 ? "1px solid #f3f4f6" : "none", opacity: isPending ? 1 : 0.6 }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e40af", fontSize: 13 }}>{app.applicationNumber}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, color: "#111827" }}>{app.child?.name || "—"}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{app.informationProvider?.name || "—"}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#9ca3af" }}>
                          {new Date(app.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 100,
                            background: sc.bg, color: sc.color,
                            fontSize: 12, fontWeight: 600,
                          }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setViewingApp(app)}
                              style={{
                                padding: "6px 14px", background: "#f3f4f6", color: "#374151",
                                border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                              }}>
                              👁️ View Details
                            </button>
                            {isPending && (
                              <button
                                onClick={() => handleAction(app._id, "approve")}
                                disabled={actionLoading}
                                style={{
                                  padding: "6px 14px", background: "#16a34a", color: "white",
                                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                  cursor: actionLoading ? "not-allowed" : "pointer",
                                }}>
                                ✓ Approve
                              </button>
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

      {/* View Full Application Modal */}
      {viewingApp && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 24,
        }}>
          <div style={{
            background: "white", borderRadius: 16, width: "100%", maxWidth: 800,
            maxHeight: "90vh", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>Application Details</h3>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 0" }}>{viewingApp.applicationNumber} - {new Date(viewingApp.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <button onClick={() => setViewingApp(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              {/* Child Details */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Child Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Name:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.name}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Gender:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.gender}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Date of Birth:</span> <p style={{ fontWeight: 600, margin: 0 }}>{new Date(viewingApp.child.dateOfBirth).toLocaleDateString("en-IN")}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Weight (kg):</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.weight || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Place of Birth:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.child.placeOfBirth}</p></div>
                </div>
                {viewingApp.child.birthPlaceAddress && (
                  <div style={{ marginTop: 12, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Birth Place Address</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {viewingApp.child.birthPlaceAddress.plotNumber ? viewingApp.child.birthPlaceAddress.plotNumber + ", " : ""}
                      {viewingApp.child.birthPlaceAddress.village}, Ward {viewingApp.child.birthPlaceAddress.wardNumber}, 
                      {viewingApp.child.birthPlaceAddress.subDistrict}, {viewingApp.child.birthPlaceAddress.district}, 
                      {viewingApp.child.birthPlaceAddress.state} - {viewingApp.child.birthPlaceAddress.pinCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Parents Details */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Parents Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginTop: 16 }}>
                  {viewingApp.parents.address && (
                    <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                      <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Current Address</p>
                      <p style={{ margin: 0, fontSize: 13 }}>
                        {viewingApp.parents.address.plotNumber ? viewingApp.parents.address.plotNumber + ", " : ""}
                        {viewingApp.parents.address.village}, Ward {viewingApp.parents.address.wardNumber}, 
                        {viewingApp.parents.address.subDistrict}, {viewingApp.parents.address.district}, 
                        {viewingApp.parents.address.state} - {viewingApp.parents.address.pinCode}
                      </p>
                    </div>
                  )}
                  {viewingApp.parents.permanentAddress && (
                    <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                      <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Permanent Address</p>
                      <p style={{ margin: 0, fontSize: 13 }}>
                        {viewingApp.parents.permanentAddress.plotNumber ? viewingApp.parents.permanentAddress.plotNumber + ", " : ""}
                        {viewingApp.parents.permanentAddress.village}, Ward {viewingApp.parents.permanentAddress.wardNumber}, 
                        {viewingApp.parents.permanentAddress.subDistrict}, {viewingApp.parents.permanentAddress.district}, 
                        {viewingApp.parents.permanentAddress.state} - {viewingApp.parents.permanentAddress.pinCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Provider Details */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Information Provider</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Name:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.name}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Relation:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.relation}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Aadhaar:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.adharNumber || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mobile:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.mobileNumber}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Email:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.email || "—"}</p></div>
                </div>
                {viewingApp.informationProvider.informaionProviderAddress && (
                  <div style={{ marginTop: 12, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Provider Address</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {viewingApp.informationProvider.informaionProviderAddress.plotNumber ? viewingApp.informationProvider.informaionProviderAddress.plotNumber + ", " : ""}
                      {viewingApp.informationProvider.informaionProviderAddress.village}, Ward {viewingApp.informationProvider.informaionProviderAddress.wardNumber}, 
                      {viewingApp.informationProvider.informaionProviderAddress.subDistrict}, {viewingApp.informationProvider.informaionProviderAddress.district}, 
                      {viewingApp.informationProvider.informaionProviderAddress.state} - {viewingApp.informationProvider.informaionProviderAddress.pinCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Statistical/Demographic Details */}
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1e40af", marginBottom: 12, borderBottom: "1px solid #bfdbfe", paddingBottom: 4 }}>Demographic Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother's Religion:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherReligion || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Father's Religion:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.fatherReligion || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother's Literacy:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherLiteracy || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Father's Literacy:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.fatherLiteracy || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother's Profession:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherProfession || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Father's Profession:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.fatherProfession || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother's Age at Marriage:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherAgeAtMirrage || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Mother's Age at Birth:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherAgeAtChildBirth || "—"}</p></div>
                  <div><span style={{ color: "#6b7280", fontSize: 13 }}>Number of Children:</span> <p style={{ fontWeight: 600, margin: 0 }}>{viewingApp.informationProvider.motherChildNumber || "—"}</p></div>
                </div>
                {viewingApp.informationProvider.motherAddress && (
                  <div style={{ marginTop: 12, background: "#f9fafb", padding: 12, borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 8px", fontSize: 13 }}>Mother's Address (At time of birth)</p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {viewingApp.informationProvider.motherAddress.city}, {viewingApp.informationProvider.motherAddress.subDistrict}, 
                      {viewingApp.informationProvider.motherAddress.district}, {viewingApp.informationProvider.motherAddress.state} - {viewingApp.informationProvider.motherAddress.pinCode}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", background: "#f9fafb", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Status: <span style={{ color: STATUS_COLORS[viewingApp.status]?.color || "#000" }}>{STATUS_COLORS[viewingApp.status]?.label || viewingApp.status}</span></span>
              
              {viewingApp.status === "PENDING_VERIFIER" ? (
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setShowRejectModal(viewingApp._id)} style={{
                    padding: "8px 16px", background: "white", border: "1px solid #fca5a5",
                    borderRadius: 8, color: "#dc2626", fontWeight: 600, cursor: "pointer"
                  }}>
                    Reject
                  </button>
                  <button onClick={() => handleAction(viewingApp._id, "approve")} disabled={actionLoading} style={{
                    padding: "8px 24px", background: "#16a34a", border: "none",
                    borderRadius: 8, color: "white", fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer"
                  }}>
                    {actionLoading ? "Processing..." : "Approve"}
                  </button>
                </div>
              ) : (
                <button onClick={() => setViewingApp(null)} style={{
                  padding: "8px 24px", background: "#e5e7eb", border: "none",
                  borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer"
                }}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 24,
        }}>
          <div style={{
            background: "white", borderRadius: 20, padding: "32px 28px",
            maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Reject Application</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>Please provide a reason for rejection. This will be sent to the applicant via email.</p>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
              style={{
                width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb",
                borderRadius: 8, fontSize: 14, resize: "vertical", color: "#111827",
                marginBottom: 20,
              }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowRejectModal(null); setRemarks(""); }} style={{
                padding: "10px 20px", background: "white", border: "1px solid #e5e7eb",
                borderRadius: 8, color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button
                onClick={() => handleAction(showRejectModal, "reject", remarks)}
                disabled={!remarks.trim() || actionLoading}
                style={{
                  padding: "10px 20px", background: remarks.trim() ? "#dc2626" : "#fca5a5",
                  border: "none", borderRadius: 8, color: "white",
                  fontWeight: 600, fontSize: 14, cursor: remarks.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                {actionLoading && <span className="spinner" style={{ width: 16, height: 16 }} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
