import { Router } from "express";
import { sellGrain } from "../controller/sell.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

router.route("/sellgrain").post(authMiddleware, sellGrain);

export default router;
