/**
 * Helper to ensure document URLs (specifically Cloudinary PDFs that return 401 on direct CDN delivery)
 * are routed through our authenticated server-side viewer.
 *
 * @param {string} url - Stored document URL
 * @returns {string} - Safe, viewable document URL
 */
export function getDocumentViewUrl(url) {
    if (!url) return "";
    if (url.startsWith("/api/documents/view")) return url;

    const isCloudinary = url.includes("cloudinary.com");
    const isPdf = url.toLowerCase().includes(".pdf") || url.includes("/raw/");

    if (isCloudinary && isPdf) {
        return `/api/documents/view?url=${encodeURIComponent(url)}`;
    }

    return url;
}
