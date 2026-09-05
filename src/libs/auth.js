import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

export function generateAccessToken(user) {
    return jwt.sign(
        {
            _id: user.id,
            id: user.id,
            role: user.role,
            username: user.username,
            facility: user.facility,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES || "1d",
        }
    );
}
