import { Router } from "express";
import { allTransactions, userAllTransactions } from "../controller/transaction.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

router.route("/getallusertransactions").get(authMiddleware,userAllTransactions);

router.route("/getalltransactions").get(authMiddleware,allTransactions);


export default router;