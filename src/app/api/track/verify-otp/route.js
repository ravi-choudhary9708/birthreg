import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import jwt from "jsonwebtoken";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function POST(request) {
    try {
        const body = await request.json();
        const { applicationNumber, otp } = body;

        if (!applicationNumber || typeof applicationNumber !== "string" || !applicationNumber.trim()) {
            throw new apiError(400, "Application Number is required");
        }

        if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
            throw new apiError(400, "Please enter a valid 6-digit verification code");
        }

        const normalizedAppNumber = applicationNumber.trim().toUpperCase();
        const cleanOtp = otp.trim();

        // 1. Find active OTP record for this application
        const record = await prisma.otpVerification.findFirst({
            where: {
                applicationNumber: normalizedAppNumber,
            },
            orderBy: { createdAt: "desc" }
        });

        if (!record) {
            throw new apiError(400, "No active OTP request found for this application. Please request a new code.");
        }

        if (new Date() > record.expiresAt) {
            throw new apiError(400, "The 6-digit OTP has expired. Please request a new code.");
        }

        if (record.attempts >= 5) {
            throw new apiError(429, "Too many incorrect attempts. For security, please request a new OTP.");
        }

        // 2. Validate OTP code
        if (record.otp !== cleanOtp) {
            const updated = await prisma.otpVerification.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            const remaining = 5 - updated.attempts;
            const msg = remaining > 0
                ? `Incorrect OTP. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
                : "Maximum incorrect attempts reached. Please request a new OTP.";
            throw new apiError(400, msg);
        }

        // 3. Mark record as verified
        await prisma.otpVerification.update({
            where: { id: record.id },
            data: { verified: true },
        });

        // 4. Generate signed verification JWT token (1 hour)
        const jwtSecret = process.env.JWT_SECRET || "madhubani_track_secret_key";
        const verificationToken = jwt.sign(
            {
                applicationNumber: normalizedAppNumber,
                email: record.email,
                verifiedAt: Date.now(),
            },
            jwtSecret,
            { expiresIn: "1h" }
        );

        // 5. Fetch full application details
        const application = await prisma.application.findUnique({
            where: { applicationNumber: normalizedAppNumber },
            include: {
                child: {
                    select: {
                        name: true,
                        gender: true,
                        dateOfBirth: true,
                        placeOfBirth: true,
                    }
                },
                parents: {
                    select: {
                        motherName: true,
                        fatherName: true,
                    }
                }
            }
        });

        if (!application) {
            throw new apiError(404, "Application details could not be retrieved");
        }

        const safeData = {
            applicationNumber: application.applicationNumber,
            status: application.status,
            facility: application.facility,
            childName: application.child?.name,
            gender: application.child?.gender,
            dateOfBirth: application.child?.dateOfBirth,
            placeOfBirth: application.child?.placeOfBirth,
            motherName: application.parents?.motherName,
            fatherName: application.parents?.fatherName,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            certificateUrl: application.status === "COMPLETED" ? application.certificateUrl : undefined,
        };

        const response = NextResponse.json(
            new apiResponse(200, {
                token: verificationToken,
                application: safeData,
                redirectUrl: `/track/${normalizedAppNumber}`,
            }, "Verification successful! Identity authenticated.")
        );

        // Set secure HTTP-only cookie for session validation
        response.cookies.set(`track_verified_${normalizedAppNumber}`, verificationToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60, // 1 hour
        });

        return response;

    } catch (error) {
        console.error("Verify OTP Error:", error.message || error);
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message || "Failed to verify code" },
            { status: statusCode }
        );
    }
}
