import { Router } from "express";
import { requireUser } from "../middleware/auth";
import * as orderController from "../controllers/orderController";

const router = Router();

router.get("/", requireUser, orderController.listOrders);
router.get("/:id", orderController.getOrder);
router.post("/", requireUser, orderController.createOrder);

export default router;
