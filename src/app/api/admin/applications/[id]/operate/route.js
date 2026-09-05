import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { applicationIncludeRelations } from "@/libs/applicationSerializer";
import { sendStatusUpdateEmail } from "@/libs/mailer";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function PATCH(request, { params }) {
    try {
        const role = request.headers.get("x-user-role");
        const userFacility = request.headers.get("x-user-facility");

        if (role !== "verifier" && role !== "operator") {
            throw new apiError(403, "Only verifiers or authorized operators can perform this action");
        }

        const { id } = await params;
        const { action, remarks } = await request.json(); // action: "apply_crs" | "apply_csc" | "reject"

        const validActions = ["apply_crs", "apply_csc", "reject"];
        if (!action || !validActions.includes(action)) {
            throw new apiError(400, "Invalid action. Use 'apply_crs' or 'reject'");
        }
        if (action === "reject" && (!remarks || remarks.trim() === "")) {
            throw new apiError(400, "A valid reason is strictly required when rejecting an application");
        }

        const application = await prisma.application.findUnique({
            where: { id },
            include: applicationIncludeRelations,
        });

        if (!application) {
            throw new apiError(404, "Application not found");
        }

        // Verifier facility isolation: verifiers can only process applications for their own hospital
        if (role === "verifier" && application.facility && userFacility) {
            if (application.facility.trim().toLowerCase() !== userFacility.trim().toLowerCase()) {
                throw new apiError(403, `You are only authorized for ${userFacility}, not ${application.facility}`);
            }
        }

        const allowedStatuses = ["PENDING_OPERATOR", "PENDING_VERIFIER"];
        if (!allowedStatuses.includes(application.status)) {
            throw new apiError(400, `Cannot apply CRS to application with status: ${application.status}`);
        }

        const isApply = action === "apply_crs" || action === "apply_csc";
        const newStatus = isApply
            ? "APPLIED_ON_CRS"
            : (role === "verifier" ? "REJECTED_BY_VERIFIER" : "REJECTED_BY_OPERATOR");

        await prisma.application.update({
            where: { id },
            data: {
                status: newStatus,
                ...(remarks ? { remarks: remarks.trim() } : {}),
            },
        });

        // Send email notification
        if (application.informant?.email) {
            await sendStatusUpdateEmail({
                parentEmail: application.informant.email,
                parentName: application.informant.name,
                applicationNumber: application.applicationNumber,
                status: newStatus,
                childName: application.child?.name,
                facility: application.facility,
                remarks,
            }).catch(console.error);
        }

        return NextResponse.json(
            new apiResponse(200, { status: newStatus }, `Application updated successfully`),
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
