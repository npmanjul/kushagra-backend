import { Router } from "express"    
import { login, checkToken, getProfile, pinVerification } from "../controller/auth.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router()

router.route("/login").post(login);
router.route("/checktoken").get(checkToken);
router.route("/pinverification").post(authMiddleware,pinVerification);
router.route("/getprofile").get(authMiddleware,getProfile);

export default router;