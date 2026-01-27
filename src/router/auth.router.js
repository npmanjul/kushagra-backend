import { Router } from "express"    
import { login, checkToken, getProfile, pinVerification, resetPassword, sendOTP, verifyOTP, resetPin, getCompleteProfile, sendOTPForPasswordReset, verifyOTPForPasswordReset } from "../controller/auth.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router()

router.route("/login").post(login);
router.route("/checktoken").get(checkToken);
router.route("/pinverification").post(authMiddleware,pinVerification);
router.route("/getprofile").get(authMiddleware,getProfile);
router.route("/getcompleteprofile").get(authMiddleware, getCompleteProfile);
router.route("/sendotp").post(sendOTP);
router.route("/verifyotp").post(verifyOTP);
router.route("/resetpin").post(resetPin);
router.route("/sendotpforpasswordreset").post(sendOTPForPasswordReset);
router.route("/verifyotpforpasswordreset").post(verifyOTPForPasswordReset);
router.route("/resetpassword").post(resetPassword);

export default router;