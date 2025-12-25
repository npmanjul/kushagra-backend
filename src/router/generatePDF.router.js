import { Router } from "express";
import generatePDF from "../controller/generatePDF.controller";

const router = Router();

router.route("/:service").post(generatePDF);

export default router;