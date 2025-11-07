import mongoose, { Schema } from "mongoose";

const storageBucketSchema = new Schema({
  bucket_owner_type: {
    type: String,
    enum: ["User", "Warehouse"],
    required: true,
  },
  bucket_owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "bucket_owner_type",
  },
  categories: [
    {
      category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GrainCategories",
        required: true,
      },
      warehouse_storage: [{
        transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: "TransactionHistory" },
        created_at: { type: Date, default: Date.now },
      }],
      total_quantity: { type: Number, default: 0 },
    },
  ],
  created_at: { type: Date, default: Date.now },
});
;

export default mongoose.model("StorageBucket", storageBucketSchema);
