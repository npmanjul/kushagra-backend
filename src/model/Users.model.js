import mongoose from "mongoose";
const { Schema } = mongoose;

const UserRole = ["farmer", "manager","Supervisor", "admin"];
const Gender = ["male", "female", "other"];

const userSchema = new Schema(
  {
    userId: { type: String, unique: true},
    role: { type: String, enum: UserRole, required: true },
    name: { type: String, required: true },
    phone_number: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    account_pin: String,
    gender: { type: String, enum: Gender },
    dob: String,

    // Address
    address: String,
    tehsil: String,
    district: String,
    state: String,
    landmark: String,
    pin_code: String,

    // Farmer Identity
    user_image: String,
    aadhaar_number: { type: String, unique: true, sparse: true },
    pan_number: { type: String, unique: true, sparse: true },
    khatauni_id: String,
    aadhaar_image: String,
    pan_image: String,
    khatauni_image: String,

    registration_date: { type: Date, default: Date.now },
    land_size: { type: mongoose.Schema.Types.Decimal128 },

    // Bank
    account_number: { type: String, unique: true, sparse: true },
    ifsc_code: String,
    account_holder: String,
    bank_name: String,
    branch_name: String,
    bank_passbook_img: String,

    // Nominee
    nominee_name: String,
    nominee_dob: String,
    nominee_phone: String,
    nominee_email: String,
    nominee_aadhaar: String,
    nominee_pan: String,
    nominee_relation: String,
    nominee_gender: { type: String, enum: Gender },
    nominee_address: String,
    nominee_image: String,
    nominee_aadhaar_image: String,
    nominee_pan_image: String,

    // Progress Tracking
    step_completed: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
     },

  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Users", userSchema);
