import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Application } from "@/models/application.model";
import { uploadCertificate } from "@/libs/cloudinary";
import { sendStatusUpdateEmail } from "@/libs/mailer";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function POST(request, { params }) {
    try {
        await dbConnect();

        const role = request.headers.get("x-user-role");
        if (role !== "operator") {
            throw new apiError(403, "Only operators can upload certificates");
        }

        const { id } = await params;

        const application = await Application.findById(id);
        if (!application) {
            throw new apiError(404, "Application not found");
        }
        if (application.status !== "APPLIED_ON_CSC" && application.status !== "COMPLETED") {
            throw new apiError(400, "Certificate can only be uploaded after applying on CSC portal");
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

        // Update application
        application.status = "COMPLETED";
        application.certificateUrl = url;
        await application.save();

        // Send completion email
        if (application.informationProvider?.email) {
            await sendStatusUpdateEmail({
                parentEmail: application.informationProvider.email,
                parentName: application.informationProvider.name,
                applicationNumber: application.applicationNumber,
                status: "COMPLETED",
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
