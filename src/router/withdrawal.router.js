import { Router } from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import { createWithdrawalRequest } from "../controller/withdrawal.controller.js";

const router = Router();

router.route("/grainwithdrawal").post(authMiddleware, createWithdrawalRequest);

export default router;