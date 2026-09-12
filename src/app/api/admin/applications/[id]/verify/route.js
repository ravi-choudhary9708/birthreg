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

        if (role === "verifier") {
            const userId = request.headers.get("x-user-id");
            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { isActive: true },
                });
                if (user && user.isActive === false) {
                    throw new apiError(403, "Your verifier account has been deactivated by Operator Central.");
                }
            }
        }

        const { id } = await params;
        const { action, remarks, applyCrs } = await request.json(); // action: "approve" | "reject"

        if (!action || !["approve", "reject"].includes(action)) {
            throw new apiError(400, "Invalid action. Use 'approve' or 'reject'");
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

        if (application.status !== "PENDING_VERIFIER") {
            throw new apiError(400, "This application is not pending verification");
        }

        let newStatus = "PENDING_OPERATOR"; // Default approved state (Ready for CRS submission)
        if (action === "reject") {
            newStatus = "REJECTED_BY_VERIFIER";
        } else if (applyCrs) {
            newStatus = "APPLIED_ON_CRS";
        }

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
                remarks: remarks?.trim(),
            }).catch(console.error);
        }

        return NextResponse.json(
            new apiResponse(200, { status: newStatus }, `Application ${action}d successfully`),
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
