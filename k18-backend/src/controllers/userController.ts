import type { Request, Response } from "express";
import { prisma } from "../lib/Prisma";
import { stripPassword } from "../utils/user";

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { addresses: true },
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(stripPassword(user));
}

export async function updateMe(req: Request, res: Response) {
  const { firstName, lastName, email } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { firstName, lastName, email },
  });

  res.json(stripPassword(user));
}

export async function listAddresses(req: Request, res: Response) {
  const addresses = await prisma.address.findMany({ where: { userId: req.userId! } });
  res.json(addresses);
}

export async function createAddress(req: Request, res: Response) {
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
      user: { connect: { id: req.userId! } },
    },
  });

  res.status(201).json(address);
}
