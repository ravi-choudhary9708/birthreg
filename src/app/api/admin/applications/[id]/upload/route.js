import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { applicationIncludeRelations } from "@/libs/applicationSerializer";
import { uploadCertificate } from "@/libs/cloudinary";
import { sendStatusUpdateEmail } from "@/libs/mailer";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function POST(request, { params }) {
    try {
        const role = request.headers.get("x-user-role");
        const userFacility = request.headers.get("x-user-facility");

        if (role !== "verifier" && role !== "operator") {
            throw new apiError(403, "Only verifiers or authorized operators can upload certificates");
        }

        const { id } = await params;

        const application = await prisma.application.findUnique({
            where: { id },
            include: applicationIncludeRelations,
        });

        if (!application) {
            throw new apiError(404, "Application not found");
        }

        // Verifier facility isolation: verifiers can only upload certificates for their own hospital
        if (role === "verifier" && application.facility && userFacility) {
            if (application.facility.trim().toLowerCase() !== userFacility.trim().toLowerCase()) {
                throw new apiError(403, `You are only authorized for ${userFacility}, not ${application.facility}`);
            }
        }

        const allowedStatuses = ["APPLIED_ON_CRS", "APPLIED_ON_CSC", "PENDING_OPERATOR", "COMPLETED"];
        if (!allowedStatuses.includes(application.status)) {
            throw new apiError(400, "Certificate can only be uploaded after the application has been verified or registered on CRS");
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get("certificate");

        if (!file) {
            throw new apiError(400, "Certificate file is required");
        }

        // Validate file type
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
            throw new apiError(400, "Only PDF, JPG, and PNG files are allowed");
        }

        // Convert file to buffer and upload to Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const typeMap = {
            "application/pdf": "pdf",
            "image/jpeg": "jpg",
            "image/png": "png"
        };
        const extension = typeMap[file.type] || "pdf";

        const { url } = await uploadCertificate(buffer, application.applicationNumber, extension);

        // Update application in PostgreSQL
        await prisma.application.update({
            where: { id },
            data: {
                status: "COMPLETED",
                certificateUrl: url,
            }
        });

        // Send completion email with certificate attached
        if (application.informant?.email) {
            await sendStatusUpdateEmail({
                parentEmail: application.informant.email,
                parentName: application.informant.name,
                applicationNumber: application.applicationNumber,
                status: "COMPLETED",
                childName: application.child?.name,
                facility: application.facility,
                certificateUrl: url,
                certificateBuffer: buffer,
                certificateExtension: extension,
            }).catch(console.error);
        }

        return NextResponse.json(
            new apiResponse(200, { certificateUrl: url }, "Certificate uploaded successfully"),
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
