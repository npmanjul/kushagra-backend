import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: Date.now,
      index: { expires: 600 }, // 10 minutes
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("OTP", otpSchema);