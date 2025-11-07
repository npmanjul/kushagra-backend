import {Router} from "express";
import {addTodayPrice, getAllPriceHistory, getPriceHistoryByGrain, getTodayPrice} from "../controller/pricehistory.controller.js";

const router = Router();

router.route("/addtodayprice").post(addTodayPrice);

router.route("/allpricehistory/:id").get(getAllPriceHistory);

router.route("/todayprice").get(getTodayPrice);

router.route("/pricehistorybygrain").get(getPriceHistoryByGrain);

export default router;