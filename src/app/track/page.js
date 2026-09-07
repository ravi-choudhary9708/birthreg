"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function TrackPage() {
  const [step, setStep] = useState("APP_NUMBER"); // "APP_NUMBER" | "OTP"
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP State
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  const router = useRouter();
  const containerRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Auto-read ?app= query param if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get("app");
      if (appParam) {
        setValue(appParam.trim().toUpperCase());
      }
    }
  }, []);

  // Initial entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".anim-track-header", {
        y: -15,
        opacity: 0,
        duration: 0.6,
      })
        .from(
          ".anim-track-seal",
          {
            scale: 0.8,
            opacity: 0,
            duration: 0.65,
            ease: "back.out(1.7)",
          },
          "-=0.2"
        )
        .from(
          ".anim-track-badge",
          {
            y: 12,
            opacity: 0,
            duration: 0.45,
          },
          "-=0.3"
        )
        .from(
          ".anim-track-title",
          {
            y: 18,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.3"
        )
        .from(
          ".anim-track-card",
          {
            y: 25,
            scale: 0.97,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          },
          "-=0.25"
        )
        .from(
          ".anim-track-cta",
          {
            y: 12,
            opacity: 0,
            duration: 0.4,
            ease: "back.out(1.4)",
          },
          "-=0.2"
        );

      gsap.to(".anim-track-seal", {
        y: -4,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your Application Number");
      return;
    }

    setLoading(true);
    setError("");
    setResendNotice("");

    try {
      const res = await fetch("/api/track/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationNumber: trimmed }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to send verification OTP");
      }

      setMaskedEmail(json.data.maskedEmail || "your linked email");
      setStep("OTP");
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");

      // Focus first OTP input after DOM renders
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err.message || "Unable to send OTP. Please verify your application number.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP Input Navigation
  const handleOtpChange = (index, e) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, "");

    // If user typed/pasted multiple digits into one cell
    if (digitsOnly.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digitsOnly[i] || "";
      }
      setOtp(newOtp);
      setOtpError("");
      const focusIndex = Math.min(digitsOnly.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
      return;
    }

    const singleDigit = digitsOnly.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);
    setOtpError("");

    // Auto-advance to next input
    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    setOtpError("");

    const targetIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[targetIdx]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join("").trim();

    if (code.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code");
      return;
    }

    setVerifying(true);
    setOtpError("");

    try {
      const res = await fetch("/api/track/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationNumber: value.trim().toUpperCase(),
          otp: code,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Invalid verification code");
      }

      setVerifiedSuccess(true);

      // Open application details
      setTimeout(() => {
        router.push(`/track/${value.trim().toUpperCase()}`);
      }, 700);
    } catch (err) {
      setOtpError(err.message || "Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setOtpError("");
    setResendNotice("");

    try {
      const res = await fetch("/api/track/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationNumber: value.trim().toUpperCase() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to resend code");
      }

      setResendCooldown(30);
      setResendNotice("A new 6-digit verification code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setOtpError(err.message || "Unable to resend OTP at this time");
    } finally {
      setResending(false);
    }
  };

  const handleBackToAppNumber = () => {
    setStep("APP_NUMBER");
    setOtpError("");
    setError("");
    setResendNotice("");
    setOtp(["", "", "", "", "", ""]);
  };

  const styles = `
    .track-btn {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
    }
    .track-btn:hover:not(:disabled) {
      background: #1e3a8a !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(30,64,175,0.35) !important;
    }
    .track-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    .otp-input-box {
      width: clamp(40px, 11vw, 52px);
      height: clamp(48px, 12vw, 58px);
      text-align: center;
      font-size: clamp(20px, 4.5vw, 26px);
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      border-radius: 10px;
      border: 2px solid #cbd5e1;
      background: #ffffff;
      color: #0f172a;
      outline: none;
      transition: all 0.15s ease-in-out;
    }
    .otp-input-box:focus {
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.15);
      background: #eff6ff;
    }
    .otp-input-box.filled {
      border-color: #3b82f6;
      background: #f8fafc;
      color: #1e40af;
    }
  `;

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{styles}</style>

      {/* Header */}
      <div
        className="anim-track-header"
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  background: "#eff6ff",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #bfdbfe",
                }}
              >
                <img
                  src="/baby_birth.svg"
                  alt="Government of Bihar Emblem"
                  style={{ width: 28, height: 28, objectFit: "contain" }}
                />
              </div>
              <div>
                <p
                  style={{
                    color: "#1e40af",
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: 1.2,
                  }}
                >
                  District Administration
                </p>
                <p style={{ color: "#6b7280", fontSize: 11 }}>
                  Civil Registration System • Madhubani
                </p>
              </div>
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/apply"
              style={{
                fontSize: 13,
                color: "#1e40af",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #bfdbfe",
                textDecoration: "none",
                background: "#eff6ff",
              }}
            >
              Apply Online
            </Link>
            <Link
              href="/"
              style={{
                fontSize: 13,
                color: "#6b7280",
                fontWeight: 500,
                padding: "6px 12px",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 44px) 16px",
        }}
      >
        <div style={{ maxWidth: 490, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              className="anim-track-seal"
              style={{
                width: 76,
                height: 76,
                margin: "0 auto 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/baby_birth.svg"
                alt="Government of Bihar - Madhubani District Emblem"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            <div
              className="anim-track-badge"
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "#dbeafe",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                color: "#1e40af",
                marginBottom: 10,
              }}
            >
              Government of Bihar • Civil Registration System
            </div>

            <div className="anim-track-title">
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Track Application Status
              </h1>
              <p style={{ color: "#6b7280", fontSize: 13.5, lineHeight: 1.5 }}>
                {step === "APP_NUMBER"
                  ? "Enter your official Application Number to receive a 6-digit secure OTP on your linked email."
                  : "Enter the 6-digit verification code sent to your registered email address to view records."}
              </p>
            </div>
          </div>

          <div
            id="main-content"
            tabIndex={-1}
            className="anim-track-card"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: "clamp(22px, 5vw, 32px) clamp(16px, 4vw, 26px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              scrollMarginTop: "90px",
              outline: "none",
            }}
          >
            {/* ========================================================================= */}
            {/* STEP 1: APPLICATION NUMBER ENTRY */}
            {/* ========================================================================= */}
            {step === "APP_NUMBER" && (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: 18 }}>
                  <label
                    htmlFor="applicationNumberInput"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Application Number (आवेदन संख्या)
                  </label>
                  <input
                    id="applicationNumberInput"
                    type="text"
                    autoComplete="off"
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1.5px solid ${error ? "#fca5a5" : "#cbd5e1"}`,
                      borderRadius: 10,
                      fontSize: 15,
                      color: "#111827",
                      background: "white",
                      letterSpacing: "clamp(1px, 0.4vw, 2px)",
                      fontWeight: 600,
                      minHeight: 46,
                      textTransform: "uppercase",
                      outline: "none",
                    }}
                    placeholder="e.g. APP-2026-S3SJCQ"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value.toUpperCase());
                      setError("");
                    }}
                  />
                  {error && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <p style={{ color: "#dc2626", fontSize: 12.5, margin: 0, fontWeight: 500 }}>
                        {error}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="track-btn anim-track-cta"
                  style={{
                    width: "100%",
                    padding: "13px 18px",
                    background: loading ? "#93c5fd" : "#1e40af",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(30,64,175,0.25)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin"
                        style={{ width: 18, height: 18 }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Checking Application & Sending OTP...
                    </>
                  ) : (
                    "Send 6-Digit OTP to Email →"
                  )}
                </button>

                <div
                  style={{
                    marginTop: 22,
                    padding: "14px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                  }}
                >
                  <p style={{ fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    🔐 <strong>Identity Protection:</strong> To ensure sensitive birth records remain confidential, a 6-digit random code will be sent to the email address registered with this application.
                  </p>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
            {/* ========================================================================= */}
            {step === "OTP" && (
              <form onSubmit={handleVerifyOtp}>
                {/* Header Summary Pill */}
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 22,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Application Verification
                    </span>
                    <button
                      type="button"
                      onClick={handleBackToAppNumber}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      Change Number
                    </button>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", margin: "0 0 4px 0", letterSpacing: 1 }}>
                    {value}
                  </p>
                  <p style={{ fontSize: 12, color: "#3b82f6", margin: 0 }}>
                    ✉️ 6-Digit code dispatched to: <strong>{maskedEmail}</strong>
                  </p>
                </div>

                {/* 6-Digit Code Inputs */}
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#374151",
                      marginBottom: 12,
                      textAlign: "center",
                    }}
                  >
                    Enter 6-Digit Random OTP (ओटीपी दर्ज करें)
                  </label>

                  <div
                    onPaste={handleOtpPaste}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "clamp(6px, 1.8vw, 10px)",
                      marginBottom: 10,
                    }}
                  >
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`otp-input-box ${digit ? "filled" : ""}`}
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "8px 12px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <p style={{ color: "#dc2626", fontSize: 12.5, margin: 0, fontWeight: 500 }}>
                        {otpError}
                      </p>
                    </div>
                  )}

                  {resendNotice && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "8px 12px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>✅</span>
                      <p style={{ color: "#16a34a", fontSize: 12.5, margin: 0, fontWeight: 500 }}>
                        {resendNotice}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={verifying || verifiedSuccess || otp.join("").length !== 6}
                  className="track-btn"
                  style={{
                    width: "100%",
                    padding: "13px 18px",
                    background:
                      verifiedSuccess
                        ? "#16a34a"
                        : otp.join("").length === 6 && !verifying
                        ? "#1e40af"
                        : "#93c5fd",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor:
                      otp.join("").length === 6 && !verifying && !verifiedSuccess
                        ? "pointer"
                        : "not-allowed",
                    boxShadow: "0 2px 8px rgba(30,64,175,0.25)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {verifiedSuccess ? (
                    "✓ OTP Matched! Opening Application Details..."
                  ) : verifying ? (
                    <>
                      <svg
                        className="animate-spin"
                        style={{ width: 18, height: 18 }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Matching OTP Code...
                    </>
                  ) : (
                    "Verify OTP & View Details →"
                  )}
                </button>

                {/* Resend OTP & Help */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTop: "1px solid #f1f5f9",
                    fontSize: 12.5,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleBackToAppNumber}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    ← Back to input
                  </button>

                  {resendCooldown > 0 ? (
                    <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                      Resend OTP in <strong>{resendCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#1e40af",
                        fontWeight: 700,
                        cursor: resending ? "not-allowed" : "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      {resending ? "Sending..." : "Didn't receive? Resend OTP"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Haven&apos;t applied yet?{" "}
              <Link href="/apply" style={{ color: "#1e40af", fontWeight: 600 }}>
                Apply Now →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
