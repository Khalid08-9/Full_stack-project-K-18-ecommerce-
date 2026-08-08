import type { Request, Response } from "express";
import { prisma } from "../lib/Prisma";
import { toSafeUser } from "../utils/user";
import {
  hashPassword,
  issueVerificationCode,
  signToken,
  verifyPassword,
} from "../services/authService";

export async function register(req: Request, res: Response) {
  const { email, password, firstName, lastName } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName },
  });

  await issueVerificationCode(user.id, user.email);

  const token = signToken(user.id);
  res.status(201).json({ user: toSafeUser(user), token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await verifyPassword(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken(user.id);
  res.json({ user: toSafeUser(user), token });
}

export async function verifyEmail(req: Request, res: Response) {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.emailVerified) return res.json({ user: toSafeUser(user), alreadyVerified: true });

  if (!user.verificationCode || !user.verificationCodeExpires) {
    return res.status(400).json({ error: "No verification code pending. Request a new one." });
  }
  if (user.verificationCodeExpires.getTime() < Date.now()) {
    return res.status(400).json({ error: "Verification code has expired. Request a new one." });
  }

  const match = await verifyPassword(String(code), user.verificationCode);
  if (!match) return res.status(400).json({ error: "Incorrect verification code" });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationCode: null, verificationCodeExpires: null },
  });

  res.json({ user: toSafeUser(updated) });
}

export async function resendCode(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.emailVerified) return res.status(400).json({ error: "Email is already verified" });

  await issueVerificationCode(user.id, user.email);
  res.json({ ok: true });
}
