"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FACILITIES } from "@/utils/constants";
import DynamicDatePicker from "@/components/DynamicDatePicker";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 14,
  color: "#111827",
  background: "white",
  minHeight: 44,
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const hintStyle = {
  fontSize: 11,
  color: "#6b7280",
  marginTop: 4,
};

const sectionStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "clamp(18px, 4vw, 28px)",
  marginBottom: 20,
};

const sectionHeaderStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 20,
  paddingBottom: 12,
  borderBottom: "1px solid #f3f4f6",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  );
}

function Grid({ children, cols = 2 }) {
  return (
    <div className={cols === 4 ? "resp-grid-4" : "resp-grid-2"}>
      {children}
    </div>
  );
}

const RELIGIONS = [
  "Hindu (हिन्दू)",
  "Muslim (मुस्लिम)",
  "Christian (ईसाई)",
  "Sikh (सिख)",
  "Buddhist (बौद्ध)",
  "Jain (जैन)",
  "Other (अन्य)",
];

const DELIVERY_ATTENTION_OPTIONS = [
  "Institutional - Government (संस्थागत-सरकारी)",
  "Institutional - Private (संस्थागत-निजी या गैर सरकारी)",
  "Doctor, Nurse or Trained Midwife (डॉक्टर, नर्स या प्रशिक्षित दाई)",
  "Traditional Birth Attendant (पारम्परिक प्रसाविका)",
  "Relatives or Others (रिश्तेदार या अन्य)",
];

const DELIVERY_METHOD_OPTIONS = [
  "Natural / Normal (प्राकृतिक)",
  "Caesarean / C-Section (शल्य क्रिया)",
  "Forceps / Vacuum (यांत्रिक निष्कर्षण / वैक्यूम)",
];

const RELATION_OPTIONS = [
  "Father (पिता)",
  "Mother (माता)",
  "Guardian / Relative (अभिभावक / रिश्तेदार)",
  "Hospital Authority (अस्पताल / संस्थान प्रभारी)",
  "Other (अन्य)",
];

function ApplyFormContent({ facParam }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (success) {
        gsap.from(".anim-success-card", {
          scale: 0.94,
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "back.out(1.5)",
        });
      } else {
        gsap.from(".anim-apply-header", {
          y: -15,
          opacity: 0,
          duration: 0.5,
        });

        gsap.utils.toArray(".anim-apply-section").forEach((sec) => {
          gsap.from(sec, {
            scrollTrigger: {
              trigger: sec,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
            y: 22,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
          });
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [success]);

  const [form, setForm] = useState(() => {
    let initialFacility = "";
    if (facParam) {
      const decoded = decodeURIComponent(facParam).trim();
      const matched = FACILITIES.find(
        (f) => f.trim().toLowerCase() === decoded.toLowerCase()
      );
      if (matched) {
        initialFacility = matched;
      }
    }
    return {
      facility: initialFacility,
      child: {
        name: "",
        dateOfBirth: "",
        gender: "",
        adharNumber: "",
        weight: "",
        deliveryAttention: "Institutional - Government (संस्थागत-सरकारी)",
        deliveryMethod: "Natural / Normal (प्राकृतिक)",
        pregnancyDuration: "",
        placeOfBirth: initialFacility ? "Hospital" : "Hospital",
      },
      birthPlaceAddress: {
        plotNumber: "",
        mohalla: "",
        village: "",
        wardNumber: "",
        subDistrict: "",
        district: "Madhubani",
        state: "Bihar",
        pinCode: "",
      },
      mother: {
        name: "",
        adharNumber: "",
        mobileNumber: "",
        email: "",
      },
      father: {
        name: "",
        adharNumber: "",
        mobileNumber: "",
        email: "",
      },
      address: {
        plotNumber: "",
        mohalla: "",
        village: "",
        wardNumber: "",
        subDistrict: "",
        district: "Madhubani",
        state: "Bihar",
        pinCode: "",
      },
      permanentAddress: {
        plotNumber: "",
        mohalla: "",
        village: "",
        wardNumber: "",
        subDistrict: "",
        district: "Madhubani",
        state: "Bihar",
        pinCode: "",
      },
      sameAddress: true,
      informationProvider: {
        name: "",
        relationToChild: "Father (पिता)",
        adharNumber: "",
        mobileNumber: "",
        email: "",
        motherReligion: "Hindu (हिन्दू)",
        fatherReligion: "Hindu (हिन्दू)",
        motherLiteracy: "",
        fatherLiteracy: "",
        motherProfession: "",
        fatherProfession: "",
        motherAgeAtMirrage: "",
        motherAgeAtChildBirth: "",
        motherChildNumber: "",
        declarationAccepted: false,
      },
    };
  });

  const update = (section, field, value) => {
    setForm((prev) => {
      const updatedSection = { ...prev[section], [field]: value };

      if (section === "informationProvider") {
        return {
          ...prev,
          informationProvider: updatedSection,
        };
      }

      let updatedProvider = prev.informationProvider;

      // Automatically mirror contact details to informant if relation matches
      const rel = prev.informationProvider.relationToChild || "";
      if (
        (section === "father" && rel.startsWith("Father")) ||
        (section === "mother" && rel.startsWith("Mother"))
      ) {
        if (["name", "mobileNumber", "email", "adharNumber"].includes(field)) {
          updatedProvider = {
            ...updatedProvider,
            [field]: value,
          };
        }
      }

      return {
        ...prev,
        [section]: updatedSection,
        informationProvider: updatedProvider,
      };
    });
  };

  const handleRelationChange = (newRelation) => {
    setForm((prev) => {
      let updatedProvider = {
        ...prev.informationProvider,
        relationToChild: newRelation,
      };

      if (newRelation.startsWith("Father")) {
        updatedProvider = {
          ...updatedProvider,
          name: prev.father.name || "",
          mobileNumber: prev.father.mobileNumber || "",
          email: prev.father.email || "",
          adharNumber: prev.father.adharNumber || "",
        };
      } else if (newRelation.startsWith("Mother")) {
        updatedProvider = {
          ...updatedProvider,
          name: prev.mother.name || "",
          mobileNumber: prev.mother.mobileNumber || "",
          email: prev.mother.email || "",
          adharNumber: prev.mother.adharNumber || "",
        };
      }

      return {
        ...prev,
        informationProvider: updatedProvider,
      };
    });
  };

  const handleAadhaarChange = (section, field, value, prevValue = "") => {
    let digits = value.replace(/\D/g, "");
    if (prevValue && value.length < prevValue.length) {
      const prevDigits = prevValue.replace(/\D/g, "");
      if (digits.length === prevDigits.length && digits.length > 0) {
        digits = digits.slice(0, -1);
      }
    }
    digits = digits.slice(0, 12);
    const parts = digits.match(/.{1,4}/g);
    const formatted = parts ? parts.join("-") : "";
    update(section, field, formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const aadhaarPattern = /^\d{4}-\d{4}-\d{4}$/;
    if (!form.mother.adharNumber || !aadhaarPattern.test(form.mother.adharNumber.trim())) {
      setError("माता की 12-अंकों की वैध आधार संख्या (XXXX-XXXX-XXXX) अनिवार्य है। Please enter a valid 12-digit Aadhaar number for Mother.");
      return;
    }
    if (!form.father.adharNumber || !aadhaarPattern.test(form.father.adharNumber.trim())) {
      setError("पिता की 12-अंकों की वैध आधार संख्या (XXXX-XXXX-XXXX) अनिवार्य है। Please enter a valid 12-digit Aadhaar number for Father.");
      return;
    }

    if (!form.child.dateOfBirth) {
      setError("जन्म की तारीख (Date of Birth) अनिवार्य है। Please select Date of Birth.");
      return;
    }

    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (form.child.dateOfBirth > todayLocalStr) {
      setError("जन्म की तारीख भविष्य की नहीं हो सकती (Date of birth cannot be in the future).");
      return;
    }

    if (!form.informationProvider.declarationAccepted) {
      setError("Please check and accept the statutory legal declaration before submitting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pAddress = form.sameAddress ? form.address : form.permanentAddress;
      const payload = {
        facility: form.facility,
        child: {
          name: form.child.name,
          dateOfBirth: form.child.dateOfBirth,
          gender: form.child.gender,
          adharNumber: form.child.adharNumber || undefined,
          weight: form.child.weight ? Number(form.child.weight) : undefined,
          deliveryAttention: form.child.deliveryAttention,
          deliveryMethod: form.child.deliveryMethod,
          pregnancyDuration: form.child.pregnancyDuration ? Number(form.child.pregnancyDuration) : undefined,
          placeOfBirth: form.child.placeOfBirth,
          birthPlaceAddress:
            form.child.placeOfBirth === "Hospital"
              ? {
                  plotNumber: "",
                  mohalla: "",
                  village: form.facility,
                  wardNumber: "",
                  subDistrict: form.address.subDistrict || "Madhubani",
                  district: "Madhubani",
                  state: "Bihar",
                  pinCode: form.address.pinCode || "847211",
                }
              : form.birthPlaceAddress,
        },
        parents: {
          mother: form.mother,
          father: form.father,
          address: form.address,
          permanentAddress: pAddress,
        },
        informationProvider: {
          name: form.informationProvider.name,
          relationToChild: form.informationProvider.relationToChild,
          adharNumber: form.informationProvider.adharNumber,
          mobileNumber: form.informationProvider.mobileNumber,
          email: form.informationProvider.email,
          providedInformation: true,
          declarationAccepted: form.informationProvider.declarationAccepted,
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
      <div
        ref={containerRef}
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          className="anim-success-card"
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: "48px 40px",
            maxWidth: 520,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <Image
            src="/baby_birth.svg"
            alt="Government of Bihar - Madhubani District Emblem"
            width={68}
            height={68}
            style={{
              margin: "0 auto 16px",
              objectFit: "contain",
              display: "block",
            }}
          />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
            Application Submitted Successfully!
          </h2>
          <p style={{ color: "#1e40af", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            प्रारूप संख्या-1 • Form No. 1 (Rule 5) Birth Report Registered
          </p>
          <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 24 }}>
            District Administration Madhubani • Government of Bihar
          </p>
          <p style={{ color: "#4b5563", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Your birth registration report has been received and routed to your facility verifier. Please keep your Application Number safe to track progress.
          </p>
          <div
            style={{
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#1e40af",
                marginBottom: 6,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              APPLICATION TRACKING NUMBER
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#1e40af", letterSpacing: 2 }}>
              {success}
            </p>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>
            A confirmation has been sent to the contact details provided.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={`/track/${success}`}
              style={{
                padding: "12px 24px",
                background: "#1e40af",
                color: "white",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Track Application →
            </Link>
            <Link
              href="/"
              style={{
                padding: "12px 24px",
                background: "white",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
        className="anim-apply-header"
        style={{
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 20px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center" }}>
              <Image
                src="/baby_birth.svg"
                alt="Government of Bihar Logo"
                width={40}
                height={40}
                priority
                loading="eager"
                style={{ objectFit: "contain", flexShrink: 0 }}
              />
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1
                  style={{
                    fontSize: "clamp(15px, 3.5vw, 18px)",
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.2,
                  }}
                >
                  प्रारूप संख्या-1 • जन्म रिपोर्ट (Form No. 1: Birth Report)
                </h1>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "#eff6ff",
                    color: "#1e40af",
                    fontSize: 11,
                    fontWeight: 700,
                    border: "1px solid #bfdbfe",
                  }}
                >
                  नियम 5
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Civil Registration System (CRS) • District Administration Madhubani, Bihar
              </p>
            </div>
          </div>
          <Link
            href="/"
            style={{
              color: "#475569",
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 6,
              background: "#f1f5f9",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 36px) clamp(14px, 3vw, 24px)",
        }}
      >
        {/* Section 1: Facility Selection */}
        <div className="anim-apply-section" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span
              style={{
                background: "#1e40af",
                color: "white",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              1
            </span>
            <span>अस्पताल / स्वास्थ्य केन्द्र का चयन (Select Facility)</span>
          </div>
          <Field
            label="जन्म स्थान का अस्पताल / संस्थान (Hospital / PHC Where Child Was Born)"
            hint="Select the authorized Madhubani healthcare facility where delivery occurred"
            required
          >
            <select
              style={inputStyle}
              value={form.facility}
              onChange={(e) => {
                const fac = e.target.value;
                setForm((p) => ({
                  ...p,
                  facility: fac,
                  child: {
                    ...p.child,
                    placeOfBirth: fac ? "Hospital" : p.child.placeOfBirth,
                  },
                }));
              }}
              required
            >
              <option value="">— Select Authorized Facility (39 Facilities in Madhubani) —</option>
              {FACILITIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Section 2: Child's Information */}
        <div className="anim-apply-section" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span
              style={{
                background: "#1e40af",
                color: "white",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              2
            </span>
            <div>
              <span>शिशु का विवरणी (Child&apos;s Information)</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 8 }}>
                [प्रारूप 1, मद 1, 2, 3 एवं 8]
              </span>
            </div>
          </div>
          <Grid>
            <Field
              label="शिशु का नाम (Child's Name)"
              hint="यदि नामकरण नहीं किया गया हो, तो खाली छोड़ सकते हैं"
              required
            >
              <input
                style={inputStyle}
                placeholder="Full Name (in English / Hindi)"
                value={form.child.name}
                onChange={(e) => update("child", "name", e.target.value)}
                required
              />
            </Field>

            <Field label="जन्म की तारीख (Date of Birth)" required>
              <DynamicDatePicker
                value={form.child.dateOfBirth}
                onChange={(newDate) => update("child", "dateOfBirth", newDate)}
                required
              />
            </Field>

            <Field label="लिंग (Gender)" required>
              <select
                style={inputStyle}
                value={form.child.gender}
                onChange={(e) => update("child", "gender", e.target.value)}
                required
              >
                <option value="">— Select Gender —</option>
                <option value="Male">पुरुष (Male)</option>
                <option value="Female">महिला (Female)</option>
                <option value="Transgender">ट्रांसजेंडर व्यक्ति (Transgender)</option>
              </select>
            </Field>

            <Field
              label="शिशु की आधार संख्या (Child's Aadhaar Number)"
              hint="यदि उपलब्ध हो (If available: XXXX-XXXX-XXXX)"
            >
              <input
                style={inputStyle}
                placeholder="XXXX-XXXX-XXXX (Optional)"
                maxLength={14}
                value={form.child.adharNumber}
                onChange={(e) => handleAadhaarChange("child", "adharNumber", e.target.value, form.child.adharNumber)}
              />
            </Field>

            <Field
              label="जन्म का स्थान (Place of Birth)"
              hint={form.facility && form.child.placeOfBirth === "Hospital" ? `अस्पताल चयन के अनुसार स्वतः चयनित (${form.facility})` : undefined}
              required
            >
              <select
                style={inputStyle}
                value={form.child.placeOfBirth}
                onChange={(e) => update("child", "placeOfBirth", e.target.value)}
                required
              >
                <option value="Hospital">1. अस्पताल / संस्थान (Hospital / Institution)</option>
                <option value="Home">2. घर (Home)</option>
                <option value="Other">3. अन्य स्थान (Other Place)</option>
              </select>
            </Field>
          </Grid>

          {/* If Home or Other place of birth */}
          {form.child.placeOfBirth !== "Hospital" && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                background: "#f8fafc",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
                जन्म स्थान का पूर्ण पता (Full Address of Place of Birth)
              </p>
              <Grid>
                <Field label="मकान सं० (House / Plot No.)">
                  <input
                    style={inputStyle}
                    value={form.birthPlaceAddress.plotNumber}
                    onChange={(e) => update("birthPlaceAddress", "plotNumber", e.target.value)}
                  />
                </Field>
                <Field label="मोहल्ला / टोला (Locality / Mohalla)">
                  <input
                    style={inputStyle}
                    value={form.birthPlaceAddress.mohalla}
                    onChange={(e) => update("birthPlaceAddress", "mohalla", e.target.value)}
                  />
                </Field>
                <Field label="वार्ड संख्या (Ward No. - यदि शहर की दशा में हो)">
                  <input
                    style={inputStyle}
                    value={form.birthPlaceAddress.wardNumber}
                    onChange={(e) => update("birthPlaceAddress", "wardNumber", e.target.value)}
                  />
                </Field>
                <Field label="गाँव / शहर (Village / Town)" required>
                  <input
                    style={inputStyle}
                    value={form.birthPlaceAddress.village}
                    onChange={(e) => update("birthPlaceAddress", "village", e.target.value)}
                    required
                  />
                </Field>
                <Field label="उप-जिला / प्रखण्ड (Sub-District / Block)" required>
                  <input
                    style={inputStyle}
                    value={form.birthPlaceAddress.subDistrict}
                    onChange={(e) => update("birthPlaceAddress", "subDistrict", e.target.value)}
                    required
                  />
                </Field>
                <Field label="जिला (District)" required>
                  <input
                    style={inputStyle}
                    value={form.birthPlaceAddress.district}
                    onChange={(e) => update("birthPlaceAddress", "district", e.target.value)}
                    required
                  />
                </Field>
                <Field label="राज्य (State)" required>
                  <input
                    style={inputStyle}
                    value={form.birthPlaceAddress.state}
                    onChange={(e) => update("birthPlaceAddress", "state", e.target.value)}
                    required
                  />
                </Field>
                <Field label="पिनकोड (PIN Code)" required>
                  <input
                    style={inputStyle}
                    maxLength={6}
                    value={form.birthPlaceAddress.pinCode}
                    onChange={(e) => update("birthPlaceAddress", "pinCode", e.target.value)}
                    required
                  />
                </Field>
              </Grid>
            </div>
          )}
        </div>

        {/* Section 3: Mother's Information */}
        <div className="anim-apply-section" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span
              style={{
                background: "#1e40af",
                color: "white",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              3
            </span>
            <div>
              <span>माता का विवरणी (Mother&apos;s Details)</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 8 }}>
                [प्रारूप 1, मद 5]
              </span>
            </div>
          </div>
          <Grid>
            <Field label="माता का नाम (Mother's Full Name)" required>
              <input
                style={inputStyle}
                placeholder="Full name as per official ID"
                value={form.mother.name}
                onChange={(e) => update("mother", "name", e.target.value)}
                required
              />
            </Field>
            <Field label="मोबाईल नं० (Mobile Number)" required>
              <input
                style={inputStyle}
                placeholder="10-digit mobile number"
                maxLength={10}
                value={form.mother.mobileNumber}
                onChange={(e) => update("mother", "mobileNumber", e.target.value)}
                required
              />
            </Field>
            <Field
              label="माता की आधार संख्या (Mother's Aadhaar Number)"
              hint="अनिवार्य 12-अंक (Mandatory 12-digit: XXXX-XXXX-XXXX)"
              required
            >
              <input
                style={inputStyle}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={14}
                value={form.mother.adharNumber}
                onChange={(e) => handleAadhaarChange("mother", "adharNumber", e.target.value, form.mother.adharNumber)}
                required
                pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}"
                title="कृपया माता की 12-अंकों की आधार संख्या (XXXX-XXXX-XXXX) दर्ज करें"
              />
            </Field>
            <Field label="ईमेल आई० डी० (Email ID)">
              <input
                type="email"
                style={inputStyle}
                placeholder="mother@example.com"
                value={form.mother.email}
                onChange={(e) => update("mother", "email", e.target.value)}
              />
            </Field>
          </Grid>
        </div>

        {/* Section 4: Father's Information */}
        <div className="anim-apply-section" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span
              style={{
                background: "#1e40af",
                color: "white",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              4
            </span>
            <div>
              <span>पिता का विवरणी (Father&apos;s Details)</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 8 }}>
                [प्रारूप 1, मद 4]
              </span>
            </div>
          </div>
          <Grid>
            <Field label="पिता का नाम (Father's Full Name)" required>
              <input
                style={inputStyle}
                placeholder="Full name as per official ID"
                value={form.father.name}
                onChange={(e) => update("father", "name", e.target.value)}
                required
              />
            </Field>
            <Field label="मोबाईल नं० (Mobile Number)" required>
              <input
                style={inputStyle}
                placeholder="10-digit mobile number"
                maxLength={10}
                value={form.father.mobileNumber}
                onChange={(e) => update("father", "mobileNumber", e.target.value)}
                required
              />
            </Field>
            <Field
              label="पिता की आधार संख्या (Father's Aadhaar Number)"
              hint="अनिवार्य 12-अंक (Mandatory 12-digit: XXXX-XXXX-XXXX)"
              required
            >
              <input
                style={inputStyle}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={14}
                value={form.father.adharNumber}
                onChange={(e) => handleAadhaarChange("father", "adharNumber", e.target.value, form.father.adharNumber)}
                required
                pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}"
                title="कृपया पिता की 12-अंकों की आधार संख्या (XXXX-XXXX-XXXX) दर्ज करें"
              />
            </Field>
            <Field label="ईमेल आई० डी० (Email ID)">
              <input
                type="email"
                style={inputStyle}
                placeholder="father@example.com"
                value={form.father.email}
                onChange={(e) => update("father", "email", e.target.value)}
              />
            </Field>
          </Grid>
        </div>

        {/* Section 5: Parents' Address at Child Birth */}
        <div className="anim-apply-section" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span
              style={{
                background: "#1e40af",
                color: "white",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              5
            </span>
            <div>
              <span>बच्चे के जन्म के समय माता-पिता का पता (Address at Child Birth)</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 8 }}>
                [प्रारूप 1, मद 6]
              </span>
            </div>
          </div>
          <Grid>
            <Field label="मकान सं० (House / Plot Number)">
              <input
                style={inputStyle}
                value={form.address.plotNumber}
                onChange={(e) => update("address", "plotNumber", e.target.value)}
              />
            </Field>
            <Field label="मोहल्ला / टोला (Locality / Mohalla)">
              <input
                style={inputStyle}
                value={form.address.mohalla}
                onChange={(e) => update("address", "mohalla", e.target.value)}
              />
            </Field>
            <Field label="वार्ड नं० (Ward Number - शहर की दशा में)">
              <input
                style={inputStyle}
                value={form.address.wardNumber}
                onChange={(e) => update("address", "wardNumber", e.target.value)}
              />
            </Field>
            <Field label="शहर / गाँव (Town / Village)" required>
              <input
                style={inputStyle}
                value={form.address.village}
                onChange={(e) => update("address", "village", e.target.value)}
                required
              />
            </Field>
            <Field label="उप-जिला / प्रखण्ड (Sub-District / Block)" required>
              <input
                style={inputStyle}
                value={form.address.subDistrict}
                onChange={(e) => update("address", "subDistrict", e.target.value)}
                required
              />
            </Field>
            <Field label="जिला (District)" required>
              <input
                style={inputStyle}
                value={form.address.district}
                onChange={(e) => update("address", "district", e.target.value)}
                required
              />
            </Field>
            <Field label="राज्य / सं०रा०क्षे० (State)" required>
              <input
                style={inputStyle}
                value={form.address.state}
                onChange={(e) => update("address", "state", e.target.value)}
                required
              />
            </Field>
            <Field label="पिनकोड (PIN Code)" required>
              <input
                style={inputStyle}
                maxLength={6}
                value={form.address.pinCode}
                onChange={(e) => update("address", "pinCode", e.target.value)}
                required
              />
            </Field>
          </Grid>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.sameAddress}
                onChange={(e) => setForm((p) => ({ ...p, sameAddress: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: "#1e40af", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                माता-पिता का स्थायी पता यही है (Permanent address is same as address at child birth)
              </span>
            </label>
          </div>
        </div>

        {/* Section 6: Permanent Address */}
        {!form.sameAddress && (
          <div className="anim-apply-section" style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span
                style={{
                  background: "#1e40af",
                  color: "white",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                6
              </span>
              <div>
                <span>माता-पिता का स्थायी पता (Permanent Address)</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 8 }}>
                  [प्रारूप 1, मद 7]
                </span>
              </div>
            </div>
            <Grid>
              <Field label="मकान सं० (House / Plot Number)">
                <input
                  style={inputStyle}
                  value={form.permanentAddress.plotNumber}
                  onChange={(e) => update("permanentAddress", "plotNumber", e.target.value)}
                />
              </Field>
              <Field label="मोहल्ला / टोला (Locality / Mohalla)">
                <input
                  style={inputStyle}
                  value={form.permanentAddress.mohalla}
                  onChange={(e) => update("permanentAddress", "mohalla", e.target.value)}
                />
              </Field>
              <Field label="वार्ड नं० (Ward Number - शहर की दशा में)">
                <input
                  style={inputStyle}
                  value={form.permanentAddress.wardNumber}
                  onChange={(e) => update("permanentAddress", "wardNumber", e.target.value)}
                />
              </Field>
              <Field label="शहर / गाँव (Town / Village)" required>
                <input
                  style={inputStyle}
                  value={form.permanentAddress.village}
                  onChange={(e) => update("permanentAddress", "village", e.target.value)}
                  required={!form.sameAddress}
                />
              </Field>
              <Field label="उप-जिला / प्रखण्ड (Sub-District / Block)" required>
                <input
                  style={inputStyle}
                  value={form.permanentAddress.subDistrict}
                  onChange={(e) => update("permanentAddress", "subDistrict", e.target.value)}
                  required={!form.sameAddress}
                />
              </Field>
              <Field label="जिला (District)" required>
                <input
                  style={inputStyle}
                  value={form.permanentAddress.district}
                  onChange={(e) => update("permanentAddress", "district", e.target.value)}
                  required={!form.sameAddress}
                />
              </Field>
              <Field label="राज्य / सं०रा०क्षे० (State)" required>
                <input
                  style={inputStyle}
                  value={form.permanentAddress.state}
                  onChange={(e) => update("permanentAddress", "state", e.target.value)}
                  required={!form.sameAddress}
                />
              </Field>
              <Field label="पिनकोड (PIN Code)" required>
                <input
                  style={inputStyle}
                  maxLength={6}
                  value={form.permanentAddress.pinCode}
                  onChange={(e) => update("permanentAddress", "pinCode", e.target.value)}
                  required={!form.sameAddress}
                />
              </Field>
            </Grid>
          </div>
        )}

        {/* Section 7: Statistical Information (सांख्यिकी सूचना) */}
        <div className="anim-apply-section" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span
              style={{
                background: "#1e40af",
                color: "white",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {form.sameAddress ? "6" : "7"}
            </span>
            <div>
              <span>सांख्यिकी एवं प्रसव सूचना (Statistical & Delivery Information)</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 8 }}>
                [प्रारूप 1, मद 10 से 22]
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 10 }}>
              भाग 1: धर्म, शिक्षा एवं व्यवसाय (Religion, Literacy & Occupation) [मद 11 से 15]
            </p>
            <Grid>
              <Field label="माता का धर्म (Mother's Religion)" required>
                <select
                  style={inputStyle}
                  value={form.informationProvider.motherReligion}
                  onChange={(e) => update("informationProvider", "motherReligion", e.target.value)}
                  required
                >
                  {RELIGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="पिता का धर्म (Father's Religion)" required>
                <select
                  style={inputStyle}
                  value={form.informationProvider.fatherReligion}
                  onChange={(e) => update("informationProvider", "fatherReligion", e.target.value)}
                  required
                >
                  {RELIGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="माता का शिक्षा का स्तर (Mother's Education Level)">
                <input
                  style={inputStyle}
                  placeholder="e.g. Matric / Higher Secondary / Graduate"
                  value={form.informationProvider.motherLiteracy}
                  onChange={(e) => update("informationProvider", "motherLiteracy", e.target.value)}
                />
              </Field>

              <Field label="पिता का शिक्षा का स्तर (Father's Education Level)">
                <input
                  style={inputStyle}
                  placeholder="e.g. Matric / Higher Secondary / Graduate"
                  value={form.informationProvider.fatherLiteracy}
                  onChange={(e) => update("informationProvider", "fatherLiteracy", e.target.value)}
                />
              </Field>

              <Field label="माता का व्यवसाय (Mother's Occupation)">
                <input
                  style={inputStyle}
                  placeholder="e.g. Homemaker / Agriculture / Service"
                  value={form.informationProvider.motherProfession}
                  onChange={(e) => update("informationProvider", "motherProfession", e.target.value)}
                />
              </Field>

              <Field label="पिता का व्यवसाय (Father's Occupation)">
                <input
                  style={inputStyle}
                  placeholder="e.g. Business / Agriculture / Service"
                  value={form.informationProvider.fatherProfession}
                  onChange={(e) => update("informationProvider", "fatherProfession", e.target.value)}
                />
              </Field>
            </Grid>
          </div>

          <div style={{ marginBottom: 18, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 10 }}>
              भाग 2: माता की आयु एवं प्रसव इतिहास (Mother&apos;s Age & History) [मद 16 से 18]
            </p>
            <Grid>
              <Field
                label="विवाह के समय माता की आयु (Mother's Age at Marriage)"
                hint="पूर्ण वर्षों में (In completed years)"
              >
                <input
                  type="number"
                  style={inputStyle}
                  min="1"
                  max="60"
                  placeholder="e.g. 21"
                  value={form.informationProvider.motherAgeAtMirrage}
                  onChange={(e) => update("informationProvider", "motherAgeAtMirrage", e.target.value)}
                />
              </Field>

              <Field
                label="इस संतान के जन्म के समय माता की आयु (Mother's Age at Child Birth)"
                hint="पूर्ण वर्षों में (In completed years)"
              >
                <input
                  type="number"
                  style={inputStyle}
                  min="1"
                  max="60"
                  placeholder="e.g. 24"
                  value={form.informationProvider.motherAgeAtChildBirth}
                  onChange={(e) => update("informationProvider", "motherAgeAtChildBirth", e.target.value)}
                />
              </Field>

              <Field
                label="इस संतान सहित जीवित जन्मों की संख्या (Live Born Children to Mother)"
                hint="पूर्व के विवाह से जीवित संतान भी जोड़ी जाएगी [मद 18]"
              >
                <input
                  type="number"
                  style={inputStyle}
                  min="1"
                  max="20"
                  placeholder="e.g. 1"
                  value={form.informationProvider.motherChildNumber}
                  onChange={(e) => update("informationProvider", "motherChildNumber", e.target.value)}
                />
              </Field>

              <Field
                label="गर्भधारण की अवधि (Duration of Pregnancy)"
                hint="हफ्तों में [मद 22] (Completed weeks, e.g. 38)"
              >
                <input
                  type="number"
                  style={inputStyle}
                  min="20"
                  max="45"
                  placeholder="e.g. 38"
                  value={form.child.pregnancyDuration}
                  onChange={(e) => update("child", "pregnancyDuration", e.target.value)}
                />
              </Field>
            </Grid>
          </div>

          <div style={{ paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 10 }}>
              भाग 3: प्रसव विवरण एवं जन्म वजन (Delivery Details & Birth Weight) [मद 19 से 21]
            </p>
            <Grid>
              <Field
                label="जन्म के समय वजन (Birth Weight in kg)"
                hint="कि०ग्रा० में [मद 21] (यदि ज्ञात हो, e.g. 2.8)"
              >
                <input
                  type="number"
                  step="0.01"
                  style={inputStyle}
                  min="0.5"
                  max="8"
                  placeholder="e.g. 2.85"
                  value={form.child.weight}
                  onChange={(e) => update("child", "weight", e.target.value)}
                />
              </Field>

              <Field label="प्रसव की विधि (Method of Delivery)" hint="[मद 20]" required>
                <select
                  style={inputStyle}
                  value={form.child.deliveryMethod}
                  onChange={(e) => update("child", "deliveryMethod", e.target.value)}
                  required
                >
                  {DELIVERY_METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="प्रसव के समय परिचर्या का प्रकार (Attention at Delivery)"
                hint="[मद 19]"
                required
              >
                <select
                  style={inputStyle}
                  value={form.child.deliveryAttention}
                  onChange={(e) => update("child", "deliveryAttention", e.target.value)}
                  required
                >
                  {DELIVERY_ATTENTION_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
            </Grid>
          </div>
        </div>

        {/* Section 8: Informant Details & Statutory Declaration */}
        <div className="anim-apply-section" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span
              style={{
                background: "#1e40af",
                color: "white",
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {form.sameAddress ? "7" : "8"}
            </span>
            <div>
              <span>सूचनादाता का विवरणी एवं वैधानिक घोषणा (Informant Details & Declaration)</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginLeft: 8 }}>
                [प्रारूप 1, मद 9 एवं घोषणा]
              </span>
            </div>
          </div>

          <Grid>
            <Field
              label="शिशु से सम्बन्ध (Relation to Child)"
              hint="पिता या माता चुनने पर ऊपर से विवरणी स्वतः भर जाएगी (Auto-populates from Father/Mother)"
              required
            >
              <select
                style={inputStyle}
                value={form.informationProvider.relationToChild}
                onChange={(e) => handleRelationChange(e.target.value)}
                required
              >
                {RELATION_OPTIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="सूचनादाता का नाम (Informant's Full Name)" required>
              <input
                style={inputStyle}
                placeholder="Full name of applicant/informant"
                value={form.informationProvider.name}
                onChange={(e) => update("informationProvider", "name", e.target.value)}
                required
              />
            </Field>

            <Field label="मोबाईल नं० (Mobile Number)" required>
              <input
                style={inputStyle}
                placeholder="10-digit number for SMS alerts"
                maxLength={10}
                value={form.informationProvider.mobileNumber}
                onChange={(e) => update("informationProvider", "mobileNumber", e.target.value)}
                required
              />
            </Field>

            <Field label="ईमेल आई० डी० (Email Address for Official Tracking)" required>
              <input
                type="email"
                style={inputStyle}
                placeholder="applicant@example.com"
                value={form.informationProvider.email}
                onChange={(e) => update("informationProvider", "email", e.target.value)}
                required
              />
            </Field>

            <Field
              label="सूचनादाता की आधार संख्या (Aadhaar Number)"
              hint="यदि उपलब्ध हो (If available: XXXX-XXXX-XXXX)"
            >
              <input
                style={inputStyle}
                placeholder="XXXX-XXXX-XXXX (Optional)"
                maxLength={14}
                value={form.informationProvider.adharNumber}
                onChange={(e) => handleAadhaarChange("informationProvider", "adharNumber", e.target.value, form.informationProvider.adharNumber)}
              />
            </Field>
          </Grid>

          {/* Statutory Declaration Card */}
          <div
            style={{
              marginTop: 24,
              padding: "18px 20px",
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <input
                type="checkbox"
                id="statutory-declaration-chk"
                checked={form.informationProvider.declarationAccepted}
                onChange={(e) =>
                  update("informationProvider", "declarationAccepted", e.target.checked)
                }
                required
                style={{
                  width: 20,
                  height: 20,
                  marginTop: 2,
                  accentColor: "#1e40af",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="statutory-declaration-chk"
                style={{ fontSize: 13, color: "#1e3a8a", lineHeight: 1.6, cursor: "pointer" }}
              >
                <strong>घोषणा (Statutory Declaration):</strong>
                <p style={{ margin: "4px 0 6px", color: "#1e293b", fontSize: 12.5 }}>
                  मेरी जानकारी एवं विश्वास के अनुसार दी गयी सूचना पूर्णतः सही है। मैं गलत सूचना प्रस्तुत करने के लिए
                  जन्म और मृत्यु रजिस्ट्रीकरण अधिनियम, 1969 (2023 में संशोधित) की धारा 23 के तहत दण्ड/जुर्माने से अवगत हूँ।
                  इसके अलावा, मैं आधार प्रमाणीकरण के माध्यम से प्रमाणीकरण पहचान के लिए आधार अधिनियम, 2016 के तहत भी सहमति देता/देती हूँ।
                </p>
                <p style={{ margin: 0, color: "#475569", fontSize: 11.5, fontStyle: "italic" }}>
                  (I hereby declare that the information provided is true and correct to the best of my knowledge and belief.
                  I am aware of the penalties under Section 23 of the Registration of Births and Deaths Act, 1969 (amended 2023)
                  for furnishing false particulars, and provide consent for Aadhaar identity authentication under the Aadhaar Act, 2016.)
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 20,
              color: "#dc2626",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              padding: "12px 24px",
              background: "white",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              textAlign: "center",
              minWidth: 100,
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 32px",
              background: loading ? "#93c5fd" : "#1e40af",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 2px 8px rgba(30,64,175,0.3)",
              minWidth: 200,
            }}
          >
            {loading && <span className="spinner" />}
            {loading ? "Submitting Application..." : "Submit Birth Report (प्रारूप-1) →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ApplyPageContent() {
  const searchParams = useSearchParams();
  const facParam = searchParams.get("facility") || "";
  return <ApplyFormContent key={facParam} facParam={facParam} />;
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏥</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>
              Civil Registration System (CRS)
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Loading Birth Certificate Application Form...</div>
          </div>
        </div>
      }
    >
      <ApplyPageContent />
    </Suspense>
  );
}

