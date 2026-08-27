import { v2 as cloudinary } from "cloudinary";

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

export default cloudinary;
