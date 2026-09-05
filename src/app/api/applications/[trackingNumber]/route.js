import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

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

        // Return safe public data (no internal IDs or sensitive info)
        const safeData = {
            applicationNumber: application.applicationNumber,
            status: application.status,
            facility: application.facility,
            childName: application.child?.name,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            // Only include certificate URL if completed
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
