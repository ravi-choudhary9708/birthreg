import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";
import { signToken } from "@/libs/jwt";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function POST(request) {
    try {
        await dbConnect();

        const { username, password } = await request.json();

        if (!username || !password) {
            throw new apiError(400, "Username and password are required");
        }

        // Find user by username
        const user = await User.findOne({ username: username.toLowerCase().trim() });

        if (!user) {
            throw new apiError(401, "Invalid username or password");
        }

        // Verify password
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new apiError(401, "Invalid username or password");
        }

        // Generate JWT token
        const token = signToken({
            _id: user._id.toString(),
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
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message, errors: error.errors || [] },
            { status: statusCode }
        );
    }
}
