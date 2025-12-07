import mongoose from "mongoose";
const { Schema } = mongoose;

/* ------------ Reusable Sub-Schemas ------------- */

const AddressSub = {
  line1: String,
  line2: String,
  city: String,
  state: String,
  country: { type: String, default: "India" },
  postalCode: String,
};

const EducationSchema = new Schema(
  {
    qualification: String,
    institution: String,
    boardOrUniversity: String,
    yearOfPassing: Number,
    percentageOrCgpa: String,
    certificateUrl: String,
  },
  { _id: false }
);

const ExperienceSchema = new Schema(
  {
    companyName: String,
    title: String,
    startDate: Date,
    endDate: Date,
    responsibilities: String,
    lastDrawnSalary: Number,
  },
  { _id: false }
);

const EmergencyContactSchema = new Schema(
  {
    name: String,
    relationship: String,
    phone: String,
    alternatePhone: String,
    address: String,
  },
  { _id: false }
);

/* ------------ EmployeeProfile Schema ------------- */

const EmployeeProfileSchema = new Schema(
  {
    // Step 1 stored in USER MODEL only → remove duplicates
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // Employee Identity (Employee-only)
    employeeId: { type: String, required: true, unique: true, index: true },

    // -------- Step 2: Personal Info --------
    employeeImage: String,
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", "Separated"],
    },
    nationality: { type: String, default: "Indian" },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      default: "Unknown",
    },

    // -------- Step 3: Address --------
    permanentAddress: AddressSub,
    currentAddress: AddressSub,
    sameAsPermanent: { type: Boolean, default: false },

    // -------- Step 4: Employment --------
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Internship", "Temporary"],
      default: "Full-Time",
    },
    dateOfJoining: { type: Date, default: Date.now },
    
    reportingManager: { type: Schema.Types.ObjectId, ref: "EmployeeProfiles" },

    employmentStatus: {
      type: String,
      enum: ["Active", "On Leave", "Resigned", "Terminated", "Retired", "Probation"],
      default: "Active",
    },
    isActive: { type: Boolean, default: true },
    
    // -------- Salary & Bank --------
    salary: Number,
    account_number: { type: String, unique: true, sparse: true },
    ifsc_code: String,
    account_holder: String,
    bank_name: String,
    branch_name: String,
    upiId: String,

    // Govt IDs
    panNumber: { type: String, unique: true, sparse: true },
    aadhaarNumber: { type: String, unique: true, sparse: true },
    passportNumber: { type: String, unique: true, sparse: true },
    passportExpiry: Date,
    pfNumber: { type: String, unique: true, sparse: true },
    esiNumber: { type: String, unique: true, sparse: true },
    taxStatus: String,

    // -------- Step 5: Education --------
    education: [EducationSchema],
    certifications: [
      {
        title: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialUrl: String,
      },
    ],

    // -------- Step 6: Experience --------
    experience: [ExperienceSchema],
    totalExperienceYears: Number,

    // -------- Step 7: Additional --------
    skills: [String],
    medicalConditions: String,
    emergencyContacts: [EmergencyContactSchema],
    hrNotes: String,

    // Access
    backgroundCheckStatus: {
      type: String,
      enum: ["Pending", "Clear", "Failed"],
      default: "Pending",
    },
    onboardingCompleted: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EmployeeProfileSchema.statics.findWithUser = function (q = {}) {
  return this.find(q).populate("user");
};

export default mongoose.model("EmployeeProfiles", EmployeeProfileSchema);