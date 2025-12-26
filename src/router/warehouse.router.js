import {Router} from "express";
import {
  createWarehouse,
  getAllWarehouse,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  getAllManager,
  getAllSupervisor,
  getAllStaff,
  warehouseInventory,
} from "../controller/warehouse.controller.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = Router();

router.route("/createwarehouse").post(createWarehouse);
router.route("/allmanager").get(getAllManager);
router.route("/allsupervisor").get(getAllSupervisor);
router.route("/allstaff").get(getAllStaff);
router.route("/allwarehouse").get(getAllWarehouse);
router.route("/inventory").get(authMiddleware, warehouseInventory);
router.route("/").get(getAllWarehouse);
router.route("/:id").get(getWarehouseById);
router.route("/update/:id").put(updateWarehouse);
router.route("/delete/:id").delete(deleteWarehouse);

export default router;