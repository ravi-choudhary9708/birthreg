import { NextResponse } from "next/server";
import cloudinary from "@/libs/cloudinary";

export const runtime = "nodejs";

function parseCloudinaryUrl(url) {
    try {
        const u = new URL(url);
        const parts = u.pathname.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return null;

        const resourceType = parts[uploadIndex - 1] || "image";
        const remaining = parts.slice(uploadIndex + 1);
        const afterVersion = remaining.filter((part) => !part.match(/^v\d+$/));
        const fullPathWithExt = afterVersion.join("/");

        if (resourceType === "raw") {
            return {
                resourceType: "raw",
                publicId: fullPathWithExt,
                format: "pdf",
            };
        }

        const dotIndex = fullPathWithExt.lastIndexOf(".");
        const publicId = dotIndex !== -1 ? fullPathWithExt.substring(0, dotIndex) : fullPathWithExt;
        const format = dotIndex !== -1 ? fullPathWithExt.substring(dotIndex + 1) : "";

        return { resourceType, publicId, format };
    } catch {
        return null;
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get("url");
        const publicIdParam = searchParams.get("publicId");
        const resourceTypeParam = searchParams.get("resourceType") || "image";

        if (!fileUrl && !publicIdParam) {
            return NextResponse.json({ error: "Missing document URL or publicId" }, { status: 400 });
        }

        // Check if file is not a PDF
        const targetUrl = fileUrl || "";
        const isPdf =
            targetUrl.toLowerCase().includes(".pdf") ||
            searchParams.get("format") === "pdf" ||
            (!fileUrl && publicIdParam);

        // If it's not a PDF, redirect directly to Cloudinary CDN
        if (!isPdf && targetUrl.startsWith("http")) {
            return NextResponse.redirect(targetUrl);
        }

        let resourceType = resourceTypeParam;
        let publicId = publicIdParam;
        let format = "pdf";

        if (fileUrl) {
            const parsed = parseCloudinaryUrl(fileUrl);
            if (!parsed) {
                // If not a Cloudinary URL, redirect to original URL
                return NextResponse.redirect(fileUrl);
            }
            resourceType = parsed.resourceType;
            publicId = parsed.publicId;
            format = parsed.format || "pdf";
        }

        // Generate signed download URL using Cloudinary API credentials
        const downloadUrl = cloudinary.utils.private_download_url(
            publicId,
            resourceType === "raw" ? "" : (format || "pdf"),
            {
                resource_type: resourceType,
                type: "upload",
                expires_at: Math.floor(Date.now() / 1000) + 3600,
            }
        );

        const response = await fetch(downloadUrl);

        if (!response.ok) {
            console.error("Failed to fetch private document from Cloudinary:", response.status);
            // Fallback: render first page as JPG image from Cloudinary
            const fallbackJpgUrl = cloudinary.url(publicId, {
                resource_type: resourceType === "raw" ? "image" : resourceType,
                format: "jpg",
                page: 1,
            });
            return NextResponse.redirect(fallbackJpgUrl);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "inline; filename=\"aadhaar_document.pdf\"",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
        });
    } catch (error) {
        console.error("Document viewer error:", error);
        return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
    }
}
