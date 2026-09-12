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

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "birthreg/aadhaar-documents",
                public_id: publicId,
                resource_type: "auto",
                format: sanitizedExt === "jpeg" ? "jpg" : sanitizedExt,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id, format: result.format });
            }
        );
        uploadStream.end(buffer);
    });
}

export default cloudinary;

