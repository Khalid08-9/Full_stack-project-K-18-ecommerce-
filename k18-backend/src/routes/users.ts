import { Router } from "express";
import { prisma } from "../lib/Prisma";

const router = Router();

router.get("/me", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: true }
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

router.patch("/me", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { firstName, lastName, email } = req.body;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, email }
  });

  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// GET /api/users/me/addresses — list the current user's saved addresses
router.get("/me/addresses", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const addresses = await prisma.address.findMany({ where: { userId } });
  res.json(addresses);
});

// POST /api/users/me/addresses — add a new address for the current user
router.post("/me/addresses", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { label, street, city, state, zip, country } = req.body;
  if (!street || !city) {
    return res.status(400).json({ error: "Street and city are required" });
  }

  const address = await prisma.address.create({
    data: {
      label: label || "Address",
      street,
      city,
      state: state || "",
      zip: zip || "",
      country: country || "",
      user: { connect: { id: userId } },
    },
  });

  res.status(201).json(address);
});

export default router;