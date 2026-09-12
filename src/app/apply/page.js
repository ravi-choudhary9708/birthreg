"use client";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FACILITIES, FACILITIES_DATA, FACILITIES_BY_BLOCK } from "@/utils/constants";
import { SUB_DIVISIONS_AND_BLOCKS, getBlocksForSubDivision } from "@/utils/subdivisions";
import {
  MADHUBANI_POST_OFFICES,
  getPostOfficesForPincode,
  isValidMadhubaniPincode,
} from "@/utils/postOffices";
import DynamicDatePicker from "@/components/DynamicDatePicker";
import AadhaarUpload from "@/components/AadhaarUpload";
import { AlertTriangle, Search, X, Check, Building2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [subDivisionsList, setSubDivisionsList] = useState(SUB_DIVISIONS_AND_BLOCKS);
  const [postOfficesList, setPostOfficesList] = useState(MADHUBANI_POST_OFFICES);
  const [facilitiesByBlock, setFacilitiesByBlock] = useState(FACILITIES_BY_BLOCK);
  const [facilitiesList, setFacilitiesList] = useState(FACILITIES_DATA);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [facilityDropdownOpen, setFacilityDropdownOpen] = useState(false);
  const [facilityBlockFilter, setFacilityBlockFilter] = useState("ALL");
  const facilityDropdownRef = useRef(null);
  const facilityListScrollRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch("/api/subdivisions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setSubDivisionsList(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load subdivisions from API:", err);
      });

    fetch("/api/post-offices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setPostOfficesList(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load post offices from API:", err);
      });

    fetch("/api/facilities")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.facilities?.length > 0) {
          setFacilitiesList(data.data.facilities);
          const grouped = data.data.facilities.reduce((acc, f) => {
            const b = f.block || "Other";
            if (!acc[b]) acc[b] = [];
            acc[b].push(f.name);
            return acc;
          }, {});
          setFacilitiesByBlock(grouped);
        }
      })
      .catch((err) => {
        console.error("Failed to load facilities from database:", err);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (facilityDropdownRef.current && !facilityDropdownRef.current.contains(event.target)) {
        setFacilityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const el = facilityListScrollRef.current;
    if (!el || !facilityDropdownOpen) return;

    const handleWheel = (e) => {
      e.stopPropagation();
      const isScrollable = el.scrollHeight > el.clientHeight;
      if (!isScrollable) return;

      const atTop = el.scrollTop <= 0 && e.deltaY < 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;

      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [facilityDropdownOpen]);

  const allFacilityBlocks = useMemo(() => {
    return Array.from(new Set(facilitiesList.map((f) => f.block).filter(Boolean))).sort();
  }, [facilitiesList]);

  const filteredSearchFacilities = useMemo(() => {
    const q = facilitySearch.toLowerCase().trim();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    return facilitiesList.filter((f) => {
      const matchesBlock =
        facilityBlockFilter === "ALL" ||
        f.block?.toLowerCase() === facilityBlockFilter.toLowerCase();
      if (!matchesBlock) return false;

      if (tokens.length === 0) return true;

      let searchable = [
        f.name,
        f.block,
        f.type,
        f.tag,
        f.pin,
        f.address,
        f.rawName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Common aliases to ensure direct typing matches accurately
      if (f.type === "DH" || f.name?.toLowerCase().includes("district hospital")) {
        searchable += " sadar hospital sadar aspatal apex civil hospital sadar hospital madhubani";
      }
      if (f.type === "SDH") {
        searchable += " anumaandal sub divisional hospital";
      }
      if (f.type === "CHC") {
        searchable += " community health centre samudayik swasthya kendra";
      }
      if (f.type === "PHC" || f.type === "APHC") {
        searchable += " primary health centre prathmik swasthya kendra";
      }
      if (f.type === "HSC" || f.type === "HWC" || f.type === "UHWC") {
        searchable += " sub centre health sub centre up swasthya kendra upkendra wellness";
      }

      return tokens.every((token) => searchable.includes(token));
    });
  }, [facilitiesList, facilitySearch, facilityBlockFilter]);

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
        adharCardUrl: "",
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
        block: "",
        district: "Madhubani",
        state: "Bihar",
        pinCode: "",
        postOffice: "",
      },
      mother: {
        name: "",
        adharNumber: "",
        adharCardUrl: "",
        mobileNumber: "",
        email: "",
      },
      father: {
        name: "",
        adharNumber: "",
        adharCardUrl: "",
        mobileNumber: "",
        email: "",
      },
      address: {
        plotNumber: "",
        mohalla: "",
        village: "",
        wardNumber: "",
        subDistrict: "",
        block: "",
        district: "Madhubani",
        state: "Bihar",
        pinCode: "",
        postOffice: "",
      },
      permanentAddress: {
        plotNumber: "",
        mohalla: "",
        village: "",
        wardNumber: "",
        subDistrict: "",
        block: "",
        district: "Madhubani",
        state: "Bihar",
        pinCode: "",
        postOffice: "",
      },
      sameAddress: true,
      informationProvider: {
        name: "",
        relationToChild: "Father (पिता)",
        adharNumber: "",
        adharCardUrl: "",
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

  const [facilityStatus, setFacilityStatus] = useState({});

  useEffect(() => {
    fetch("/api/facilities/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setFacilityStatus(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const selectedFacilityObj = useMemo(() => {
    if (!form.facility) return null;
    return facilitiesList.find((f) => f.name === form.facility) || {
      name: form.facility,
      block: "Madhubani",
      type: "Facility",
      tag: "Verified Healthcare Facility",
      icon: "🏥",
    };
  }, [form.facility, facilitiesList]);

  const [uploadingDocs, setUploadingDocs] = useState({
    child: false,
    mother: false,
    father: false,
    informant: false,
  });

  const handleUploadingDocChange = (key, loading) => {
    setUploadingDocs((prev) => {
      if (prev[key] === Boolean(loading)) return prev;
      return { ...prev, [key]: Boolean(loading) };
    });
  };

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

      // Automatically mirror contact details & Aadhaar document to informant if relation matches
      const rel = prev.informationProvider.relationToChild || "";
      if (
        (section === "father" && rel.startsWith("Father")) ||
        (section === "mother" && rel.startsWith("Mother"))
      ) {
        if (["name", "mobileNumber", "email", "adharNumber", "adharCardUrl"].includes(field)) {
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

  const handleSubDistrictChange = (section, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        subDistrict: value,
        block: "",
      },
    }));
  };

  const handlePincodeChange = (section, rawValue) => {
    const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => {
      const prevPin = prev[section]?.pinCode || "";
      const isChanging = prevPin !== digitsOnly;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          pinCode: digitsOnly,
          postOffice: isChanging ? "" : prev[section]?.postOffice || "",
        },
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
          adharCardUrl: prev.father.adharCardUrl || "",
        };
      } else if (newRelation.startsWith("Mother")) {
        updatedProvider = {
          ...updatedProvider,
          name: prev.mother.name || "",
          mobileNumber: prev.mother.mobileNumber || "",
          email: prev.mother.email || "",
          adharNumber: prev.mother.adharNumber || "",
          adharCardUrl: prev.mother.adharCardUrl || "",
        };
      } else {
        // Clear informant fields for Guardian, Relative, Hospital Authority, Other, etc.
        updatedProvider = {
          ...updatedProvider,
          name: "",
          mobileNumber: "",
          email: "",
          adharNumber: "",
          adharCardUrl: "",
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

  const formatMobileNumber = (value, prevValue = "") => {
    if (!value) return "";

    const isDeleting = Boolean(prevValue && value.length < prevValue.length);

    let str = value.trim();

    // If string begins with "+91" or "+ 91", strip the "+91" prefix to isolate the subscriber number
    if (str.startsWith("+91") || str.startsWith("+ 91")) {
      str = str.replace(/^\+\s*91\s*/, "");
    } else if (str.startsWith("+")) {
      str = str.slice(1).trim();
    } else if (str.startsWith("91") && str.replace(/\D/g, "").length > 10) {
      str = str.slice(2).trim();
    } else if (str.startsWith("0") && str.replace(/\D/g, "").length > 10) {
      str = str.slice(1).trim();
    }

    // Extract subscriber digits only
    let digits = str.replace(/\D/g, "");

    // If deleting and no subscriber digits remain, reset to empty string
    if (isDeleting && digits.length === 0) {
      return "";
    }

    if (digits.length === 0) {
      return "";
    }

    // Limit subscriber number to exactly 10 digits
    digits = digits.slice(0, 10);

    return `+91 ${digits}`;
  };

  const handleMobileChange = (section, field, value, prevValue = "") => {
    const formatted = formatMobileNumber(value, prevValue);
    update(section, field, formatted);
  };

  const renderMobileHint = (val) => {
    if (!val || !val.trim()) {
      return (
        <span style={{ color: "#6b7280" }}>
          10-अंकों का मोबाइल नंबर
        </span>
      );
    }
    const digits = val.replace(/^\+91\s*/, "").replace(/\D/g, "");
    if (digits.length === 10) {
      return (
        <span style={{ color: "#16a34a", fontWeight: 600 }}>
          ✓ वैध 10-अंकों का मोबाइल नंबर / Valid 10-digit mobile number
        </span>
      );
    }
    return (
      <span style={{ color: "#d97706", fontWeight: 600 }}>
        ⚠️ {digits.length}/10 अंक दर्ज किए गए ({10 - digits.length} अंक शेष / {10 - digits.length} digits remaining)
      </span>
    );
  };

  const isValidEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const renderEmailHint = (val, isRequired = false) => {
    if (!val || !val.trim()) {
      return isRequired ? (
        <span style={{ color: "#6b7280" }}>
          आधिकारिक ट्रैकिंग एवं प्रमाणपत्र प्राप्ति हेतु अनिवार्य (Mandatory for tracking & certificate)
        </span>
      ) : (
        <span style={{ color: "#6b7280" }}>
          वैकल्पिक (Optional - उदा० name@example.com)
        </span>
      );
    }
    const valid = isValidEmail(val);
    if (valid) {
      return (
        <span style={{ color: "#16a34a", fontWeight: 600 }}>
          ✓ मान्य ईमेल आई० डी० (Valid Email Address)
        </span>
      );
    }
    return (
      <span style={{ color: "#dc2626", fontWeight: 600 }}>
        ⚠️ कृपया सही ईमेल आई० डी० दर्ज करें (उदा० name@example.com)
      </span>
    );
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

    const validateMobile = (mobile, label) => {
      if (!mobile || !mobile.trim()) {
        return `${label} का 10-अंकों का मोबाइल नंबर अनिवार्य है (Mobile number is required).`;
      }
      const digits = mobile.replace(/^\+91\s*/, "").replace(/\D/g, "");
      if (digits.length !== 10) {
        return `${label} का मोबाइल नंबर पूरे 10 अंकों का होना चाहिए (+91 XXXXXXXXXX). Please enter a valid 10-digit mobile number for ${label}.`;
      }
      if (!/^[6-9]\d{9}$/.test(digits)) {
        return `${label} का मोबाइल नंबर 6, 7, 8 या 9 से शुरू होने वाला 10-अंकों का वैध नंबर होना चाहिए। Please enter a valid 10-digit Indian mobile number starting with 6-9 for ${label}.`;
      }
      return null;
    };

    const motherMobileErr = validateMobile(form.mother.mobileNumber, "माता (Mother)");
    if (motherMobileErr) {
      setError(motherMobileErr);
      return;
    }

    const fatherMobileErr = validateMobile(form.father.mobileNumber, "पिता (Father)");
    if (fatherMobileErr) {
      setError(fatherMobileErr);
      return;
    }

    const informantMobileErr = validateMobile(form.informationProvider.mobileNumber, "सूचनादाता (Informant)");
    if (informantMobileErr) {
      setError(informantMobileErr);
      return;
    }

    // Email Validations
    if (!form.informationProvider.email || !form.informationProvider.email.trim()) {
      setError("सूचनादाता का ईमेल आई० डी० (Email Address) अनिवार्य है। Email address for Information Provider is required for official status tracking & certificate delivery.");
      return;
    }
    if (!isValidEmail(form.informationProvider.email)) {
      setError("सूचनादाता का ईमेल आई० डी० अमान्य है (उदा० applicant@example.com)। Please enter a valid email address for Information Provider.");
      return;
    }

    if (form.mother.email && form.mother.email.trim() && !isValidEmail(form.mother.email)) {
      setError("माता का ईमेल आई० डी० अमान्य है (उदा० mother@example.com)। Please enter a valid email address for Mother.");
      return;
    }

    if (form.father.email && form.father.email.trim() && !isValidEmail(form.father.email)) {
      setError("पिता का ईमेल आई० डी० अमान्य है (उदा० father@example.com)। Please enter a valid email address for Father.");
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

    const pinPattern = /^\d{6}$/;
    if (!form.address.pinCode || !pinPattern.test(form.address.pinCode.trim())) {
      setError("पता में 6-अंकों का वैध पिनकोड अनिवार्य है (Please enter a valid 6-digit PIN code in address).");
      return;
    }
    if (!form.address.postOffice) {
      setError("पता में डाकघर (Post Office) का चयन अनिवार्य है (Please select Post Office in address).");
      return;
    }
    if (!form.sameAddress) {
      if (!form.permanentAddress.pinCode || !pinPattern.test(form.permanentAddress.pinCode.trim())) {
        setError("स्थायी पते में 6-अंकों का वैध पिनकोड अनिवार्य है (Please enter a valid 6-digit PIN code in permanent address).");
        return;
      }
      if (!form.permanentAddress.postOffice) {
        setError("स्थायी पते में डाकघर (Post Office) का चयन अनिवार्य है (Please select Post Office in permanent address).");
        return;
      }
    }
    if (form.child.placeOfBirth !== "Hospital") {
      if (!form.birthPlaceAddress.pinCode || !pinPattern.test(form.birthPlaceAddress.pinCode.trim())) {
        setError("जन्म स्थान के पते में 6-अंकों का वैध पिनकोड अनिवार्य है (Please enter a valid 6-digit PIN code in birth place address).");
        return;
      }
      if (!form.birthPlaceAddress.postOffice) {
        setError("जन्म स्थान के पते में डाकघर (Post Office) का चयन अनिवार्य है (Please select Post Office in birth place address).");
        return;
      }
    }

    if (Object.values(uploadingDocs).some(Boolean)) {
      setError("कृपया आधार दस्तावेज़ अपलोड पूरा होने की प्रतीक्षा करें (Please wait for all Aadhaar uploads to finish before submitting).");
      return;
    }

    if (form.facility && facilityStatus[form.facility]?.isActive === false) {
      setError("इस स्वास्थ्य केंद्र की सत्यापन इकाई को ऑपरेटर सेंट्रल द्वारा निष्क्रिय (Inactive) किया गया है। वर्तमान में इस केंद्र के लिए नया आवेदन स्वीकार्य नहीं है। कृपया सक्रिय स्वास्थ्य केंद्र चुनें।");
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
          adharCardUrl: form.child.adharCardUrl || undefined,
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
                  block: form.address.block || "",
                  district: "Madhubani",
                  state: "Bihar",
                  pinCode: form.address.pinCode || "847211",
                  postOffice: form.address.postOffice || "",
                }
              : form.birthPlaceAddress,
        },
        parents: {
          mother: {
            ...form.mother,
            adharCardUrl: form.mother.adharCardUrl || undefined,
          },
          father: {
            ...form.father,
            adharCardUrl: form.father.adharCardUrl || undefined,
          },
          address: form.address,
          permanentAddress: pAddress,
        },
        informationProvider: {
          name: form.informationProvider.name,
          relationToChild: form.informationProvider.relationToChild,
          adharNumber: form.informationProvider.adharNumber,
          adharCardUrl: form.informationProvider.adharCardUrl || undefined,
          mobileNumber: form.informationProvider.mobileNumber,
          email: form.informationProvider.email,
          providedInformation: true,
          declarationAccepted: form.informationProvider.declarationAccepted,
          informaionProviderAddress: form.address,
          motherAddress: {
            city: form.address.village,
            subDistrict: form.address.subDistrict,
            block: form.address.block || "",
            district: form.address.district,
            state: form.address.state,
            pinCode: form.address.pinCode,
            postOffice: form.address.postOffice || "",
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
                height: 36,
                backgroundColor: "#d1d5db",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />

            <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Image
                src="/baby_birth.svg"
                alt="Birth Certificate Portal Logo"
                width={38}
                height={38}
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
        autoComplete="off"
        onSubmit={handleSubmit}
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 36px) clamp(14px, 3vw, 24px)",
        }}
      >
        {/* Section 1: Facility Selection */}
        <div
          id="main-content"
          tabIndex={-1}
          className="anim-apply-section"
          style={{
            ...sectionStyle,
            scrollMarginTop: "90px",
            outline: "none",
          }}
        >
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
            {selectedFacilityObj && form.facility ? (
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1.5px solid #0284c7",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div
                      style={{
                        fontSize: 24,
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: "#e0f2fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {selectedFacilityObj.icon || "🏥"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: selectedFacilityObj.badgeBg || "#ecfdf5",
                            color: selectedFacilityObj.badgeColor || "#065f46",
                            border: `1px solid ${selectedFacilityObj.badgeBorder || "#a7f3d0"}`,
                          }}
                        >
                          {selectedFacilityObj.tag || selectedFacilityObj.type || "Healthcare Facility"}
                        </span>
                        {facilityStatus[form.facility]?.isActive === false ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#dc2626",
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              padding: "2px 8px",
                              borderRadius: 99,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            ⚠️ सत्यापन इकाई निष्क्रिय (Suspended)
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#16a34a",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              padding: "2px 8px",
                              borderRadius: 99,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                            सत्यापन इकाई सक्रिय (Active)
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                        {selectedFacilityObj.name}
                      </h4>
                      <div style={{ fontSize: 12.5, color: "#475569", marginTop: 4 }}>
                        <span>📍 ब्लॉक (Block): <strong>{selectedFacilityObj.block}</strong></span>
                        {selectedFacilityObj.pin && <span> • पिन कोड (PIN): <strong>{selectedFacilityObj.pin}</strong></span>}
                        {selectedFacilityObj.address && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{selectedFacilityObj.address}</div>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, facility: "" }));
                      setFacilitySearch("");
                      setFacilityDropdownOpen(true);
                    }}
                    style={{
                      background: "white",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "#1e40af",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    <X size={14} />
                    <span>अस्पताल बदलें (Change Hospital)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div ref={facilityDropdownRef} data-lenis-prevent="true" style={{ width: "100%" }}>
                {/* Search Bar & Optional Block Filter */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                    <Search
                      size={17}
                      color="#64748b"
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="अस्पताल का नाम सीधे टाइप करें (Type hospital name e.g. Sadar, Babubarhi, HSC Pastan)..."
                      value={facilitySearch}
                      onChange={(e) => {
                        setFacilitySearch(e.target.value);
                        setFacilityDropdownOpen(true);
                      }}
                      onFocus={() => setFacilityDropdownOpen(true)}
                      style={{
                        ...inputStyle,
                        paddingLeft: 42,
                        paddingRight: facilitySearch ? 36 : 14,
                        borderColor: facilityDropdownOpen ? "#2563eb" : "#cbd5e1",
                        boxShadow: facilityDropdownOpen ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
                      }}
                    />
                    {facilitySearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setFacilitySearch("");
                        }}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="सर्च साफ़ करें (Clear search)"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Quick Block Filter Dropdown */}
                  <div style={{ width: "clamp(160px, 25%, 220px)" }}>
                    <select
                      value={facilityBlockFilter}
                      onChange={(e) => {
                        setFacilityBlockFilter(e.target.value);
                        setFacilityDropdownOpen(true);
                      }}
                      style={{
                        ...inputStyle,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                        color: facilityBlockFilter === "ALL" ? "#475569" : "#1e40af",
                        background: facilityBlockFilter === "ALL" ? "#f8fafc" : "#eff6ff",
                      }}
                    >
                      <option value="ALL">सभी 21 ब्लॉक (All Blocks)</option>
                      {allFacilityBlocks.map((b) => (
                        <option key={b} value={b}>
                          📍 {b} Block
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-bar: Status count & Open / Close toggle button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                    fontSize: 12.5,
                    color: "#64748b",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {facilityBlockFilter !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => setFacilityBlockFilter("ALL")}
                        style={{
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 99,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#1e40af",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>📍 {facilityBlockFilter}</span>
                        <X size={12} />
                      </button>
                    )}
                    <span>
                      {facilitySearch || facilityBlockFilter !== "ALL" ? (
                        <span>
                          <strong>{filteredSearchFacilities.length}</strong> अस्पताल मिले (
                          {filteredSearchFacilities.length === 1 ? "1 facility match" : `${filteredSearchFacilities.length} facilities match`}
                          {facilitySearch ? ` for "${facilitySearch}"` : ""}
                          {facilityBlockFilter !== "ALL" ? ` in ${facilityBlockFilter}` : ""}
                          )
                        </span>
                      ) : (
                        <span>कुल <strong>{facilitiesList.length}</strong> अधिकृत अस्पताल उपलब्ध (Total <strong>{facilitiesList.length}</strong> facilities available in Madhubani District)</span>
                      )}
                    </span>
                  </div>

                  {/* Dedicated Open/Close Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setFacilityDropdownOpen((prev) => !prev)}
                    style={{
                      background: facilityDropdownOpen ? "#fef2f2" : "#eff6ff",
                      color: facilityDropdownOpen ? "#b91c1c" : "#1d4ed8",
                      border: facilityDropdownOpen ? "1px solid #fecaca" : "1px solid #bfdbfe",
                      borderRadius: 8,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.15s",
                    }}
                  >
                    {facilityDropdownOpen ? (
                      <>
                        <ChevronUp size={14} />
                        <span>सूची बंद करें (Close List)</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        <span>अस्पताल सूची खोलें (Open List)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* IN-FLOW Facility List Panel - Enclosed completely inside Section 1 card */}
                {facilityDropdownOpen && (
                  <div
                    data-lenis-prevent="true"
                    onWheel={(e) => e.stopPropagation()}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      background: "#ffffff",
                      borderRadius: 12,
                      border: "1.5px solid #cbd5e1",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Sticky List Header */}
                    <div
                      data-lenis-prevent="true"
                      onWheel={(e) => {
                        e.stopPropagation();
                        if (facilityListScrollRef.current) {
                          facilityListScrollRef.current.scrollTop += e.deltaY;
                        }
                      }}
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        zIndex: 5,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                          📋 अधिकृत अस्पताल सूची ({filteredSearchFacilities.length} उपलब्ध)
                        </span>
                        {facilityBlockFilter !== "ALL" && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#dbeafe",
                              color: "#1e40af",
                              padding: "1px 8px",
                              borderRadius: 99,
                            }}
                          >
                            {facilityBlockFilter} Block
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFacilityDropdownOpen(false)}
                        style={{
                          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                          border: "1px solid #fca5a5",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#b91c1c",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          boxShadow: "0 1px 3px rgba(185, 28, 28, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
                          letterSpacing: "0.01em",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)";
                          e.currentTarget.style.boxShadow = "0 2px 6px rgba(185, 28, 28, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
                          e.currentTarget.style.boxShadow = "0 1px 3px rgba(185, 28, 28, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                        onMouseDown={e => {
                          e.currentTarget.style.transform = "translateY(0px) scale(0.97)";
                          e.currentTarget.style.boxShadow = "0 1px 2px rgba(185, 28, 28, 0.2)";
                        }}
                        onMouseUp={e => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Scrollable Results List Body */}
                    <div
                      ref={facilityListScrollRef}
                      data-lenis-prevent="true"
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        maxHeight: 380,
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                        WebkitOverflowScrolling: "touch",
                        touchAction: "pan-y",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#94a3b8 #f1f5f9",
                      }}
                    >
                      {filteredSearchFacilities.length === 0 ? (
                        <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748b" }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                            कोई अस्पताल नहीं मिला (No facility found)
                          </div>
                          <div style={{ fontSize: 12.5, marginTop: 4 }}>
                            {facilitySearch ? (
                              <span>&ldquo;{facilitySearch}&rdquo; से मेल खाता कोई केंद्र नहीं मिला। </span>
                            ) : (
                              <span>चयनित ब्लॉक में कोई अस्पताल उपलब्ध नहीं है। </span>
                            )}
                            कृपया स्पेलिंग जांचें या ब्लॉक फिल्टर बदलें।
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                            {facilitySearch && (
                              <button
                                type="button"
                                onClick={() => setFacilitySearch("")}
                                style={{
                                  padding: "6px 14px",
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                सर्च साफ़ करें (Clear Search)
                              </button>
                            )}
                            {facilityBlockFilter !== "ALL" && (
                              <button
                                type="button"
                                onClick={() => setFacilityBlockFilter("ALL")}
                                style={{
                                  padding: "6px 14px",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #bfdbfe",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                सभी 21 ब्लॉक देखें (All Blocks)
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {filteredSearchFacilities.map((fac) => {
                            const facName = fac.name;
                            const isInactive = facilityStatus[facName]?.isActive === false;
                            return (
                              <div
                                key={facName}
                                onClick={() => {
                                  if (isInactive) return;
                                  setForm((p) => ({
                                    ...p,
                                    facility: facName,
                                    child: {
                                      ...p.child,
                                      placeOfBirth: "Hospital",
                                    },
                                  }));
                                  setFacilityDropdownOpen(false);
                                  setFacilitySearch("");
                                }}
                                style={{
                                  padding: "11px 16px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: isInactive ? "not-allowed" : "pointer",
                                  opacity: isInactive ? 0.6 : 1,
                                  background: isInactive ? "#fafafa" : "#ffffff",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isInactive) e.currentTarget.style.background = "#f0f9ff";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isInactive) e.currentTarget.style.background = "#ffffff";
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                  <span style={{ fontSize: 20, flexShrink: 0 }}>{fac.icon || "🏥"}</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                      <span
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 700,
                                          padding: "1px 6px",
                                          borderRadius: 4,
                                          background: fac.badgeBg || "#eff6ff",
                                          color: fac.badgeColor || "#1e40af",
                                          border: `1px solid ${fac.badgeBorder || "#bfdbfe"}`,
                                        }}
                                      >
                                        {fac.tag || fac.type || "HSC"}
                                      </span>
                                      <strong style={{ fontSize: 13.5, color: "#0f172a" }}>{facName}</strong>
                                    </div>
                                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                                      📍 <strong>{fac.block}</strong> Block {fac.pin ? `• PIN: ${fac.pin}` : ""}
                                      {fac.address && fac.address !== facName ? ` • ${fac.address.slice(0, 55)}` : ""}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ flexShrink: 0, textAlign: "right" }}>
                                  {isInactive ? (
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        color: "#dc2626",
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        padding: "2px 7px",
                                        borderRadius: 99,
                                      }}
                                    >
                                      ⚠️ Suspended
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#2563eb",
                                        background: "#eff6ff",
                                        border: "1px solid #dbeafe",
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                      }}
                                    >
                                      चुनें (Select)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sticky List Footer */}
                    <div
                      data-lenis-prevent="true"
                      onWheel={(e) => {
                        e.stopPropagation();
                        if (facilityListScrollRef.current) {
                          facilityListScrollRef.current.scrollTop += e.deltaY;
                        }
                      }}
                      style={{
                        position: "sticky",
                        bottom: 0,
                        background: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        padding: "8px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#64748b",
                        zIndex: 5,
                      }}
                    >
                      <span>
                        दिखाए जा रहे हैं: <strong>{filteredSearchFacilities.length}</strong> / <strong>{facilitiesList.length}</strong> अस्पताल
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden input for HTML form validation */}
            <input
              type="text"
              name="facility_validator"
              value={form.facility}
              onChange={() => {}}
              required
              style={{
                opacity: 0,
                height: 0,
                width: 0,
                padding: 0,
                margin: 0,
                border: "none",
                position: "absolute",
                pointerEvents: "none",
              }}
              tabIndex={-1}
            />

            {form.facility && facilityStatus[form.facility]?.isActive === false && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1.5px solid #fecaca",
                  borderRadius: 8,
                  color: "#dc2626",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>सत्यापन इकाई निष्क्रिय (Facility Suspended):</strong> ऑपरेटर सेंट्रल द्वारा इस अस्पताल की सत्यापन इकाई को निष्क्रिय किया गया है। वर्तमान में इस केंद्र के लिए नया आवेदन स्वीकार्य नहीं है। कृपया &ldquo;अस्पताल बदलें&rdquo; पर क्लिक करके दूसरा अस्पताल चुनें।
                </span>
              </div>
            )}
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

            {/* Left Column: Gender and Place of Birth placed directly one below the other */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="लिंग (Gender)" required>
                <select
                  suppressHydrationWarning
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
                label="जन्म का स्थान (Place of Birth)"
                hint={form.facility && form.child.placeOfBirth === "Hospital" ? `अस्पताल चयन के अनुसार स्वतः चयनित (${form.facility})` : undefined}
                required
              >
                <select
                  suppressHydrationWarning
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
            </div>

            {/* Right Column: Child's Aadhaar Number & Aadhaar Upload */}
            <div>
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
              <AadhaarUpload
                label="शिशु का आधार कार्ड (Child's Aadhaar Card)"
                hint="यदि शिशु का आधार उपलब्ध हो • PDF, JPG, PNG • अधिकतम 1MB, केवल 1 फ़ाइल"
                holder="child"
                value={form.child.adharCardUrl}
                onChange={(url) => update("child", "adharCardUrl", url || "")}
                onUploadingChange={(loading) => handleUploadingDocChange("child", loading)}
              />
            </div>
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
                <Field label="अनुमंडल / उप-जिला (Sub-Division / Sub-District)" required>
                  <select
                    suppressHydrationWarning
                    style={inputStyle}
                    value={form.birthPlaceAddress.subDistrict}
                    onChange={(e) => handleSubDistrictChange("birthPlaceAddress", e.target.value)}
                    required
                  >
                    <option value="">-- अनुमंडल चुनें (Select Sub-Division) --</option>
                    {subDivisionsList.map((sub) => (
                      <option key={sub.id || sub.code} value={sub.displayName || sub.name}>
                        {sub.displayName || `${sub.name}/${sub.nameHi}`}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="प्रखंड (Block)" required>
                  <select
                    suppressHydrationWarning
                    style={{
                      ...inputStyle,
                      cursor: form.birthPlaceAddress.subDistrict ? "pointer" : "not-allowed",
                      background: form.birthPlaceAddress.subDistrict ? "white" : "#f9fafb",
                    }}
                    value={form.birthPlaceAddress.block}
                    onChange={(e) => update("birthPlaceAddress", "block", e.target.value)}
                    required
                    disabled={!form.birthPlaceAddress.subDistrict}
                  >
                    <option value="">
                      {form.birthPlaceAddress.subDistrict
                        ? "-- प्रखंड चुनें (Select Block) --"
                        : "-- पहले अनुमंडल चुनें (Select Sub-Division first) --"}
                    </option>
                    {getBlocksForSubDivision(form.birthPlaceAddress.subDistrict, subDivisionsList).map((b) => (
                      <option key={b.id || b.code} value={b.displayName || b.name}>
                        {b.displayName || `${b.name}/${b.nameHi}`}
                      </option>
                    ))}
                  </select>
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
                <Field
                  label="पिनकोड (PIN Code)"
                  required
                  hint={
                    form.birthPlaceAddress.pinCode.length === 6
                      ? isValidMadhubaniPincode(form.birthPlaceAddress.pinCode)
                        ? "✓ मान्य मधुबनी पिनकोड (Valid Madhubani PIN code)"
                        : "⚠️ यह पिनकोड मधुबनी जिले की सूची में नहीं है (Not in official Madhubani list)"
                      : "6 अंकों का पिनकोड दर्ज करें (Enter 6-digit PIN)"
                  }
                >
                  <input
                    style={{
                      ...inputStyle,
                      borderColor:
                        form.birthPlaceAddress.pinCode.length === 6
                          ? isValidMadhubaniPincode(form.birthPlaceAddress.pinCode)
                            ? "#16a34a"
                            : "#f59e0b"
                          : undefined,
                    }}
                    maxLength={6}
                    placeholder="उदा० 847211"
                    value={form.birthPlaceAddress.pinCode}
                    onChange={(e) => handlePincodeChange("birthPlaceAddress", e.target.value)}
                    required
                  />
                </Field>
                <Field
                  label="डाकघर (Post Office)"
                  required
                  hint={
                    form.birthPlaceAddress.pinCode.length === 6
                      ? getPostOfficesForPincode(form.birthPlaceAddress.pinCode, postOfficesList).length > 0
                        ? `${getPostOfficesForPincode(form.birthPlaceAddress.pinCode, postOfficesList).length} डाकघर उपलब्ध (available)`
                        : "इस पिनकोड के लिए कोई डाकघर नहीं मिला"
                      : "पहले 6 अंकों का पिनकोड दर्ज करें"
                  }
                >
                  <select
                    suppressHydrationWarning
                    style={{
                      ...inputStyle,
                      cursor: form.birthPlaceAddress.pinCode.length === 6 ? "pointer" : "not-allowed",
                      background: form.birthPlaceAddress.pinCode.length === 6 ? "white" : "#f9fafb",
                    }}
                    value={form.birthPlaceAddress.postOffice}
                    onChange={(e) => update("birthPlaceAddress", "postOffice", e.target.value)}
                    required
                    disabled={form.birthPlaceAddress.pinCode.length !== 6}
                  >
                    <option value="">
                      {form.birthPlaceAddress.pinCode.length === 6
                        ? "-- डाकघर चुनें (Select Post Office) --"
                        : "-- पहले पिनकोड दर्ज करें (Enter PIN Code first) --"}
                    </option>
                    {getPostOfficesForPincode(form.birthPlaceAddress.pinCode, postOfficesList).map((po) => (
                      <option key={po.id || po.name} value={po.name}>
                        {po.name}
                      </option>
                    ))}
                  </select>
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
            <Field label="मोबाईल नं० (Mobile Number)" hint={renderMobileHint(form.mother.mobileNumber)} required>
              <input
                type="tel"
                style={inputStyle}
                placeholder="+91 98765 43210"
                maxLength={15}
                value={form.mother.mobileNumber}
                onChange={(e) => handleMobileChange("mother", "mobileNumber", e.target.value, form.mother.mobileNumber)}
                required
              />
            </Field>
            <div>
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
              <AadhaarUpload
                label="माता का आधार कार्ड अपलोड करें (Upload Mother's Aadhaar Card)"
                hint="PDF, JPG, PNG • अधिकतम 1 MB, केवल 1 फ़ाइल"
                holder="mother"
                value={form.mother.adharCardUrl}
                onChange={(url) => update("mother", "adharCardUrl", url || "")}
                onUploadingChange={(loading) => handleUploadingDocChange("mother", loading)}
              />
            </div>
            <Field label="ईमेल आई० डी० (Email ID)" hint={renderEmailHint(form.mother.email, false)}>
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
            <Field label="मोबाईल नं० (Mobile Number)" hint={renderMobileHint(form.father.mobileNumber)} required>
              <input
                type="tel"
                style={inputStyle}
                placeholder="+91 98765 43210"
                maxLength={15}
                value={form.father.mobileNumber}
                onChange={(e) => handleMobileChange("father", "mobileNumber", e.target.value, form.father.mobileNumber)}
                required
              />
            </Field>
            <div>
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
              <AadhaarUpload
                label="पिता का आधार कार्ड अपलोड करें (Upload Father's Aadhaar Card)"
                hint="PDF, JPG, PNG • अधिकतम 1 MB, केवल 1 फ़ाइल"
                holder="father"
                value={form.father.adharCardUrl}
                onChange={(url) => update("father", "adharCardUrl", url || "")}
                onUploadingChange={(loading) => handleUploadingDocChange("father", loading)}
              />
            </div>
            <Field label="ईमेल आई० डी० (Email ID)" hint={renderEmailHint(form.father.email, false)}>
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
            <Field label="अनुमंडल / उप-जिला (Sub-Division / Sub-District)" required>
              <select
                suppressHydrationWarning
                style={inputStyle}
                value={form.address.subDistrict}
                onChange={(e) => handleSubDistrictChange("address", e.target.value)}
                required
              >
                <option value="">-- अनुमंडल चुनें (Select Sub-Division) --</option>
                {subDivisionsList.map((sub) => (
                  <option key={sub.id || sub.code} value={sub.displayName || sub.name}>
                    {sub.displayName || `${sub.name}/${sub.nameHi}`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="प्रखंड (Block)" required>
              <select
                suppressHydrationWarning
                style={{
                  ...inputStyle,
                  cursor: form.address.subDistrict ? "pointer" : "not-allowed",
                  background: form.address.subDistrict ? "white" : "#f9fafb",
                }}
                value={form.address.block}
                onChange={(e) => update("address", "block", e.target.value)}
                required
                disabled={!form.address.subDistrict}
              >
                <option value="">
                  {form.address.subDistrict
                    ? "-- प्रखंड चुनें (Select Block) --"
                    : "-- पहले अनुमंडल चुनें (Select Sub-Division first) --"}
                </option>
                {getBlocksForSubDivision(form.address.subDistrict, subDivisionsList).map((b) => (
                  <option key={b.id || b.code} value={b.displayName || b.name}>
                    {b.displayName || `${b.name}/${b.nameHi}`}
                  </option>
                ))}
              </select>
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
            <Field
              label="पिनकोड (PIN Code)"
              required
              hint={
                form.address.pinCode.length === 6
                  ? isValidMadhubaniPincode(form.address.pinCode)
                    ? "✓ मान्य मधुबनी पिनकोड (Valid Madhubani PIN code)"
                    : "⚠️ यह पिनकोड मधुबनी जिले की सूची में नहीं है (Not in official Madhubani list)"
                  : "6 अंकों का पिनकोड दर्ज करें (Enter 6-digit PIN)"
              }
            >
              <input
                style={{
                  ...inputStyle,
                  borderColor:
                    form.address.pinCode.length === 6
                      ? isValidMadhubaniPincode(form.address.pinCode)
                        ? "#16a34a"
                        : "#f59e0b"
                      : undefined,
                }}
                maxLength={6}
                placeholder="उदा० 847211"
                value={form.address.pinCode}
                onChange={(e) => handlePincodeChange("address", e.target.value)}
                required
              />
            </Field>
            <Field
              label="डाकघर (Post Office)"
              required
              hint={
                form.address.pinCode.length === 6
                  ? getPostOfficesForPincode(form.address.pinCode, postOfficesList).length > 0
                    ? `${getPostOfficesForPincode(form.address.pinCode, postOfficesList).length} डाकघर उपलब्ध (available)`
                    : "इस पिनकोड के लिए कोई डाकघर नहीं मिला"
                  : "पहले 6 अंकों का पिनकोड दर्ज करें"
              }
            >
              <select
                suppressHydrationWarning
                style={{
                  ...inputStyle,
                  cursor: form.address.pinCode.length === 6 ? "pointer" : "not-allowed",
                  background: form.address.pinCode.length === 6 ? "white" : "#f9fafb",
                }}
                value={form.address.postOffice}
                onChange={(e) => update("address", "postOffice", e.target.value)}
                required
                disabled={form.address.pinCode.length !== 6}
              >
                <option value="">
                  {form.address.pinCode.length === 6
                    ? "-- डाकघर चुनें (Select Post Office) --"
                    : "-- पहले पिनकोड दर्ज करें (Enter PIN Code first) --"}
                </option>
                {getPostOfficesForPincode(form.address.pinCode, postOfficesList).map((po) => (
                  <option key={po.id || po.name} value={po.name}>
                    {po.name}
                  </option>
                ))}
              </select>
            </Field>
          </Grid>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                suppressHydrationWarning
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
              <Field label="अनुमंडल / उप-जिला (Sub-Division / Sub-District)" required>
                <select
                  suppressHydrationWarning
                  style={inputStyle}
                  value={form.permanentAddress.subDistrict}
                  onChange={(e) => handleSubDistrictChange("permanentAddress", e.target.value)}
                  required={!form.sameAddress}
                >
                  <option value="">-- अनुमंडल चुनें (Select Sub-Division) --</option>
                  {subDivisionsList.map((sub) => (
                    <option key={sub.id || sub.code} value={sub.displayName || sub.name}>
                      {sub.displayName || `${sub.name}/${sub.nameHi}`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="प्रखंड (Block)" required>
                <select
                  suppressHydrationWarning
                  style={{
                    ...inputStyle,
                    cursor: form.permanentAddress.subDistrict ? "pointer" : "not-allowed",
                    background: form.permanentAddress.subDistrict ? "white" : "#f9fafb",
                  }}
                  value={form.permanentAddress.block}
                  onChange={(e) => update("permanentAddress", "block", e.target.value)}
                  required={!form.sameAddress}
                  disabled={!form.permanentAddress.subDistrict}
                >
                  <option value="">
                    {form.permanentAddress.subDistrict
                      ? "-- प्रखंड चुनें (Select Block) --"
                      : "-- पहले अनुमंडल चुनें (Select Sub-Division first) --"}
                  </option>
                  {getBlocksForSubDivision(form.permanentAddress.subDistrict, subDivisionsList).map((b) => (
                    <option key={b.id || b.code} value={b.displayName || b.name}>
                      {b.displayName || `${b.name}/${b.nameHi}`}
                    </option>
                  ))}
                </select>
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
              <Field
                label="पिनकोड (PIN Code)"
                required
                hint={
                  form.permanentAddress.pinCode.length === 6
                    ? isValidMadhubaniPincode(form.permanentAddress.pinCode)
                      ? "✓ मान्य मधुबनी पिनकोड (Valid Madhubani PIN code)"
                      : "⚠️ यह पिनकोड मधुबनी जिले की सूची में नहीं है (Not in official Madhubani list)"
                    : "6 अंकों का पिनकोड दर्ज करें (Enter 6-digit PIN)"
                }
              >
                <input
                  style={{
                    ...inputStyle,
                    borderColor:
                      form.permanentAddress.pinCode.length === 6
                        ? isValidMadhubaniPincode(form.permanentAddress.pinCode)
                          ? "#16a34a"
                          : "#f59e0b"
                        : undefined,
                  }}
                  maxLength={6}
                  placeholder="उदा० 847211"
                  value={form.permanentAddress.pinCode}
                  onChange={(e) => handlePincodeChange("permanentAddress", e.target.value)}
                  required={!form.sameAddress}
                />
              </Field>
              <Field
                label="डाकघर (Post Office)"
                required
                hint={
                  form.permanentAddress.pinCode.length === 6
                    ? getPostOfficesForPincode(form.permanentAddress.pinCode, postOfficesList).length > 0
                      ? `${getPostOfficesForPincode(form.permanentAddress.pinCode, postOfficesList).length} डाकघर उपलब्ध (available)`
                      : "इस पिनकोड के लिए कोई डाकघर नहीं मिला"
                    : "पहले 6 अंकों का पिनकोड दर्ज करें"
                }
              >
                <select
                  suppressHydrationWarning
                  style={{
                    ...inputStyle,
                    cursor: form.permanentAddress.pinCode.length === 6 ? "pointer" : "not-allowed",
                    background: form.permanentAddress.pinCode.length === 6 ? "white" : "#f9fafb",
                  }}
                  value={form.permanentAddress.postOffice}
                  onChange={(e) => update("permanentAddress", "postOffice", e.target.value)}
                  required={!form.sameAddress}
                  disabled={form.permanentAddress.pinCode.length !== 6}
                >
                  <option value="">
                    {form.permanentAddress.pinCode.length === 6
                      ? "-- डाकघर चुनें (Select Post Office) --"
                      : "-- पहले पिनकोड दर्ज करें (Enter PIN Code first) --"}
                  </option>
                  {getPostOfficesForPincode(form.permanentAddress.pinCode, postOfficesList).map((po) => (
                    <option key={po.id || po.name} value={po.name}>
                      {po.name}
                    </option>
                  ))}
                </select>
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
                  suppressHydrationWarning
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
                  suppressHydrationWarning
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
                  suppressHydrationWarning
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
                  suppressHydrationWarning
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
              required
            >
              <select
                suppressHydrationWarning
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

            <Field label="मोबाईल नं० (Mobile Number)" hint={renderMobileHint(form.informationProvider.mobileNumber)} required>
              <input
                type="tel"
                style={inputStyle}
                placeholder="+91 98765 43210"
                maxLength={15}
                value={form.informationProvider.mobileNumber}
                onChange={(e) => handleMobileChange("informationProvider", "mobileNumber", e.target.value, form.informationProvider.mobileNumber)}
                required
              />
            </Field>

            <Field
              label="ईमेल आई० डी० (Email Address for Official Tracking)"
              hint={renderEmailHint(form.informationProvider.email, true)}
              required
            >
              <input
                type="email"
                style={inputStyle}
                placeholder="applicant@example.com"
                value={form.informationProvider.email}
                onChange={(e) => update("informationProvider", "email", e.target.value)}
                required
              />
            </Field>

            <div>
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
              <AadhaarUpload
                label="सूचनादाता का आधार कार्ड अपलोड करें (Upload Informant's Aadhaar Card)"
                hint="PDF, JPG, PNG • अधिकतम 1 MB, केवल 1 फ़ाइल"
                holder="informant"
                value={form.informationProvider.adharCardUrl}
                onChange={(url) => update("informationProvider", "adharCardUrl", url || "")}
                onUploadingChange={(loading) => handleUploadingDocChange("informant", loading)}
              />
            </div>
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

