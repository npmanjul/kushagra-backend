// models/FarmerProfile.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const KhatauniSchema = new Schema(
  {
    khatauni_id: { type: String },
    image_url: { type: String },
  },
  { _id: false }
);

const FarmerProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    // ID
    farmerId: { type: String, unique: true, required: true, index: true },

    // Flat address (you can keep both structured if you want)
    address: { type: String },
    tehsil: { type: String },
    district: { type: String },
    state: { type: String },
    landmark: { type: String },
    pin_code: { type: String },

    // Farmer identity (sparse unique so only enforced when present)
    aadhaar_number: { type: String, unique: true, sparse: true },
    pan_number: { type: String, unique: true, sparse: true },
    aadhaar_image: { type: String },
    pan_image: { type: String },
    khatauni_images: [KhatauniSchema],
    user_image: { type: String },

    // Land and agrarian details
    land_size: { type: mongoose.Schema.Types.Decimal128 },

    // Bank — sparse unique for account_number when provided
    account_number: { type: String, unique: true, sparse: true },
    ifsc_code: { type: String },
    account_holder: { type: String },
    bank_name: { type: String },
    branch_name: { type: String },
    bank_passbook_img: { type: String },

    // Nominee details
    nominee_name: { type: String },
    nominee_dob: { type: String },
    nominee_phone: { type: String },
    nominee_email: { type: String },
    nominee_aadhaar: { type: String },
    nominee_pan: { type: String },
    nominee_relation: { type: String },
    nominee_gender: { type: String, enum: ["male", "female", "other"] },
    nominee_address: { type: String },
    nominee_image: { type: String },
    nominee_aadhaar_image: { type: String },
    nominee_pan_image: { type: String },
  },
  { timestamps: true }
);

// Optional: helper static to fetch CommonUser and populate profile
FarmerProfileSchema.statics.findWithUser = function (query = {}) {
  return this.find(query).populate("user");
};

export default mongoose.model("FarmerProfiles", FarmerProfileSchema);