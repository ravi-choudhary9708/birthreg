import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

function formatDate(date) {
    if (!date) return "";
    try {
        const d = new Date(date);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(date);
    }
}

/**
 * Shared email header
 */
function getEmailHeader() {
    return `
    <div style="background: #1e40af; padding: 28px 24px; text-align: center;">
      <div style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.15); border-radius: 100px; margin-bottom: 10px;">
        <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">
          Government of Bihar • District Administration Madhubani
        </span>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.3px;">
        Birth Certificate Portal
      </h1>
      <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
        Civil Registration System (CRS) • Madhubani District
      </p>
    </div>
    `;
}

/**
 * Shared email footer
 */
function getEmailFooter(baseUrl) {
    return `
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #374151; font-size: 13px; font-weight: 700; margin: 0 0 4px 0;">
        District Health Society & Civil Surgeon Office
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 12px 0;">
        Madhubani District, Bihar — 847211
      </p>
      <div style="margin: 12px 0;">
        <a href="${baseUrl}" style="color: #1e40af; text-decoration: none; font-size: 13px; font-weight: 600; padding: 6px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
          🌐 Visit Official Portal
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 11px; margin: 16px 0 0 0; line-height: 1.5;">
        This is an automated administrative notification from the Civil Registration System (CRS), Government of Bihar.<br/>
        Please do not reply directly to this email. For any queries, please visit your local registration facility.
      </p>
    </div>
    `;
}

/**
 * Send application received confirmation email to parent
 */
export async function sendApplicationReceivedEmail({
    parentEmail,
    parentName,
    applicationNumber,
    facility,
    childName,
    dateOfBirth,
    gender,
}) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}/track/${applicationNumber}`;
    const todayFormatted = formatDate(new Date());

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Received - ${applicationNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px 10px; -webkit-text-size-adjust: none;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            ${getEmailHeader()}
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 28px;">
            <!-- Status Alert Banner -->
            <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">📋</span>
                <h2 style="color: #1e40af; font-size: 17px; font-weight: 700; margin: 0;">
                  Application Submitted Successfully
                </h2>
              </div>
              <p style="color: #374151; font-size: 13px; margin: 6px 0 0 0; line-height: 1.5;">
                Your request has been registered in the system and forwarded to the verification authority at <strong>${facility}</strong>.
              </p>
            </div>

            <!-- Greeting -->
            <p style="color: #111827; font-size: 15px; margin: 0 0 12px 0;">
              Dear <strong>${parentName || "Parent / Guardian"}</strong>,
            </p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for applying through the official online birth registration portal. Your application has been logged and assigned an official tracking number.
            </p>

            <!-- Application Number Card -->
            <div style="background: #f8fafc; border: 2px dashed #bfdbfe; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="color: #6b7280; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 6px 0;">
                Official Application Number
              </p>
              <p style="color: #1e40af; font-size: 26px; font-weight: 800; letter-spacing: 2px; margin: 0;">
                ${applicationNumber}
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0 0;">
                (Please save this number for tracking and future communication)
              </p>
            </div>

            <!-- Application Data Table -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 28px; font-size: 13px;">
              <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <td colspan="2" style="padding: 10px 16px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb;">
                  Application Summary
                </td>
              </tr>
              ${childName ? `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; width: 40%; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Child's Name</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${childName}</td>
              </tr>
              ` : ""}
              ${dateOfBirth ? `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Date of Birth</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${formatDate(dateOfBirth)}</td>
              </tr>
              ` : ""}
              ${gender ? `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Gender</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${gender}</td>
              </tr>
              ` : ""}
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Healthcare Facility</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${facility}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Submission Date</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${todayFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500;">Current Stage</td>
                <td style="padding: 10px 16px;">
                  <span style="display: inline-block; padding: 3px 10px; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; border-radius: 100px; font-size: 12px; font-weight: 700;">
                    Under Facility Verification
                  </span>
                </td>
              </tr>
            </table>

            <!-- Next Steps -->
            <div style="margin-bottom: 28px;">
              <h3 style="color: #111827; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">What happens next?</h3>
              <ol style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 6px;">The designated verifier at <strong>${facility}</strong> will inspect the birth record and verified documents.</li>
                <li style="margin-bottom: 6px;">Upon verification, your application will be submitted on the official CRS portal for certificate issuance.</li>
                <li>You will receive real-time email updates at every milestone, and the final certificate will be delivered directly to your inbox.</li>
              </ol>
            </div>

            <!-- Primary Action Button -->
            <div style="text-align: center; margin: 32px 0 16px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: #1e40af; color: #ffffff; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(30,64,175,0.25);">
                Track Application Status →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter(baseUrl)}
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await transporter.sendMail({
        from: `"Birth Certificate Portal - Madhubani" <${process.env.SMTP_USER}>`,
        to: parentEmail,
        subject: `Application Received - ${applicationNumber} | Madhubani District`,
        html: htmlContent,
    });
}

/**
 * Send status update email to parent (with certificate attachment when ready)
 */
export async function sendStatusUpdateEmail({
    parentEmail,
    parentName,
    applicationNumber,
    status,
    remarks,
    childName,
    facility,
    certificateUrl,
    certificateBuffer,
    certificateExtension,
}) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}/track/${applicationNumber}`;
    const todayFormatted = formatDate(new Date());

    const statusConfigs = {
        PENDING_OPERATOR: {
            subject: "Application Verified ✓",
            badge: "Facility Verified",
            badgeBg: "#f0fdf4",
            badgeBorder: "#bbf7d0",
            badgeColor: "#16a34a",
            heading: "Application Verified by Facility Authority",
            body: "Great news! Your birth registration details have been reviewed and verified by the designated medical authority. Your record is now queued with the Central Operator for registration on the official Civil Registration System (CRS) portal.",
            icon: "✅",
        },
        REJECTED_BY_VERIFIER: {
            subject: "Application Requires Correction",
            badge: "Verification Rejected",
            badgeBg: "#fef2f2",
            badgeBorder: "#fecaca",
            badgeColor: "#dc2626",
            heading: "Application Returned by Facility Verifier",
            body: "The facility verifier was unable to approve your application based on the submitted details or documents. Please review the specific remarks below and contact the facility helpdesk if you need assistance.",
            icon: "⚠️",
        },
        APPLIED_ON_CRS: {
            subject: "Registered on CRS Portal",
            badge: "CRS Registration Active",
            badgeBg: "#f5f3ff",
            badgeBorder: "#ddd6fe",
            badgeColor: "#7c3aed",
            heading: "Application Submitted on Official CRS Portal",
            body: "The Central Operator has successfully registered your birth application on the Government of Bihar Civil Registration System (CRS) portal. Certificate generation and digital validation are currently in progress.",
            icon: "🖥️",
        },
        APPLIED_ON_CSC: {
            subject: "Registered on CRS Portal",
            badge: "CRS Registration Active",
            badgeBg: "#f5f3ff",
            badgeBorder: "#ddd6fe",
            badgeColor: "#7c3aed",
            heading: "Application Submitted on Official CRS Portal",
            body: "The Central Operator has successfully registered your birth application on the Government of Bihar Civil Registration System (CRS) portal. Certificate generation and digital validation are currently in progress.",
            icon: "🖥️",
        },
        REJECTED_BY_OPERATOR: {
            subject: "Application Processing Halted",
            badge: "Operator Rejected",
            badgeBg: "#fef2f2",
            badgeBorder: "#fecaca",
            badgeColor: "#dc2626",
            heading: "Application Could Not Be Processed on CRS Portal",
            body: "The operator encountered an issue while submitting your application onto the CRS system. Please review the remarks below for necessary corrective actions.",
            icon: "❌",
        },
        COMPLETED: {
            subject: "Official Birth Certificate Issued 🎉",
            badge: "Certificate Ready & Issued",
            badgeBg: "#ecfdf5",
            badgeBorder: "#a7f3d0",
            badgeColor: "#059669",
            heading: "Your Official Birth Certificate Is Ready!",
            body: "Congratulations! Your official birth certificate has been approved and issued by the District Administration, Madhubani. A copy has been attached to this email for your immediate access.",
            icon: "🎉",
        },
    };

    const info = statusConfigs[status];
    if (!info) return;

    // Handle Certificate Attachment if status is COMPLETED
    const attachments = [];
    if (status === "COMPLETED") {
        const ext = (certificateExtension || (certificateUrl ? certificateUrl.split('.').pop().split('?')[0] : "pdf") || "pdf").toLowerCase();
        const filename = `Birth_Certificate_${applicationNumber}.${ext}`;
        const contentType = ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`;

        if (certificateBuffer) {
            attachments.push({
                filename,
                content: certificateBuffer,
                contentType,
            });
        } else if (certificateUrl) {
            try {
                const res = await fetch(certificateUrl);
                if (res.ok) {
                    const arrayBuf = await res.arrayBuffer();
                    attachments.push({
                        filename,
                        content: Buffer.from(arrayBuf),
                        contentType,
                    });
                } else {
                    attachments.push({
                        filename,
                        path: certificateUrl,
                    });
                }
            } catch (fetchErr) {
                console.error("Error attaching certificate via URL fetch, falling back to remote path:", fetchErr);
                attachments.push({
                    filename,
                    path: certificateUrl,
                });
            }
        }
    }

    const isCompleted = status === "COMPLETED";
    const isRejected = status.includes("REJECTED");

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${info.heading} - ${applicationNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px 10px; -webkit-text-size-adjust: none;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
          <td>
            ${getEmailHeader()}
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 28px;">
            <!-- Status Card Banner -->
            <div style="background: ${info.badgeBg}; border: 1.5px solid ${info.badgeBorder}; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <span style="font-size: 20px;">${info.icon}</span>
                <span style="display: inline-block; padding: 4px 12px; background: #ffffff; border: 1px solid ${info.badgeBorder}; color: ${info.badgeColor}; border-radius: 100px; font-size: 12px; font-weight: 700;">
                  ${info.badge}
                </span>
              </div>
              <h2 style="color: ${info.badgeColor}; font-size: 18px; font-weight: 800; margin: 10px 0 6px 0;">
                ${info.heading}
              </h2>
              <p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.6;">
                ${info.body}
              </p>
            </div>

            <!-- Greeting -->
            <p style="color: #111827; font-size: 15px; margin: 0 0 12px 0;">
              Dear <strong>${parentName || "Parent / Guardian"}</strong>,
            </p>

            ${remarks ? `
            <!-- Remarks Box (for rejections or specific notes) -->
            <div style="background: #fff1f2; border-left: 4px solid #e11d48; border-radius: 6px; padding: 14px 16px; margin: 16px 0 24px 0;">
              <p style="color: #9f1239; font-size: 12px; font-weight: 700; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Official Remarks / Reason:
              </p>
              <p style="color: #881337; font-size: 13px; margin: 0; line-height: 1.5; font-style: italic;">
                "${remarks}"
              </p>
            </div>
            ` : ""}

            ${isCompleted ? `
            <!-- Certificate Ready & Attached Banner -->
            <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 26px;">📎</div>
                <div>
                  <h3 style="color: #15803d; font-size: 15px; font-weight: 800; margin: 0 0 4px 0;">
                    Certificate Attached Directly to this Email
                  </h3>
                  <p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.5;">
                    Your official birth certificate has been attached to this email (<strong>Birth_Certificate_${applicationNumber}.${certificateExtension || 'pdf'}</strong>). You can download and save it to your phone or computer right away.
                  </p>
                </div>
              </div>
            </div>
            ` : ""}

            <!-- Application Data Table -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px; font-size: 13px;">
              <tr style="background: #f9fafb;">
                <td colspan="2" style="padding: 10px 16px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb;">
                  Application Details
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; width: 40%; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Application No.</td>
                <td style="padding: 10px 16px; color: #1e40af; font-weight: 700; font-family: monospace; font-size: 14px; border-bottom: 1px solid #f3f4f6;">
                  ${applicationNumber}
                </td>
              </tr>
              ${childName ? `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Child's Name</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${childName}</td>
              </tr>
              ` : ""}
              ${facility ? `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Birth Facility</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${facility}</td>
              </tr>
              ` : ""}
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Last Updated</td>
                <td style="padding: 10px 16px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${todayFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; color: #6b7280; font-weight: 500;">Status</td>
                <td style="padding: 10px 16px;">
                  <span style="display: inline-block; padding: 3px 10px; background: ${info.badgeBg}; color: ${info.badgeColor}; border: 1px solid ${info.badgeBorder}; border-radius: 100px; font-size: 12px; font-weight: 700;">
                    ${info.badge}
                  </span>
                </td>
              </tr>
            </table>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 30px 0 16px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: #1e40af; color: #ffffff; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(30,64,175,0.25);">
                ${isCompleted ? "View Certificate on Portal →" : "View Application Status Online →"}
              </a>
            </div>

            ${isCompleted ? `
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0 0 16px 0;">
              (You can also log in to the portal at any time with your Application Number & DOB to download additional copies)
            </p>
            ` : ""}

            ${isRejected ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-top: 20px;">
              <p style="color: #92400e; font-size: 12px; margin: 0; line-height: 1.5;">
                <strong>Next Step:</strong> You may submit a corrected application online or visit <strong>${facility || "your local health center"}</strong> with original birth documentation for assistance.
              </p>
            </div>
            ` : ""}
          </td>
        </tr>
        <tr>
          <td>
            ${getEmailFooter(baseUrl)}
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await transporter.sendMail({
        from: `"Birth Certificate Portal - Madhubani" <${process.env.SMTP_USER}>`,
        to: parentEmail,
        subject: `${info.subject} — ${applicationNumber} | Madhubani District`,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined,
    });
}
