import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/Prisma";
import { sendVerificationCode } from "../lib/emails";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

/** Creates + stores a fresh (hashed) code for a user and emails the plain code. */
export async function issueVerificationCode(userId: string, email: string) {
  const code = generateCode();
  const hashed = await bcrypt.hash(code, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { verificationCode: hashed, verificationCodeExpires: new Date(Date.now() + CODE_TTL_MS) },
  });
  try {
    await sendVerificationCode(email, code);
  } catch (err) {
    console.error("[auth] verification email failed:", err);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
