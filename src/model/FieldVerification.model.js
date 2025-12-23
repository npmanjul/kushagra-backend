import mongoose from "mongoose";
const { Schema } = mongoose;

export const FieldVerificationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reason: {
      type: String, // rejection reason
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "Approval",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
  { _id: false }
);
