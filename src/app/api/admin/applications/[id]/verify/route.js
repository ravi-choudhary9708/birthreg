import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Application } from "@/models/application.model";
import { sendStatusUpdateEmail } from "@/libs/mailer";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function PATCH(request, { params }) {
    try {
        await dbConnect();

        const role = request.headers.get("x-user-role");
        if (role !== "verifier") {
            throw new apiError(403, "Only verifiers can perform this action");
        }

        const { id } = await params;
        const { action, remarks } = await request.json(); // action: "approve" | "reject"

        if (!action || !["approve", "reject"].includes(action)) {
            throw new apiError(400, "Invalid action. Use 'approve' or 'reject'");
        }
        if (action === "reject" && !remarks) {
            throw new apiError(400, "Remarks are required when rejecting an application");
        }

        const application = await Application.findById(id);
        if (!application) {
            throw new apiError(404, "Application not found");
        }
        if (application.status !== "PENDING_VERIFIER") {
            throw new apiError(400, "This application is not pending verification");
        }

        const newStatus = action === "approve" ? "PENDING_OPERATOR" : "REJECTED_BY_VERIFIER";
        application.status = newStatus;
        if (remarks) application.remarks = remarks;
        await application.save();

        // Send email notification
        if (application.informationProvider?.email) {
            await sendStatusUpdateEmail({
                parentEmail: application.informationProvider.email,
                parentName: application.informationProvider.name,
                applicationNumber: application.applicationNumber,
                status: newStatus,
                remarks,
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
