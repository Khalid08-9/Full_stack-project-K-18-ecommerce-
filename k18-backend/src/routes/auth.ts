import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/Prisma";
import { sendVerificationCode } from "../lib/emails";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Public-safe view of a user — never leak password or the verification code. */
function safeUser(u: {
  id: string; email: string; firstName: string; lastName: string; emailVerified: boolean;
}) {
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, emailVerified: u.emailVerified };
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

/** Creates + stores a fresh (hashed) code for a user and emails the plain code. */
async function issueVerificationCode(userId: string, email: string) {
  const code = generateCode();
  const hashed = await bcrypt.hash(code, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { verificationCode: hashed, verificationCodeExpires: new Date(Date.now() + CODE_TTL_MS) },
  });
  // The plain code only ever leaves the server via email — never in a response.
  try {
    await sendVerificationCode(email, code);
  } catch (err) {
    console.error("[auth] verification email failed:", err);
  }
}

router.post("/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName },
  });

  await issueVerificationCode(user.id, user.email);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ user: safeUser(user), token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ user: safeUser(user), token });
});

// POST /api/auth/verify-email — { email, code }
// Verifies the emailed code server-side against the stored hash + expiry.
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.emailVerified) return res.json({ user: safeUser(user), alreadyVerified: true });

  if (!user.verificationCode || !user.verificationCodeExpires) {
    return res.status(400).json({ error: "No verification code pending. Request a new one." });
  }
  if (user.verificationCodeExpires.getTime() < Date.now()) {
    return res.status(400).json({ error: "Verification code has expired. Request a new one." });
  }

  const match = await bcrypt.compare(String(code), user.verificationCode);
  if (!match) return res.status(400).json({ error: "Incorrect verification code" });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationCode: null, verificationCodeExpires: null },
  });

  res.json({ user: safeUser(updated) });
});

// POST /api/auth/resend-code — { email }
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.emailVerified) return res.status(400).json({ error: "Email is already verified" });

  await issueVerificationCode(user.id, user.email);
  res.json({ ok: true });
});

export default router;
