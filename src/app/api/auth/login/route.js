import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { verifyPassword } from "@/libs/auth";
import { signToken } from "@/libs/jwt";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            throw new apiError(400, "Username and password are required");
        }

        // Find user by username in PostgreSQL
        const user = await prisma.user.findUnique({
            where: { username: username.toLowerCase().trim() }
        });

        if (!user) {
            throw new apiError(401, "Invalid username or password");
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            throw new apiError(401, "Invalid username or password");
        }

        // Generate JWT token
        const token = signToken({
            _id: user.id,
            id: user.id,
            username: user.username,
            role: user.role,
            facility: user.facility,
        });

        // Set cookie and return response
        const response = NextResponse.json(
            new apiResponse(200, { role: user.role, username: user.username, facility: user.facility }, "Login successful"),
            { status: 200 }
        );

        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Login API Error:", error.message || error);
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred during login", errors: error.errors || [] },
            { status: statusCode }
        );
    }
}
