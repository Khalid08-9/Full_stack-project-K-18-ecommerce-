import { Router } from "express";
import { cart } from "../data/cart";

const router = Router();

router.get("/", (req, res) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 12;
  res.json({ items: cart, subtotal, shipping, total: subtotal + shipping });
});

router.post("/items", (req, res) => {
  const { productId, name, image, color, size, quantity, price } = req.body;
  const id = `${productId}-${color}-${size}`;

  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id, productId, name, image, color, size, quantity, price });
  }

  res.status(201).json(cart);
});

// PATCH /api/cart/items/:id
router.patch("/items/:id", (req, res) => {
  const item = cart.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found" });

  item.quantity = req.body.quantity;
  res.json(cart);
});

router.delete("/items/:id", (req, res) => {
  const index = cart.findIndex((i) => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Item not found" });

  cart.splice(index, 1);
  res.json(cart);
});

export default router;