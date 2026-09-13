import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

if (!process.env.CLOUDINARY_CLOUD_NAME) {
    dotenv.config({ path: ".env.local" });
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer
 * @param {string} applicationNumber - Used to name the file
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadCertificate(buffer, applicationNumber, extension = "pdf") {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "birth-certificates",
                public_id: `certificate-${applicationNumber}.${extension}`,
                resource_type: "raw", // for PDFs and raw files
                overwrite: true,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        uploadStream.end(buffer);
    });
}

/**
 * Upload an Aadhaar card file buffer to Cloudinary
 * Supports PDF and all standard image formats (JPG, JPEG, PNG, WEBP)
 * @param {Buffer} buffer - The file buffer
 * @param {string} originalName - The original file name
 * @param {string} holder - 'child' | 'mother' | 'father' | 'informant'
 * @returns {Promise<{url: string, publicId: string, format: string}>}
 */
export async function uploadAadhaarCard(buffer, originalName = "aadhaar.pdf", holder = "document") {
    const rawExt = (originalName.split(".").pop() || "pdf").toLowerCase();
    const sanitizedExt = ["pdf", "jpg", "jpeg", "png", "webp"].includes(rawExt) ? rawExt : "pdf";
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const publicId = `aadhaar_${holder}_${timestamp}_${rand}`;

    const streamUpload = (options) =>
        new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            uploadStream.end(buffer);
        });

    try {
        // Attempt 1: Auto-detection without forced format conversion
        const result = await streamUpload({
            folder: "birthreg/aadhaar-documents",
            public_id: publicId,
            resource_type: "auto",
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format || sanitizedExt,
            resourceType: result.resource_type,
        };
    } catch (autoErr) {
        // If Cloudinary rejects as "Invalid image file" (non-standard headers, text file, etc.),
        // fall back to raw upload so the user's document is preserved reliably
        if (autoErr?.message?.includes("Invalid image") || autoErr?.http_code === 400) {
            try {
                const rawResult = await streamUpload({
                    folder: "birthreg/aadhaar-documents",
                    public_id: `${publicId}.${sanitizedExt}`,
                    resource_type: "raw",
                });

                return {
                    url: rawResult.secure_url,
                    publicId: rawResult.public_id,
                    format: sanitizedExt,
                    resourceType: "raw",
                };
            } catch (rawErr) {
                console.error("Cloudinary raw fallback error:", rawErr);
                throw autoErr;
            }
        }
        throw autoErr;
    }
}

/**
 * Delete an Aadhaar card file from Cloudinary
 * Supports deletion by public ID or Cloudinary URL
 * @param {string} publicId - The Cloudinary public_id
 * @param {string} [url] - The Cloudinary URL (fallback for extracting public_id)
 * @returns {Promise<{result: string}>}
 */
export async function deleteAadhaarCard(publicId, url = "") {
    let targetPublicId = (publicId || "").trim();

    if (!targetPublicId && url) {
        try {
            const decoded = decodeURIComponent(url);
            const actualUrl = decoded.includes("url=") ? decoded.split("url=")[1] : decoded;
            const match = actualUrl.match(/\/upload\/(?:v\d+\/)?([^\?#]+)/);
            if (match && match[1]) {
                targetPublicId = match[1].replace(/\.[^/.]+$/, "");
            }
        } catch (e) {
            console.error("Failed to parse publicId from url:", e);
        }
    }

    if (!targetPublicId) {
        return { result: "not_found", message: "No public ID or URL provided" };
    }

    // Attempt 1: Destroy as image (standard for JPG, JPEG, PNG, WEBP, and auto-handled PDFs)
    try {
        const res = await cloudinary.uploader.destroy(targetPublicId, {
            resource_type: "image",
            invalidate: true,
        });
        if (res && res.result === "ok") {
            return res;
        }
    } catch (err) {
        console.warn("Cloudinary destroy (image) attempt error:", err?.message);
    }

    // Attempt 2: Destroy as raw (if uploaded as raw asset)
    try {
        const rawRes = await cloudinary.uploader.destroy(targetPublicId, {
            resource_type: "raw",
            invalidate: true,
        });
        if (rawRes && rawRes.result === "ok") {
            return rawRes;
        }
    } catch (err) {
        console.warn("Cloudinary destroy (raw) attempt error:", err?.message);
    }

    // Attempt 3: If targetPublicId had an extension stripped, try raw with the original extension
    if (url) {
        try {
            const cleanUrl = url.split("?")[0];
            const ext = cleanUrl.split(".").pop()?.toLowerCase();
            if (ext && !targetPublicId.endsWith(`.${ext}`)) {
                const rawWithExt = `${targetPublicId}.${ext}`;
                const rawExtRes = await cloudinary.uploader.destroy(rawWithExt, {
                    resource_type: "raw",
                    invalidate: true,
                });
                if (rawExtRes && rawExtRes.result === "ok") {
                    return rawExtRes;
                }
            }
        } catch (err) {
            console.warn("Cloudinary destroy (raw with ext) error:", err?.message);
        }
    }

    return { result: "ok" };
}

export default cloudinary;

