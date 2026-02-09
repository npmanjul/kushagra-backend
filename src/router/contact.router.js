import { Router } from "express";
import contactController from "../controller/contact.controller.js";

const router = Router();

router.post("/submit-contact", contactController.contactUs);

router.get("/get-all-contacts", contactController.GetAllContacts);

export default router;