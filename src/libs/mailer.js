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

/**
 * Send application received confirmation email to parent
 */
export async function sendApplicationReceivedEmail({ parentEmail, parentName, applicationNumber, facility }) {
    await transporter.sendMail({
        from: `"Birth Certificate Portal" <${process.env.SMTP_USER}>`,
        to: parentEmail,
        subject: `Application Received - ${applicationNumber}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: #1e40af; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Birth Certificate Portal</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">Madhubani District</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Application Received Successfully</h2>
            <p style="color: #4b5563;">Dear <strong>${parentName}</strong>,</p>
            <p style="color: #4b5563;">Your birth certificate application has been received and is being reviewed by <strong>${facility}</strong>.</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 13px;">YOUR APPLICATION NUMBER</p>
              <p style="color: #1e40af; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 2px;">${applicationNumber}</p>
            </div>
            <p style="color: #4b5563;">Please save this number to track the status of your application at any time.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/track/${applicationNumber}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 8px;">Track Application</a>
          </div>
          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Birth Certificate Portal — Madhubani, Bihar</p>
          </div>
        </div>
        `,
    });
}

/**
 * Send status update email to parent
 */
export async function sendStatusUpdateEmail({ parentEmail, parentName, applicationNumber, status, remarks }) {
    const statusMessages = {
        PENDING_OPERATOR: {
            subject: "Application Verified ✓",
            heading: "Application Verified Successfully",
            body: "Your application has been verified by the facility. It has been forwarded to the operator who will now apply for your certificate on the CSC portal.",
            color: "#16a34a",
            bgColor: "#f0fdf4",
            borderColor: "#bbf7d0",
        },
        REJECTED_BY_VERIFIER: {
            subject: "Application Rejected",
            heading: "Application Rejected by Verifier",
            body: `Your application has been rejected by the verifier. Reason: <strong>${remarks || "Not specified"}</strong>. Please contact your facility for more information.`,
            color: "#dc2626",
            bgColor: "#fef2f2",
            borderColor: "#fecaca",
        },
        APPLIED_ON_CSC: {
            subject: "Applied on CSC Portal",
            heading: "Application Submitted to CSC Portal",
            body: "The operator has submitted your application on the CSC portal. Your certificate is being processed. You will be notified once it is ready.",
            color: "#d97706",
            bgColor: "#fffbeb",
            borderColor: "#fde68a",
        },
        REJECTED_BY_OPERATOR: {
            subject: "Application Rejected by Operator",
            heading: "Application Rejected by Operator",
            body: `Your application could not be processed. Reason: <strong>${remarks || "Not specified"}</strong>. Please contact your facility for more information.`,
            color: "#dc2626",
            bgColor: "#fef2f2",
            borderColor: "#fecaca",
        },
        COMPLETED: {
            subject: "Certificate Ready for Download 🎉",
            heading: "Your Certificate is Ready!",
            body: "Your birth certificate has been generated and is now available for download. Please visit the portal and enter your Application Number and Date of Birth to download it.",
            color: "#059669",
            bgColor: "#ecfdf5",
            borderColor: "#a7f3d0",
        },
    };

    const info = statusMessages[status];
    if (!info) return;

    await transporter.sendMail({
        from: `"Birth Certificate Portal" <${process.env.SMTP_USER}>`,
        to: parentEmail,
        subject: `${info.subject} - ${applicationNumber}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: #1e40af; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Birth Certificate Portal</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">Madhubani District</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: ${info.color}; font-size: 18px; margin-top: 0;">${info.heading}</h2>
            <p style="color: #4b5563;">Dear <strong>${parentName}</strong>,</p>
            <div style="background: ${info.bgColor}; border: 1px solid ${info.borderColor}; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #374151; margin: 0;">${info.body}</p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Application Number: <strong>${applicationNumber}</strong></p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/track/${applicationNumber}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 8px;">View Application Status</a>
          </div>
          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Birth Certificate Portal — Madhubani, Bihar</p>
          </div>
        </div>
        `,
    });
}
