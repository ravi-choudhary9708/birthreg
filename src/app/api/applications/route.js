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
        const isValidMobile = (num) => {
            if (!num || typeof num !== "string") return false;
            const digits = num.replace(/^\+91\s*/, "").replace(/\D/g, "");
            return digits.length === 10;
        };

        if (!isValidMobile(parents.mother?.mobileNumber)) {
            throw new apiError(400, "Mother's 10-digit mobile number is mandatory (+91 XXXXXXXXXX)");
        }
        if (!isValidMobile(parents.father?.mobileNumber)) {
            throw new apiError(400, "Father's 10-digit mobile number is mandatory (+91 XXXXXXXXXX)");
        }
        if (informationProvider?.mobileNumber && !isValidMobile(informationProvider.mobileNumber)) {
            throw new apiError(400, "Information provider's 10-digit mobile number is invalid (+91 XXXXXXXXXX)");
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!informationProvider?.email || !emailRegex.test(informationProvider.email.trim())) {
            throw new apiError(400, "Valid email address for Information Provider is required for official status tracking & certificate delivery");
        }
        if (parents.mother?.email && parents.mother.email.trim() && !emailRegex.test(parents.mother.email.trim())) {
            throw new apiError(400, "Mother's email address format is invalid");
        }
        if (parents.father?.email && parents.father.email.trim() && !emailRegex.test(parents.father.email.trim())) {
            throw new apiError(400, "Father's email address format is invalid");
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

        // Check if the health facility's verification unit is active
        const facilityVerifiers = await prisma.user.findMany({
            where: {
                facility: {
                    equals: facility.trim(),
                    mode: "insensitive",
                },
                role: "verifier",
            },
        });

        if (facilityVerifiers.length > 0 && facilityVerifiers.every(v => v.isActive === false)) {
            throw new apiError(
                400,
                `इस स्वास्थ्य केंद्र (${facility}) की सत्यापन इकाई को ऑपरेटर सेंट्रल द्वारा निष्क्रिय (Inactive) किया गया है। वर्तमान में इस अस्पताल के लिए नए आवेदन स्वीकार नहीं किए जा सकते। (Applications cannot be accepted for this facility at this time because the facility verification unit is inactive.)`
            );
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
