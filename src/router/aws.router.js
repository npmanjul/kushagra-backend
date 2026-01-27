import { Router } from "express"    
import awsController from "../controller/aws.controller.js";

const router = Router()

router.route("/getpresigneduploadurls").post(awsController.getPresignedUploadUrls);

export default router;