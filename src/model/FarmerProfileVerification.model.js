import mongoose from "mongoose";
import  {FieldVerificationSchema}  from "./FieldVerification.model.js";

const { Schema } = mongoose;

export const FarmerProfileVerificationSchema = new Schema(
  {
    overallStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    // -----------------------------
    // Identity
    // -----------------------------
    aadhaar_number: FieldVerificationSchema,
    pan_number: FieldVerificationSchema,

    aadhaar_image: FieldVerificationSchema,
    pan_image: FieldVerificationSchema,
    khatauni_images: FieldVerificationSchema,

    // -----------------------------
    // Address
    // -----------------------------
    address: FieldVerificationSchema,
    tehsil: FieldVerificationSchema,
    district: FieldVerificationSchema,
    state: FieldVerificationSchema,
    landmark: FieldVerificationSchema,
    pin_code: FieldVerificationSchema,

    // -----------------------------
    // Land Details
    // -----------------------------
    land_size: FieldVerificationSchema,

    // -----------------------------
    // Bank Details
    // -----------------------------
    account_number: FieldVerificationSchema,
    ifsc_code: FieldVerificationSchema,
    account_holder: FieldVerificationSchema,
    bank_name: FieldVerificationSchema,
    branch_name: FieldVerificationSchema,
    bank_passbook_img: FieldVerificationSchema,

    // -----------------------------
    // Nominee Details
    // -----------------------------
    nominee_name: FieldVerificationSchema,
    nominee_dob: FieldVerificationSchema,
    nominee_phone: FieldVerificationSchema,
    nominee_email: FieldVerificationSchema,
    nominee_aadhaar: FieldVerificationSchema,
    nominee_pan: FieldVerificationSchema,
    nominee_relation: FieldVerificationSchema,
    nominee_gender: FieldVerificationSchema,
    nominee_address: FieldVerificationSchema,
    nominee_image: FieldVerificationSchema,
    nominee_aadhaar_image: FieldVerificationSchema,
    nominee_pan_image: FieldVerificationSchema,
  },
  { _id: false }
);
