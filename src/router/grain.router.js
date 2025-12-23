import {Router} from "express";
import {CreateGrainCategoies, getAllGrainCategories} from "../controller/grain.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router=Router();

router.route("/creategraincategories").post(authMiddleware,CreateGrainCategoies);

router.route("/allgraincategories").get(getAllGrainCategories);

export default router;