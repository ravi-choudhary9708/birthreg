import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

// Secure download: requires both applicationNumber and DOB matching record
export async function POST(request) {
    try {
        const { applicationNumber, dateOfBirth } = await request.json();

        if (!applicationNumber || !dateOfBirth) {
            throw new apiError(400, "Application Number and Date of Birth are required");
        }

        const application = await prisma.application.findUnique({
            where: {
                applicationNumber: applicationNumber.toUpperCase(),
            },
            include: {
                child: {
                    select: {
                        dateOfBirth: true,
                    }
                }
            }
        });

        if (!application) {
            throw new apiError(404, "No application found with this number");
        }

        if (application.status !== "COMPLETED") {
            throw new apiError(400, "Certificate is not yet available for this application");
        }

        // Verify Date of Birth matches child's DOB
        const providedDOB = new Date(dateOfBirth).toDateString();
        const storedDOB = new Date(application.child?.dateOfBirth).toDateString();

        if (providedDOB !== storedDOB) {
            throw new apiError(401, "Date of Birth does not match our records");
        }

        return NextResponse.json(
            new apiResponse(200, { certificateUrl: application.certificateUrl }, "Certificate verified"),
            { status: 200 }
        );

    } catch (error) {
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message },
            { status: statusCode }
        );
    }
}
