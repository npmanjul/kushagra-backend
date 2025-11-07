import {Router} from "express";
import {grainDeposite} from "../controller/deposite.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router=Router();

router.route("/graindeposite").post(authMiddleware,grainDeposite);

export default router;