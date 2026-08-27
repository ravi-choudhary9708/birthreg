import { NextResponse } from "next/server";
import { verifyToken } from "@/libs/jwt";

export function proxy(request) {
    const { pathname } = request.nextUrl;

    // Protect all /dashboard and /api/admin routes
    const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/api/admin");

    if (!isProtected) return NextResponse.next();

    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
        // For API routes, return JSON error
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { success: false, message: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }
        // For page routes, redirect to login
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired session. Please log in again." },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based access: verifier cannot access operator routes and vice versa
    if (pathname.startsWith("/dashboard/verifier") && decoded.role !== "verifier") {
        return NextResponse.redirect(new URL(`/dashboard/${decoded.role}`, request.url));
    }
    if (pathname.startsWith("/dashboard/operator") && decoded.role !== "operator") {
        return NextResponse.redirect(new URL(`/dashboard/${decoded.role}`, request.url));
    }

    // Attach user info to request headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded._id);
    requestHeaders.set("x-user-role", decoded.role);
    requestHeaders.set("x-user-facility", decoded.facility || "");

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
