import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { formatPrismaApplicationCreate, applicationIncludeRelations } from "@/libs/applicationSerializer";
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
        const body = await request.json();
        const { facility, child, parents, informationProvider } = body;

        // Basic validation
        if (!facility || !child || !parents || !informationProvider) {
            throw new apiError(400, "All sections of the form are required");
        }
        if (!parents.mother?.mobileNumber) {
            throw new apiError(400, "Parent contact information is required");
        }
        const aadhaarPattern = /^\d{4}-\d{4}-\d{4}$/;
        if (!parents.mother?.adharNumber || !aadhaarPattern.test(parents.mother.adharNumber.trim())) {
            throw new apiError(400, "Mother's 12-digit Aadhaar number in XXXX-XXXX-XXXX format is mandatory");
        }
        if (!parents.father?.adharNumber || !aadhaarPattern.test(parents.father.adharNumber.trim())) {
            throw new apiError(400, "Father's 12-digit Aadhaar number in XXXX-XXXX-XXXX format is mandatory");
        }
        if (!child.dateOfBirth) {
            throw new apiError(400, "Date of birth is required");
        }
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        if (child.dateOfBirth > todayStr) {
            throw new apiError(400, "Date of birth cannot be in the future (जन्म की तारीख भविष्य की नहीं हो सकती)");
        }
        if (!informationProvider.declarationAccepted) {
            throw new apiError(400, "Statutory declaration under Section 23 of Registration of Births and Deaths Act must be accepted");
        }

        // Generate unique application number
        let applicationNumber;
        let exists = true;
        while (exists) {
            applicationNumber = generateApplicationNumber();
            exists = await prisma.application.findUnique({
                where: { applicationNumber }
            });
        }

        // Create application with relational children in PostgreSQL
        const createData = formatPrismaApplicationCreate({
            applicationNumber,
            facility,
            child,
            parents,
            informationProvider,
        });

        const application = await prisma.application.create({
            data: createData,
            include: applicationIncludeRelations,
        });

        // Send confirmation email to the information provider (parent/guardian)
        if (informationProvider.email) {
            await sendApplicationReceivedEmail({
                parentEmail: informationProvider.email,
                parentName: informationProvider.name,
                applicationNumber,
                facility,
                childName: child?.name,
                dateOfBirth: child?.dateOfBirth,
                gender: child?.gender,
            }).catch(console.error); // Don't block if email fails
        }

        return NextResponse.json(
            new apiResponse(201, { applicationNumber, id: application.id, _id: application.id }, "Application submitted successfully"),
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
