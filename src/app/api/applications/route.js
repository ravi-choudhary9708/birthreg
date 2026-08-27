import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Application } from "@/models/application.model";
import { sendApplicationReceivedEmail } from "@/libs/mailer";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

// Generate a unique application number like APP-2024-XXXXXX
function generateApplicationNumber() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `APP-${year}-${random}`;
}

export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { facility, child, parents, informationProvider } = body;

        // Basic validation
        if (!facility || !child || !parents || !informationProvider) {
            throw new apiError(400, "All sections of the form are required");
        }
        if (!parents.mother?.mobileNumber) {
            throw new apiError(400, "Parent contact information is required");
        }

        // Generate unique application number
        let applicationNumber;
        let exists = true;
        while (exists) {
            applicationNumber = generateApplicationNumber();
            exists = await Application.findOne({ applicationNumber });
        }

        // Save application
        const application = await Application.create({
            applicationNumber,
            facility,
            child,
            parents,
            informationProvider,
            status: "PENDING_VERIFIER",
        });

        // Send confirmation email to the information provider (parent/guardian)
        if (informationProvider.email) {
            await sendApplicationReceivedEmail({
                parentEmail: informationProvider.email,
                parentName: informationProvider.name,
                applicationNumber,
                facility,
            }).catch(console.error); // Don't block if email fails
        }

        return NextResponse.json(
            new apiResponse(201, { applicationNumber, id: application._id }, "Application submitted successfully"),
            { status: 201 }
        );

    } catch (error) {
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message, errors: error.errors || [] },
            { status: statusCode }
        );
    }
}
