import { Router } from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import { action_deposite_approvals, action_loan_approvals, action_sell_approvals, action_withdraw_approvals, get_deposite_approvals, get_loan_approvals, get_sell_approvals, get_withdraw_approvals, getAllPendingApprovals } from "../controller/approval.controller.js";

const router = Router();

router.route("/pending-deposite-approval").get(authMiddleware, get_deposite_approvals);
router.route("/action-deposite-approval").patch(authMiddleware, action_deposite_approvals);
router.route("/pending-withdraw-approval").get(authMiddleware, get_withdraw_approvals);
router.route("/action-withdraw-approval").patch(authMiddleware, action_withdraw_approvals);
router.route("/pending-sell-approval").get(authMiddleware, get_sell_approvals);
router.route("/action-sell-approval").patch(authMiddleware, action_sell_approvals);
router.route("/pending-loan-approval").get(authMiddleware, get_loan_approvals);
router.route("/action-loan-approval").patch(authMiddleware, action_loan_approvals);
router.route("/all-pending-approvals").get(authMiddleware, getAllPendingApprovals);


export default router;