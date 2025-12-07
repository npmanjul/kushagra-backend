import {Router} from "express";
import {grainDeposit} from "../controller/deposite.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router=Router();

router.route("/graindeposite").post(authMiddleware,grainDeposit);

export default router;