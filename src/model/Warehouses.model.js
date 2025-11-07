import mongoose from "mongoose";
const { Schema } = mongoose;

const warehouseSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity_quintal: { type: Number, required: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Warehouses", warehouseSchema);