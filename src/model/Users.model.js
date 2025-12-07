import mongoose from "mongoose";
const { Schema } = mongoose;

export const Roles = ["farmer", "manager", "supervisor", "admin", "staff"];
export const Genders = ["male", "female", "other"];

const UserSchema = new Schema(
  {
    // User role
    role: { type: String, enum: Roles, required: true },

    // Basic profile
    name: { type: String, required: true },
    phone_number: { type: String, unique: true, required: true },
    secondary_phone_number: { type: String },
    email: { type: String, unique: true, required: true },
    gender: { type: String, enum: Genders },
    dob: { type: String },
    
    // credential
    password: { type: String, required: true },
    account_pin: { type: String },
    
    // Verification and flags
    registration_date: { type: Date, default: Date.now },
    step_completed: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeProfile",
    }, // who verified
    verifiedAt: { type: Date },

    // links to role-specific profiles (one-to-one)
    farmerProfile: {
      type: Schema.Types.ObjectId,
      ref: "FarmerProfile",
      default: null,
    },
    employeeProfile: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeProfile",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// convenience virtual to get whichever profile exists
UserSchema.virtual("profile").get(function () {
  if (this.role === "farmer") return this.farmerProfile;
  return this.employeeProfile;
});

export default mongoose.model("Users", UserSchema);
