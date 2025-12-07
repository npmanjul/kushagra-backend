import mongoose from "mongoose";
const { Schema } = mongoose;

const warehouseSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity_quintal: { type: Number, required: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "EmployeeProfile" },
  supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: "EmployeeProfile" },
  staff_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "EmployeeProfile" }],
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Warehouse", warehouseSchema);