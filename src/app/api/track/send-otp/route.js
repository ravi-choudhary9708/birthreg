import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";
import { sendTrackingOtpEmail } from "@/libs/mailer";

function maskEmail(email) {
    if (!email || typeof email !== "string" || !email.includes("@")) return "";
    const [localPart, domain] = email.trim().split("@");
    if (localPart.length <= 2) {
        return `${localPart[0]}*@${domain}`;
    }
    const visibleStart = localPart.slice(0, 1);
    const visibleEnd = localPart.slice(-1);
    const stars = "*".repeat(Math.min(Math.max(localPart.length - 2, 3), 5));
    return `${visibleStart}${stars}${visibleEnd}@${domain}`;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { applicationNumber } = body;

        if (!applicationNumber || typeof applicationNumber !== "string" || !applicationNumber.trim()) {
            throw new apiError(400, "Application Number is required");
        }

        const normalizedAppNumber = applicationNumber.trim().toUpperCase();

        // 1. Fetch application with related contacts
        const application = await prisma.application.findUnique({
            where: {
                applicationNumber: normalizedAppNumber,
            },
            include: {
                child: {
                    select: { name: true }
                },
                parents: {
                    select: {
                        fatherName: true,
                        motherName: true,
                        fatherEmail: true,
                        motherEmail: true,
                    }
                },
                informant: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!application) {
            throw new apiError(404, `No application found with Application Number "${normalizedAppNumber}"`);
        }

        // 2. Identify linked email address
        const linkedEmail =
            application.informant?.email?.trim() ||
            application.parents?.fatherEmail?.trim() ||
            application.parents?.motherEmail?.trim();

        if (!linkedEmail) {
            throw new apiError(400, "No linked email address found on file for this application. Please contact your local registration desk or health facility.");
        }

        // 3. Rate limiting / Cooldown check: prevent requesting more than once every 30 seconds
        const recentOtp = await prisma.otpVerification.findFirst({
            where: {
                applicationNumber: normalizedAppNumber,
                createdAt: {
                    gte: new Date(Date.now() - 30 * 1000)
                }
            },
            orderBy: { createdAt: "desc" }
        });

        if (recentOtp) {
            const waitSeconds = Math.max(1, Math.ceil((recentOtp.createdAt.getTime() + 30 * 1000 - Date.now()) / 1000));
            throw new apiError(429, `An OTP was recently generated. Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before requesting a new code.`);
        }

        // 4. Generate 6-digit random number (100000 - 999999)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 5. Invalidate previous unverified OTPs for this application
        await prisma.otpVerification.deleteMany({
            where: {
                applicationNumber: normalizedAppNumber,
            }
        });

        // 6. Save new OTP to database
        await prisma.otpVerification.create({
            data: {
                applicationNumber: normalizedAppNumber,
                email: linkedEmail,
                otp,
                expiresAt,
            }
        });

        // 7. Send OTP to linked email
        const applicantName =
            application.informant?.name ||
            application.parents?.fatherName ||
            application.parents?.motherName ||
            "Applicant";

        await sendTrackingOtpEmail({
            email: linkedEmail,
            applicationNumber: normalizedAppNumber,
            otp,
            applicantName,
            facility: application.facility,
        });

        return NextResponse.json(
            new apiResponse(200, {
                applicationNumber: normalizedAppNumber,
                maskedEmail: maskEmail(linkedEmail),
                expiresInSeconds: 600,
            }, "A 6-digit verification code has been sent to your linked email address.")
        );

    } catch (error) {
        console.error("Send OTP Error:", error.message || error);
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message || "Failed to send verification code" },
            { status: statusCode }
        );
    }
}
