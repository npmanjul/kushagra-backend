import { Router } from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import { action_deposite_approvals, get_deposite_approvals } from "../controller/approval.controller.js";

const router = Router();

router.route("/pending-approval").get(authMiddleware, get_deposite_approvals);
router.route("/action-deposite-approval").patch(authMiddleware, action_deposite_approvals);


export default router;