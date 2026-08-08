import { Router } from "express";
import { requireUser } from "../middleware/auth";
import * as userController from "../controllers/userController";

const router = Router();

router.get("/me", requireUser, userController.getMe);
router.patch("/me", requireUser, userController.updateMe);
router.get("/me/addresses", requireUser, userController.listAddresses);
router.post("/me/addresses", requireUser, userController.createAddress);

export default router;
