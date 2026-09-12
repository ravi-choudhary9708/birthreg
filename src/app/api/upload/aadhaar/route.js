import { NextResponse } from "next/server";
import { uploadAadhaarCard } from "@/libs/cloudinary";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const holder = String(formData.get("holder") || "document").toLowerCase();

        if (!file || typeof file === "string") {
            throw new apiError(400, "कृपया आधार कार्ड फ़ाइल चुनें (Please select an Aadhaar card file)");
        }

        // Validate maximum file size (1MB)
        if (file.size > MAX_FILE_SIZE) {
            const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
            throw new apiError(
                400,
                `फ़ाइल का आकार 1MB से अधिक नहीं हो सकता (File size of ${sizeInMb}MB exceeds maximum limit of 1MB)`
            );
        }

        // Validate file extension and MIME type
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        const mimeType = (file.type || "").toLowerCase();

        const isValidMime = ALLOWED_MIME_TYPES.has(mimeType);
        const isValidExt = ALLOWED_EXTENSIONS.has(ext);

        if (!isValidMime && !isValidExt) {
            throw new apiError(
                400,
                "केवल PDF एवं इमेज (JPG, JPEG, PNG, WEBP) प्रारूप समर्थित हैं (Only PDF and image formats are allowed)"
            );
        }

        // Convert file into Buffer for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeHolder = ["child", "mother", "father", "informant"].includes(holder)
            ? holder
            : "document";

        const { url, publicId, format } = await uploadAadhaarCard(buffer, file.name, safeHolder);
        const isPdf = format === "pdf" || file.type === "application/pdf" || ext === "pdf";
        const viewUrl = isPdf ? `/api/documents/view?url=${encodeURIComponent(url)}` : url;

        return NextResponse.json(
            new apiResponse(
                200,
                {
                    url: viewUrl,
                    rawUrl: url,
                    publicId,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type || format,
                    holder: safeHolder,
                },
                "Aadhaar card uploaded successfully"
            ),
            { status: 200 }
        );
    } catch (error) {
        console.error("Aadhaar upload error:", error);
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to upload Aadhaar card to Cloudinary",
            },
            { status: statusCode }
        );
    }
}
