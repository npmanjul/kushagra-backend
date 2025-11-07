import { Router } from "express";
import { getAvailableLoan, loanApply, loanCalculation } from "../controller/loan.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

router.route("/getavailableloan").get(authMiddleware , getAvailableLoan);

router.route("/loancalculation").post(authMiddleware , loanCalculation);

router.route("/loanapply").post(authMiddleware , loanApply);

export default router;