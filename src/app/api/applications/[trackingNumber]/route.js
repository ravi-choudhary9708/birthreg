import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";
import jwt from "jsonwebtoken";

export async function GET(request, { params }) {
    try {
        const { trackingNumber } = await params;

        if (!trackingNumber) {
            throw new apiError(400, "Tracking number is required");
        }

        const application = await prisma.application.findUnique({
            where: {
                applicationNumber: trackingNumber.toUpperCase(),
            },
            include: {
                child: {
                    select: {
                        name: true,
                    }
                }
            }
        });

        if (!application) {
            throw new apiError(404, "No application found with this tracking number");
        }

        const normalized = trackingNumber.toUpperCase();
        const cookieToken = request.cookies.get(`track_verified_${normalized}`)?.value;
        const authHeader = request.headers.get("authorization")?.replace("Bearer ", "");
        const token = cookieToken || authHeader;

        let isVerified = false;
        if (token) {
            try {
                const jwtSecret = process.env.JWT_SECRET || "madhubani_track_secret_key";
                const decoded = jwt.verify(token, jwtSecret);
                if (decoded && decoded.applicationNumber === normalized) {
                    isVerified = true;
                }
            } catch {
                isVerified = false;
            }
        }

        // Return safe public data + verification status
        const safeData = {
            applicationNumber: application.applicationNumber,
            status: application.status,
            facility: application.facility,
            childName: application.child?.name,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            isVerified,
            // Only include certificate URL if completed and verified
            certificateUrl: application.status === "COMPLETED" ? application.certificateUrl : undefined,
        };

        return NextResponse.json(
            new apiResponse(200, safeData, "Application found"),
            { status: 200 }
        );

    } catch (error) {
        console.error("Tracking API Error:", error.message || error);
        if (error.code === "ECONNREFUSED" || error.message?.includes("ECONNREFUSED")) {
            return NextResponse.json(
                { success: false, message: "Database is unreachable. Please ensure the PostgreSQL server is running and accessible." },
                { status: 503 }
            );
        }
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message || "An internal error occurred" },
            { status: statusCode }
        );
    }
}
