"use client";
import { useState } from "react";
import Link from "next/link";
import { FACILITIES } from "@/utils/constants";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "1.5px solid #e5e7eb", borderRadius: 8,
  fontSize: 14, color: "#111827", background: "white",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#374151", marginBottom: 6,
};

const sectionStyle = {
  background: "white", border: "1px solid #e5e7eb",
  borderRadius: 16, padding: "28px 28px", marginBottom: 24,
};

const sectionHeaderStyle = {
  fontSize: 16, fontWeight: 700, color: "#111827",
  marginBottom: 20, paddingBottom: 12,
  borderBottom: "1px solid #f3f4f6",
  display: "flex", alignItems: "center", gap: 10,
};

function Field({ label, required, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</label>
      {children}
    </div>
  );
}

function Grid({ children, cols = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  );
}

export default function ApplyPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    facility: "",
    child: {
      name: "", dateOfBirth: "", gender: "",
      placeOfBirth: "",
    },
    birthPlaceAddress: {
      plotNumber: "", village: "", wardNumber: "",
      subDistrict: "", district: "Madhubani", state: "Bihar", pinCode: "",
    },
    mother: {
      name: "", adharNumber: "", mobileNumber: "", email: "",
    },
    father: {
      name: "", adharNumber: "", mobileNumber: "", email: "",
    },
    address: {
      plotNumber: "", village: "", wardNumber: "",
      subDistrict: "", district: "Madhubani", state: "Bihar", pinCode: "",
    },
    permanentAddress: {
      plotNumber: "", village: "", wardNumber: "",
      subDistrict: "", district: "Madhubani", state: "Bihar", pinCode: "",
    },
    sameAddress: false,
    informationProvider: {
      name: "", adharNumber: "", mobileNumber: "", email: "",
      motherReligion: "", fatherReligion: "", motherLiteracy: "",
      fatherLiteracy: "", motherProfession: "", fatherProfession: "",
      motherAgeAtMirrage: "", motherAgeAtChildBirth: "", motherChildNumber: "",
    },
  });

  const update = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build payload matching application model
      const pAddress = form.sameAddress ? form.address : form.permanentAddress;
      const payload = {
        facility: form.facility,
        child: {
          name: form.child.name,
          dateOfBirth: form.child.dateOfBirth,
          gender: form.child.gender,
          placeOfBirth: form.child.placeOfBirth,
          birthPlaceAddress: form.birthPlaceAddress,
        },
        parents: {
          mother: form.mother,
          father: form.father,
          address: form.address,
          permanentAddress: pAddress,
        },
        informationProvider: {
          name: form.informationProvider.name,
          adharNumber: form.informationProvider.adharNumber,
          mobileNumber: form.informationProvider.mobileNumber,
          email: form.informationProvider.email,
          providedInformation: true,
          informaionProviderAddress: form.address,
          motherAddress: {
            city: form.address.village,
            subDistrict: form.address.subDistrict,
            district: form.address.district,
            state: form.address.state,
            pinCode: form.address.pinCode,
          },
          motherReligion: form.informationProvider.motherReligion,
          fatherReligion: form.informationProvider.fatherReligion,
          motherLiteracy: form.informationProvider.motherLiteracy,
          fatherLiteracy: form.informationProvider.fatherLiteracy,
          motherProfession: form.informationProvider.motherProfession,
          fatherProfession: form.informationProvider.fatherProfession,
          motherAgeAtMirrage: Number(form.informationProvider.motherAgeAtMirrage) || undefined,
          motherAgeAtChildBirth: Number(form.informationProvider.motherAgeAtChildBirth) || undefined,
          motherChildNumber: Number(form.informationProvider.motherChildNumber) || undefined,
        },
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message);
      setSuccess(data.data.applicationNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          background: "white", border: "1px solid #e5e7eb", borderRadius: 20,
          padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center",
        }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Application Submitted!</h2>
          <p style={{ color: "#6b7280", marginBottom: 28 }}>
            Your application has been received. Please save your Application Number — you'll need it to track your status.
          </p>
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12,
            padding: "20px 24px", marginBottom: 28,
          }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>APPLICATION NUMBER</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#1e40af", letterSpacing: 3 }}>{success}</p>
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>
            A confirmation email has been sent with your application number.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/track/${success}`} style={{
              padding: "12px 24px", background: "#1e40af", color: "white",
              borderRadius: 8, fontWeight: 600, fontSize: 14,
            }}>
              Track Application →
            </Link>
            <Link href="/" style={{
              padding: "12px 24px", background: "white", color: "#374151",
              border: "1px solid #e5e7eb", borderRadius: 8, fontWeight: 600, fontSize: 14,
            }}>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: "#6b7280", fontSize: 13 }}>← Home</Link>
          <span style={{ color: "#e5e7eb" }}>|</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Birth Certificate Application</h1>
            <p style={{ fontSize: 12, color: "#6b7280" }}>Fill in all required details carefully</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

        {/* Facility Selection */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ background: "#1e40af", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>1</span>
            Select Facility
          </div>
          <Field label="Hospital / PHC Where Child Was Born" required>
            <select style={inputStyle} value={form.facility} onChange={e => setForm(p => ({ ...p, facility: e.target.value }))} required>
              <option value="">— Select Facility —</option>
              {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </div>

        {/* Child Info */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ background: "#1e40af", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>2</span>
            Child's Information
          </div>
          <Grid>
            <Field label="Child's Name" required>
              <input style={inputStyle} placeholder="Full name" value={form.child.name} onChange={e => update("child", "name", e.target.value)} required />
            </Field>
            <Field label="Date of Birth" required>
              <input type="date" style={inputStyle} value={form.child.dateOfBirth} onChange={e => update("child", "dateOfBirth", e.target.value)} required />
            </Field>
            <Field label="Gender" required>
              <select style={inputStyle} value={form.child.gender} onChange={e => update("child", "gender", e.target.value)} required>
                <option value="">— Select —</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
            <Field label="Place of Birth" required>
              <select style={inputStyle} value={form.child.placeOfBirth} onChange={e => update("child", "placeOfBirth", e.target.value)} required>
                <option value="">— Select —</option>
                <option>Hospital</option><option>Home</option><option>Other</option>
              </select>
            </Field>
          </Grid>
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Birth Place Address</p>
            <Grid>
              <Field label="Village / City" required>
                <input style={inputStyle} value={form.birthPlaceAddress.village} onChange={e => update("birthPlaceAddress", "village", e.target.value)} required />
              </Field>
              <Field label="Sub-District" required>
                <input style={inputStyle} value={form.birthPlaceAddress.subDistrict} onChange={e => update("birthPlaceAddress", "subDistrict", e.target.value)} required />
              </Field>
              <Field label="District" required>
                <input style={inputStyle} value={form.birthPlaceAddress.district} onChange={e => update("birthPlaceAddress", "district", e.target.value)} required />
              </Field>
              <Field label="Pin Code" required>
                <input style={inputStyle} placeholder="845xxx" value={form.birthPlaceAddress.pinCode} onChange={e => update("birthPlaceAddress", "pinCode", e.target.value)} required />
              </Field>
            </Grid>
          </div>
        </div>

        {/* Mother's Info */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ background: "#1e40af", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>3</span>
            Mother's Information
          </div>
          <Grid>
            <Field label="Mother's Full Name" required>
              <input style={inputStyle} value={form.mother.name} onChange={e => update("mother", "name", e.target.value)} required />
            </Field>
            <Field label="Mobile Number" required>
              <input style={inputStyle} placeholder="10-digit number" value={form.mother.mobileNumber} onChange={e => update("mother", "mobileNumber", e.target.value)} required />
            </Field>
            <Field label="Aadhaar Number">
              <input style={inputStyle} placeholder="12-digit Aadhaar" value={form.mother.adharNumber} onChange={e => update("mother", "adharNumber", e.target.value)} />
            </Field>
            <Field label="Email Address">
              <input type="email" style={inputStyle} value={form.mother.email} onChange={e => update("mother", "email", e.target.value)} />
            </Field>
          </Grid>
        </div>

        {/* Father's Info */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ background: "#1e40af", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>4</span>
            Father's Information
          </div>
          <Grid>
            <Field label="Father's Full Name" required>
              <input style={inputStyle} value={form.father.name} onChange={e => update("father", "name", e.target.value)} required />
            </Field>
            <Field label="Mobile Number" required>
              <input style={inputStyle} placeholder="10-digit number" value={form.father.mobileNumber} onChange={e => update("father", "mobileNumber", e.target.value)} required />
            </Field>
            <Field label="Aadhaar Number">
              <input style={inputStyle} value={form.father.adharNumber} onChange={e => update("father", "adharNumber", e.target.value)} />
            </Field>
            <Field label="Email Address">
              <input type="email" style={inputStyle} value={form.father.email} onChange={e => update("father", "email", e.target.value)} />
            </Field>
          </Grid>
        </div>

        {/* Current Address */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ background: "#1e40af", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>5</span>
            Parents' Current Address
          </div>
          <Grid>
            <Field label="Plot / House Number">
              <input style={inputStyle} value={form.address.plotNumber} onChange={e => update("address", "plotNumber", e.target.value)} />
            </Field>
            <Field label="Village / City" required>
              <input style={inputStyle} value={form.address.village} onChange={e => update("address", "village", e.target.value)} required />
            </Field>
            <Field label="Ward Number">
              <input style={inputStyle} value={form.address.wardNumber} onChange={e => update("address", "wardNumber", e.target.value)} />
            </Field>
            <Field label="Sub-District" required>
              <input style={inputStyle} value={form.address.subDistrict} onChange={e => update("address", "subDistrict", e.target.value)} required />
            </Field>
            <Field label="District" required>
              <input style={inputStyle} value={form.address.district} onChange={e => update("address", "district", e.target.value)} required />
            </Field>
            <Field label="State" required>
              <input style={inputStyle} value={form.address.state} onChange={e => update("address", "state", e.target.value)} required />
            </Field>
            <Field label="Pin Code" required>
              <input style={inputStyle} value={form.address.pinCode} onChange={e => update("address", "pinCode", e.target.value)} required />
            </Field>
          </Grid>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.sameAddress} onChange={e => setForm(p => ({ ...p, sameAddress: e.target.checked }))} />
              <span style={{ fontSize: 13, color: "#374151" }}>Permanent address is same as current address</span>
            </label>
          </div>
        </div>

        {/* Permanent Address */}
        {!form.sameAddress && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={{ background: "#1e40af", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>6</span>
              Permanent Address
            </div>
            <Grid>
              <Field label="Village / City" required>
                <input style={inputStyle} value={form.permanentAddress.village} onChange={e => update("permanentAddress", "village", e.target.value)} required={!form.sameAddress} />
              </Field>
              <Field label="Sub-District" required>
                <input style={inputStyle} value={form.permanentAddress.subDistrict} onChange={e => update("permanentAddress", "subDistrict", e.target.value)} required={!form.sameAddress} />
              </Field>
              <Field label="District" required>
                <input style={inputStyle} value={form.permanentAddress.district} onChange={e => update("permanentAddress", "district", e.target.value)} required={!form.sameAddress} />
              </Field>
              <Field label="Pin Code" required>
                <input style={inputStyle} value={form.permanentAddress.pinCode} onChange={e => update("permanentAddress", "pinCode", e.target.value)} required={!form.sameAddress} />
              </Field>
            </Grid>
          </div>
        )}

        {/* Information Provider */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ background: "#1e40af", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{form.sameAddress ? "6" : "7"}</span>
            Information Provider Details
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>(Person filling this form)</span>
          </div>
          <Grid>
            <Field label="Full Name" required>
              <input style={inputStyle} value={form.informationProvider.name} onChange={e => update("informationProvider", "name", e.target.value)} required />
            </Field>
            <Field label="Mobile Number" required>
              <input style={inputStyle} value={form.informationProvider.mobileNumber} onChange={e => update("informationProvider", "mobileNumber", e.target.value)} required />
            </Field>
            <Field label="Email Address (for notifications)" required>
              <input type="email" style={inputStyle} value={form.informationProvider.email} onChange={e => update("informationProvider", "email", e.target.value)} required />
            </Field>
            <Field label="Aadhaar Number">
              <input style={inputStyle} value={form.informationProvider.adharNumber} onChange={e => update("informationProvider", "adharNumber", e.target.value)} />
            </Field>
            <Field label="Mother's Religion" required>
              <input style={inputStyle} placeholder="e.g. Hindu" value={form.informationProvider.motherReligion} onChange={e => update("informationProvider", "motherReligion", e.target.value)} required />
            </Field>
            <Field label="Father's Religion" required>
              <input style={inputStyle} placeholder="e.g. Hindu" value={form.informationProvider.fatherReligion} onChange={e => update("informationProvider", "fatherReligion", e.target.value)} required />
            </Field>
            <Field label="Mother's Education">
              <input style={inputStyle} placeholder="e.g. Graduate" value={form.informationProvider.motherLiteracy} onChange={e => update("informationProvider", "motherLiteracy", e.target.value)} />
            </Field>
            <Field label="Father's Education">
              <input style={inputStyle} placeholder="e.g. Graduate" value={form.informationProvider.fatherLiteracy} onChange={e => update("informationProvider", "fatherLiteracy", e.target.value)} />
            </Field>
            <Field label="Mother's Profession">
              <input style={inputStyle} value={form.informationProvider.motherProfession} onChange={e => update("informationProvider", "motherProfession", e.target.value)} />
            </Field>
            <Field label="Father's Profession">
              <input style={inputStyle} value={form.informationProvider.fatherProfession} onChange={e => update("informationProvider", "fatherProfession", e.target.value)} />
            </Field>
            <Field label="Mother's Age at Marriage">
              <input type="number" style={inputStyle} min="1" max="60" value={form.informationProvider.motherAgeAtMirrage} onChange={e => update("informationProvider", "motherAgeAtMirrage", e.target.value)} />
            </Field>
            <Field label="Mother's Age at Child Birth">
              <input type="number" style={inputStyle} min="1" max="60" value={form.informationProvider.motherAgeAtChildBirth} onChange={e => update("informationProvider", "motherAgeAtChildBirth", e.target.value)} />
            </Field>
            <Field label="Mother's Child Number (This Child)">
              <input type="number" style={inputStyle} min="1" max="20" value={form.informationProvider.motherChildNumber} onChange={e => update("informationProvider", "motherChildNumber", e.target.value)} />
            </Field>
          </Grid>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            padding: "14px 18px", marginBottom: 20, color: "#dc2626", fontSize: 14,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Link href="/" style={{
            padding: "12px 24px", background: "white", color: "#374151",
            border: "1px solid #e5e7eb", borderRadius: 8, fontWeight: 600, fontSize: 14,
          }}>
            Cancel
          </Link>
          <button type="submit" disabled={loading} style={{
            padding: "12px 32px", background: loading ? "#93c5fd" : "#1e40af",
            color: "white", border: "none", borderRadius: 8, fontWeight: 700,
            fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 2px 8px rgba(30,64,175,0.3)",
          }}>
            {loading && <span className="spinner" />}
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
