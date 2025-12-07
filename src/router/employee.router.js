import { Router } from "express";
import {
  employee_onboarding_step_1,
  employee_onboarding_step_2,
  employee_onboarding_step_3,
  employee_onboarding_step_4,
  employee_onboarding_step_5,
  employee_onboarding_step_6,
  employee_onboarding_step_7,
} from "../controller/employee.controller.js";
import multermiddleware from "../middleware/multermiddleware.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

router.route("/onboarding/step1").post(authMiddleware, employee_onboarding_step_1);
router
  .route("/onboarding/step2")
  .post(
    authMiddleware,
    multermiddleware.fields([{ name: "employeeImage", maxCount: 1 }]),
    employee_onboarding_step_2
  );
router.route("/onboarding/step3").post(authMiddleware, employee_onboarding_step_3);
router
  .route("/onboarding/step4")
  .post(authMiddleware, employee_onboarding_step_4);
router.route("/onboarding/step5").post(authMiddleware, employee_onboarding_step_5);
router.route("/onboarding/step6").post(authMiddleware, employee_onboarding_step_6);
router.route("/onboarding/step7").post(authMiddleware, employee_onboarding_step_7);

export default router;
