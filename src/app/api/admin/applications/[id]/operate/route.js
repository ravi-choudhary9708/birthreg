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
        if (role !== "operator") {
            throw new apiError(403, "Only operators can perform this action");
        }

        const { id } = await params;
        const { action, remarks } = await request.json(); // action: "apply_csc" | "reject"

        if (!action || !["apply_csc", "reject"].includes(action)) {
            throw new apiError(400, "Invalid action. Use 'apply_csc' or 'reject'");
        }
        if (action === "reject" && !remarks) {
            throw new apiError(400, "Remarks are required when rejecting an application");
        }

        const application = await Application.findById(id);
        if (!application) {
            throw new apiError(404, "Application not found");
        }
        if (!["PENDING_OPERATOR"].includes(application.status)) {
            throw new apiError(400, "This application is not pending operator action");
        }

        const newStatus = action === "apply_csc" ? "APPLIED_ON_CSC" : "REJECTED_BY_OPERATOR";
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
