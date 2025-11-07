import { Router } from "express";
import {
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  registerStep5,
  registerStep6,
  currentStep,
} from "../controller/register.controller.js";
import multermiddleware from "../middleware/multermiddleware.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

// step 1
router.route("/step1").post(registerStep1);

// step 2
router
  .route("/step2")
  .post(authMiddleware, multermiddleware.none(), registerStep2);

// step 3
router.route("/step3").post(
  authMiddleware,
  multermiddleware.fields([
    { name: "userImage", maxCount: 1 },
    { name: "khatauniImg", maxCount: 1 },
    { name: "aadhaarImg", maxCount: 1 },
    { name: "panImg", maxCount: 1 },
  ]),
  registerStep3
);

// step 4
router
  .route("/step4")
  .post(
    authMiddleware,
    multermiddleware.fields([{ name: "bank_passbook_img", maxCount: 1 }]),
    registerStep4
  );

// step 5
router.route("/step5").post(
  authMiddleware,
  multermiddleware.fields([
    { name: "nominee_image", maxCount: 1 },
    { name: "nominee_aadhaar_image", maxCount: 1 },
    { name: "nominee_pan_image", maxCount: 1 },
  ]),
  registerStep5
);

// step 6
router.route("/step6").post(authMiddleware,multermiddleware.none(), registerStep6);

router.route("/currentstep").get(authMiddleware,currentStep);

export default router;
