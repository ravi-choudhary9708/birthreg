"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS = {
  PENDING_OPERATOR: { label: "Pending Action", color: "#2563eb", bg: "#eff6ff" },
  APPLIED_ON_CSC: { label: "Applied on CSC", color: "#7c3aed", bg: "#f5f3ff" },
  COMPLETED: { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
  REJECTED_BY_OPERATOR: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
};

export default function OperatorDashboard() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores app id being processed
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(null);
  const [viewingApp, setViewingApp] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
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

  const handleApplyCSC = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}/operate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_csc" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchApps();
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
  const csc = apps.filter(a => a.status === "APPLIED_ON_CSC").length;
  const completed = apps.filter(a => a.status === "COMPLETED").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Nav */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, background: "#7c3aed", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 16 }}>⚙️</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Operator Dashboard</span>
              <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>Central Operations</span>
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Application Queue</h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Manage verified applications — apply on CSC portal and upload certificates</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Pending Action", value: pending, color: "#2563eb", bg: "#eff6ff" },
            { label: "Applied on CSC", value: csc, color: "#7c3aed", bg: "#f5f3ff" },
            { label: "Completed", value: completed, color: "#16a34a", bg: "#f0fdf4" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.bg}`, borderRadius: 12, padding: "20px 20px" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: "#ddd6fe", borderTopColor: "#7c3aed", margin: "0 auto 12px" }} />
            <p style={{ color: "#6b7280" }}>Loading...</p>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 24, color: "#dc2626" }}>{error}</div>
        ) : apps.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 36 }}>📭</p>
            <h3 style={{ fontWeight: 700, color: "#111827", margin: "12px 0 8px" }}>No Applications Yet</h3>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Verified applications from facilities will appear here.</p>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {["App. No.", "Child Name", "Applicant", "Facility", "Status", "Date", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app, i) => {
                    const sc = STATUS_LABELS[app.status] || { label: app.status, color: "#374151", bg: "#f3f4f6" };
                    const isLoading = actionLoading === app._id;
                    return (
                      <tr key={app._id} style={{ borderBottom: i < apps.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#7c3aed", fontSize: 13 }}>{app.applicationNumber}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, color: "#111827" }}>{app.child?.name || "—"}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{app.informationProvider?.name || "—"}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>{app.facility}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 100,
                            background: sc.bg, color: sc.color,
                            fontSize: 12, fontWeight: 600,
                          }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#9ca3af" }}>
                          {new Date(app.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              onClick={() => setViewingApp(app)}
                              style={{
                                padding: "6px 14px", background: "#f3f4f6", color: "#374151",
                                border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                              }}>
                              👁️ View Details
                            </button>
                            {app.status === "PENDING_OPERATOR" && (
                              <>
                                <button
                                  onClick={() => handleApplyCSC(app._id)}
                                  disabled={isLoading}
                                  style={{
                                    padding: "6px 12px", background: "#7c3aed", color: "white",
                                    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", gap: 6,
                                  }}>
                                  {isLoading && <span className="spinner" style={{ width: 12, height: 12 }} />}
                                  🖥️ Apply CSC
                                </button>
                                <button
                                  onClick={() => setShowRejectModal(app._id)}
                                  style={{
                                    padding: "6px 12px", background: "white", color: "#dc2626",
                                    border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                  }}>
                                  ✗ Reject
                                </button>
                              </>
                            )}
                            {app.status === "APPLIED_ON_CSC" && (
                              <button
                                onClick={() => setShowUploadModal(app._id)}
                                style={{
                                  padding: "6px 14px", background: "#16a34a", color: "white",
                                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                }}>
                                ⬆️ Upload Certificate
                              </button>
                            )}
                            {app.status === "COMPLETED" && (
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Done</span>
                                <button
                                  onClick={() => setShowUploadModal(app._id)}
                                  style={{
                                    padding: "4px 10px", background: "white", color: "#16a34a",
                                    border: "1px solid #16a34a", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                                  }}>
                                  Re-upload
                                </button>
                              </div>
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
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }}>
          <div style={{ background: "white", borderRadius: 20, padding: "32px 28px", maxWidth: 460, width: "100%" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Reject Application</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This reason will be emailed to the applicant.</p>
            <textarea
              value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="Enter reason..." rows={4}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, resize: "vertical", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowRejectModal(null); setRemarks(""); }}
                style={{ padding: "10px 20px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={!remarks.trim()}
                style={{ padding: "10px 20px", background: remarks.trim() ? "#dc2626" : "#fca5a5", border: "none", borderRadius: 8, color: "white", fontWeight: 600, cursor: remarks.trim() ? "pointer" : "not-allowed" }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        }}>
          <div style={{ background: "white", borderRadius: 20, padding: "32px 28px", maxWidth: 460, width: "100%" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Upload Certificate</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              Upload the certificate generated from the CSC portal. The parent will be notified automatically.
            </p>
            <div style={{
              border: "2px dashed #e5e7eb", borderRadius: 12, padding: 32,
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
                <p style={{ fontSize: 14, color: uploadFile ? "#16a34a" : "#6b7280", fontWeight: 500 }}>
                  {uploadFile ? uploadFile.name : "Click to select PDF or Image"}
                </p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Supported: PDF, JPG, PNG</p>
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowUploadModal(null); setUploadFile(null); }}
                style={{ padding: "10px 20px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleUpload} disabled={!uploadFile || actionLoading}
                style={{
                  padding: "10px 20px",
                  background: uploadFile ? "#16a34a" : "#9ca3af",
                  border: "none", borderRadius: 8, color: "white", fontWeight: 600,
                  cursor: uploadFile ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                {actionLoading && <span className="spinner" style={{ width: 16, height: 16 }} />}
                {actionLoading ? "Uploading..." : "⬆️ Upload & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
