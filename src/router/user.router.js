import {Router} from "express";
import {categoryTransactionDetails, dashboardAnalytics, findUserDetails, getAllGrainDeposite} from "../controller/user.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router=Router();

router.route("/dashboardanalytics").get(authMiddleware,dashboardAnalytics);

router.route("/getallgraindeposite").get(authMiddleware,getAllGrainDeposite);

router.route("/categorytransactiondetails/:category_id").get(authMiddleware,categoryTransactionDetails);

router.route("/finduserdetails").get(authMiddleware, findUserDetails);

export default router;