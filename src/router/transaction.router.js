import { Router } from "express";
import { userAllTransactions } from "../controller/transaction.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

router.route("/getalltransactions").get(authMiddleware,userAllTransactions);

export default router;