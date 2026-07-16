import { Router } from "express";
import { prisma } from "../lib/Prisma";

const router = Router();

// GET /api/products
router.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    include: { colors: true }
  });
  res.json(products);
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { colors: true }
  });

  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

export default router;