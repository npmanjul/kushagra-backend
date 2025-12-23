import { Router } from "express";
import { adminOverview } from "../controller/overview.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

router.route("/admin").get(authMiddleware, adminOverview);

export default router;