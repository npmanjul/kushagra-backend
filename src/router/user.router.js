import { Router } from "express";
import {
  categoryTransactionDetails,
  checkFarmerVerification,
  dashboardAnalytics,
  findUserDetails,
  getAllGrainDeposite,
  getFarmerUnverifiedFields,
  updateFarmerVerification,
  updateProfileVerification,
  getAllFarmers,
  getFarmerDetails,
  UpdateFarmerDetails,
} from "../controller/user.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";
import multermiddleware from "../middleware/multermiddleware.js";

const router = Router();

router.route("/dashboardanalytics").get(authMiddleware, dashboardAnalytics);

router.route("/getallgraindeposite").get(authMiddleware, getAllGrainDeposite);

router
  .route("/categorytransactiondetails/:category_id")
  .get(authMiddleware, categoryTransactionDetails);

router.route("/finduserdetails").get(authMiddleware, findUserDetails);

router
  .route("/checkfarmerverification")
  .get(authMiddleware, checkFarmerVerification);

router
  .route("/updatefarmerverification")
  .put(authMiddleware, updateFarmerVerification);

router
  .route("/getfarmerunverifiedfields")
  .get(authMiddleware, getFarmerUnverifiedFields);

router.route("/updateprofileverification").put(
  authMiddleware,
  multermiddleware.fields([
    { name: "aadhaar_image", maxCount: 1 },
    { name: "pan_image", maxCount: 1 },
    { name: "khatauni_images", maxCount: 20 },
    { name: "bank_passbook_img", maxCount: 1 },
    { name: "nominee_image", maxCount: 1 },
    { name: "nominee_aadhaar_image", maxCount: 1 },
    { name: "nominee_pan_image", maxCount: 1 },
  ]),
  updateProfileVerification
);

router.route("/getallfarmers").get(authMiddleware, getAllFarmers);

router.route("/getfarmerdetails").get(authMiddleware, getFarmerDetails);

router.route("/updatefarmerdetails").put(
  authMiddleware,
  multermiddleware.fields([
    { name: "user_image", maxCount: 1 },
    { name: "aadhaar_image", maxCount: 1 },
    { name: "pan_image", maxCount: 1 },
    { name: "khatauni_images", maxCount: 20 },
    { name: "bank_passbook_img", maxCount: 1 },
    { name: "nominee_image", maxCount: 1 },
    { name: "nominee_aadhaar_image", maxCount: 1 },
    { name: "nominee_pan_image", maxCount: 1 },
  ]),
  UpdateFarmerDetails
);

export default router;
