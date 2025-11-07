import {Router} from "express";
import {CreateGrainCategoies, getAllGrainCategories} from "../controller/grain.controller.js";

const router=Router();

router.route("/creategraincategories").post(CreateGrainCategoies);

router.route("/allgraincategories").get(getAllGrainCategories);

export default router;