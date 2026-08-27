import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Application } from "@/models/application.model";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { trackingNumber } = await params;

        if (!trackingNumber) {
            throw new apiError(400, "Tracking number is required");
        }

        const application = await Application.findOne({
            applicationNumber: trackingNumber.toUpperCase(),
        }).select("-__v");

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
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message },
            { status: statusCode }
        );
    }
}
