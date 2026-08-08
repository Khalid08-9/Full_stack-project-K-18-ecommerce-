import type { Request, Response } from "express";
import { prisma } from "../lib/Prisma";

export async function listProducts(_req: Request, res: Response) {
  const products = await prisma.product.findMany({ include: { colors: true } });
  res.json(products);
}

export async function getProduct(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Invalid product id" });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { colors: true },
  });

  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
}
