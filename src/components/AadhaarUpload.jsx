"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, ExternalLink, Loader2, Image as ImageIcon } from "lucide-react";
import { getDocumentViewUrl } from "@/utils/documentViewer";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB limit
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function AadhaarUpload({
  label = "आधार कार्ड अपलोड करें (Upload Aadhaar Card)",
  hint = "PDF, JPG, JPEG, PNG • अधिकतम 1 MB (Max 1MB) • केवल 1 फ़ाइल (1 file only)",
  holder = "document",
  value = "",
  onChange,
  onUploadingChange,
  required = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState(null);
  const fileInputRef = useRef(null);

  const onUploadingChangeRef = useRef(onUploadingChange);
  useEffect(() => {
    onUploadingChangeRef.current = onUploadingChange;
  }, [onUploadingChange]);

  useEffect(() => {
    return () => {
      if (uploading) {
        onUploadingChangeRef.current?.(false);
      }
    };
  }, [uploading]);

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = async (file) => {
    if (!file) return;

    // 1. Strictly validate file size: Max 1MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2);
      setError(`फ़ाइल का आकार 1MB से अधिक है (${sizeStr} MB)। कृपया 1MB से छोटी फ़ाइल अपलोड करें। (File size exceeds 1MB limit)`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Validate file type: PDF and all common image formats
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isAllowedExt = ["pdf", "jpg", "jpeg", "png", "webp"].includes(ext);
    const isAllowedMime = ALLOWED_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith("image/");

    if (!isAllowedExt && !isAllowedMime) {
      setError("केवल PDF एवं इमेज (JPG, JPEG, PNG, WEBP) फ़ाइलें समर्थित हैं। (Only PDF and image formats are allowed)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    setUploading(true);
    onUploadingChangeRef.current?.(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("holder", holder);

      const res = await fetch("/api/upload/aadhaar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "आधार कार्ड अपलोड विफल रहा (Upload failed)");
      }

      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);
      if (onChange) {
        onChange(json.data.url);
      }
    } catch (err) {
      console.error("Aadhaar upload error:", err);
      setError(err.message || "अपलोड करते समय त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setUploading(false);
      onUploadingChangeRef.current?.(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setError(null);
    setUploadedFileName("");
    setUploadedFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onChange) onChange("");
  };

  const isPdf = Boolean(
    (uploadedFileName && uploadedFileName.toLowerCase().endsWith(".pdf")) ||
    (value && value.toLowerCase().includes(".pdf"))
  );

  return (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      {label && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 6,
          }}
        >
          <span>
            {label}
            {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280" }}>
            (अधिकतम 1MB, केवल 1 फ़ाइल)
          </span>
        </label>
      )}

      {/* Hidden file input strictly allowing 1 file */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        multiple={false}
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: "none" }}
        disabled={uploading}
      />

      {/* State 1: Uploading State */}
      {uploading && (
        <div
          style={{
            padding: "14px 16px",
            background: "#eff6ff",
            border: "1.5px dashed #3b82f6",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Loader2 size={20} className="animate-spin" style={{ color: "#2563eb", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e40af" }}>
              Cloudinary पर अपलोड हो रहा है... (Uploading to Cloudinary...)
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#3b82f6" }}>
              कृपया प्रतीक्षा करें, दस्तावेज़ सत्यापित किया जा रहा है
            </p>
          </div>
        </div>
      )}

      {/* State 2: Uploaded Success State */}
      {!uploading && value && (
        <div
          style={{
            padding: "12px 14px",
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: isPdf ? "#fee2e2" : "#e0e7ff",
                color: isPdf ? "#dc2626" : "#4338ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#166534",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={uploadedFileName || "Aadhaar Card Document"}
                >
                  {uploadedFileName || (isPdf ? "Aadhaar_Document.pdf" : "Aadhaar_Document.jpg")}
                </span>
                {uploadedFileSize && (
                  <span style={{ fontSize: 11, color: "#15803d", fontWeight: 500, flexShrink: 0 }}>
                    ({formatFileSize(uploadedFileSize)})
                  </span>
                )}
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#15803d" }}>
                ✓ Cloudinary पर सुरक्षित रूप से संग्रहीत (Stored on Cloudinary)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <a
              href={getDocumentViewUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "6px 12px",
                background: "#16a34a",
                color: "white",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                transition: "background 0.2s",
              }}
              title="दस्तावेज़ नए टैब में देखें (View document in new tab)"
            >
              <ExternalLink size={13} /> देखें (View)
            </a>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                padding: "6px 10px",
                background: "white",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#dc2626",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title="दस्तावेज़ हटाएँ या दूसरा अपलोड करें (Remove or replace file)"
            >
              <Trash2 size={13} /> हटाएँ (Remove)
            </button>
          </div>
        </div>
      )}

      {/* State 3: Empty / Select File State */}
      {!uploading && !value && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "1.5px dashed #cbd5e1",
            borderRadius: 10,
            padding: "14px 16px",
            background: "#f8fafc",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.background = "#eff6ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.background = "#f8fafc";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#e2e8f0",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Upload size={16} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                आधार कार्ड फ़ाइल चुनें (Choose Aadhaar Card)
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                {hint}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            style={{
              padding: "6px 12px",
              background: "#1e40af",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
            }}
          >
            <Upload size={13} /> अपलोड (Upload)
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: 6,
            padding: "8px 12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#dc2626",
            fontSize: 12,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
