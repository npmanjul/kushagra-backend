import mongoose from "mongoose";
const { Schema } = mongoose;

const grainCategorySchema = new Schema({
  grain_type: { type: String, required: true },
  total_quantity: { type: Number },
  unit: { type: String, default: "quintal" },
  quality: { type: String, enum: ["A", "B", "C"] },
  price_history: [  { type: mongoose.Schema.Types.ObjectId, ref: "PriceHistory" } ],
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("GrainCategories", grainCategorySchema);
