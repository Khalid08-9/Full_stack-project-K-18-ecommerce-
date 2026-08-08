import type { Request, Response } from "express";
import { prisma } from "../lib/Prisma";
import { sendOrderConfirmation } from "../lib/emails";

interface OrderItemInput {
  name: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  productId: string;
}

export async function listOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId! },
    include: { items: true },
    orderBy: { date: "desc" },
  });

  res.json(orders);
}

export async function getOrder(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: "Invalid order id" });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
}

export async function createOrder(req: Request, res: Response) {
  const { items } = req.body as { items?: OrderItemInput[] };
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId: req.userId!,
      total,
      items: {
        create: items.map((item) => ({
          name: item.name,
          image: item.image,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          product: { connect: { id: item.productId } },
        })),
      },
    },
    include: { items: true },
  });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (user?.email) await sendOrderConfirmation(user.email, order);
  } catch (err) {
    console.error("[order] confirmation email failed:", err);
  }

  res.status(201).json(order);
}
