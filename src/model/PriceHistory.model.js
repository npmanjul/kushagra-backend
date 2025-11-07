import mongoose from "mongoose";
const { Schema } = mongoose;

const PriceHistorySchema = new Schema({
  grain_name: { type: String, required: true },
  maxprice: {
    grain_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrainCategories",
      required: true,
    },
    price: { type: Number, required: true },
  },
  avgprice: {
    grain_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrainCategories",
      required: true,
    },
    price: { type: Number, required: true },
  },
  minprice: {
    grain_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrainCategories",
      required: true,
    },
    price: { type: Number, required: true },
  },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("PriceHistory", PriceHistorySchema);
