import { Router } from "express";
import { prisma } from "../lib/Prisma";
import { sendOrderConfirmation } from "../lib/emails";

const router = Router();

router.get("/", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { date: "desc" }
  });

  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true }
  });

  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

router.post("/", async (req, res) => {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      total,
      items: {
        create: items.map((item: any) => ({
          name: item.name,
          image: item.image,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          product: { connect: { id: item.productId } }
        }))
      }
    },
    include: { items: true }
  });

  // Fire the confirmation email. Guarded so a mail failure never fails the
  // order — the order is already committed at this point.
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) await sendOrderConfirmation(user.email, order);
  } catch (err) {
    console.error("[order] confirmation email failed:", err);
  }

  res.status(201).json(order);
});

export default router;