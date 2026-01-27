import User from "../model/Users.model.js";
import Farmer from "../model/Farmer.model.js";
import { encryptPassword } from "../utils/bcrypt.js";
import { generateToken } from "../utils/jwt.js";
import { generateFarmerId } from "../utils/miscellaneous.js";
import StorageBucketModel from "../model/StorageBucket.model.js";

// Step 1: Personal Information
const registerStep1 = async (req, res) => {
  try {
    const { name, email, phone_number, password, gender, dob } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Encrypt password
    const hashedPassword = await encryptPassword(password);

    const farmerId = await generateFarmerId();

    const verificationFields = {
      overallStatus: "pending",
      aadhaar_number: { status: "pending" },
      pan_number: { status: "pending" },
      aadhaar_image: { status: "pending" },
      pan_image: { status: "pending" },
      khatauni_images: { status: "pending" },
      // -----------------------------
      address: { status: "pending" },
      tehsil: { status: "pending" },
      district: { status: "pending" },
      state: { status: "pending" },
      landmark: { status: "pending" },
      pin_code: { status: "pending" },
      // -----------------------------
      land_size: { status: "pending" },
      // -----------------------------
      account_number: { status: "pending" },
      ifsc_code: { status: "pending" },
      account_holder: { status: "pending" },
      bank_name: { status: "pending" },
      branch_name: { status: "pending" },
      bank_passbook_img: { status: "pending" },
      // -----------------------------
      nominee_name: { status: "pending" },
      nominee_dob: { status: "pending" },
      nominee_phone: { status: "pending" },
      nominee_email: { status: "pending" },
      nominee_aadhaar: { status: "pending" },
      nominee_pan: { status: "pending" },
      nominee_relation: { status: "pending" },
      nominee_gender: { status: "pending" },
      nominee_address: { status: "pending" },
      nominee_image: { status: "pending" },
      nominee_aadhaar_image: { status: "pending" },
      nominee_pan_image: { status: "pending" },
    };

    // Create user
    const newUser = await User.create({
      name,
      email,
      phone_number,
      password: hashedPassword,
      role: "farmer",
      gender,
      dob,
      step_completed: 1,
      farmerVerification: verificationFields,
    });

    // Create farmer profile linked to this user
    const farmerProfile = await Farmer.create({
      user: newUser._id,
      farmerId: farmerId,
    });

    // Create storage bucket for farmer
    await StorageBucketModel.create({
      bucket_owner_type: "User",
      bucket_owner_id: newUser._id,
      categories: [],
    });

    // Link farmer profile to user
    await User.findByIdAndUpdate(newUser._id, {
      farmerProfile: farmerProfile._id,
    });

    // Generate tokens
    const token = await generateToken(newUser._id);

    return res.status(200).json({
      message: "Step 1 saved",
      step_completed: newUser.step_completed,
      token: token,
    });
  } catch (error) {
    console.error("Step 1 Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Step 2: Address
const registerStep2 = async (req, res) => {
  try {
    const userId = req.user.userId; // comes from authMiddleware

    const { address, tehsil, district, state, landmark, pin_code } = req.body;

    // Find farmer profile using user ID
    const farmerProfile = await Farmer.findOne({ user: userId });

    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // Update the farmer profile
    const updatedFarmer = await Farmer.findByIdAndUpdate(
      farmerProfile._id,
      {
        address,
        tehsil,
        district,
        state,
        landmark,
        pin_code,
      },
      { new: true }
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        step_completed: 2,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Step 2 saved successfully",
      step_completed: updatedUser.step_completed,
      data: updatedFarmer,
    });
  } catch (error) {
    console.error("Step 2 Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Step 3: Documents & IDs (accepts S3 public URLs from frontend)
const registerStep3 = async (req, res) => {
  try {
    const {
      aadhaar_number,
      pan_number,
      land_size,
      khatauni_entries, 
      userImage,        // S3 public URL
      aadhaarImg,       // S3 public URL
      panImg,           // S3 public URL
    } = req.body;

    if (!pan_number) {
      return res.status(400).json({ message: "PAN number is required" });
    }

    const userId = req.user.userId; // from auth middleware

    // Find farmer profile using the user id
    const farmerProfile = await Farmer.findOne({ user: userId }).select(
      "aadhaar_image pan_image khatauni_images user_image"
    );

    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // Note: Old images in S3 can be cleaned up via a separate cleanup job or S3 lifecycle rules
    // We no longer delete from Cloudinary since we're using S3 now

    // Prepare khatauni entries from the frontend data
    const khatauniEntries = Array.isArray(khatauni_entries)
      ? khatauni_entries.map((entry) => ({
        khatauni_id: entry.id,
        image_url: entry.imageUrl || null,
      }))
      : [];

    // --- FINAL UPDATE with S3 URLs ---
    const updateData = {
      aadhaar_number,
      pan_number,
      land_size,
      user_image: userImage || null,
      aadhaar_image: aadhaarImg || null,
      pan_image: panImg || null,
      khatauni_images: khatauniEntries,
    };

    const updatedFarmer = await Farmer.findByIdAndUpdate(
      farmerProfile._id,
      updateData,
      { new: true }
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        step_completed: 3,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Step 3 saved successfully",
      step_completed: updatedUser.step_completed,
      khatauni_entries_saved: (updatedFarmer.khatauni_images || []).length,
      data: updatedFarmer,
    });
  } catch (error) {
    console.error("Step 3 Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Step 4: Bank Details (accepts S3 public URLs from frontend)
const registerStep4 = async (req, res) => {
  try {
    const {
      account_number,
      ifsc_code,
      account_holder,
      bank_name,
      branch_name,
      bank_passbook_img, // S3 public URL
    } = req.body;

    const userId = req.user.userId; // from authMiddleware

    // Find FarmerProfile by linked user
    const farmerProfile = await Farmer.findOne({ user: userId });

    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // Note: Old images in S3 can be cleaned up via a separate cleanup job or S3 lifecycle rules
    // We no longer delete from Cloudinary since we're using S3 now

    // --- Update FarmerProfile with S3 URL ---
    await Farmer.findByIdAndUpdate(
      farmerProfile._id,
      {
        account_number,
        ifsc_code,
        account_holder,
        bank_name,
        branch_name,
        bank_passbook_img: bank_passbook_img || null,
      },
      { new: true }
    );

    // --- Update User step_completed ---
    await User.findByIdAndUpdate(userId, { step_completed: 4 });

    return res.status(200).json({
      message: "Step 4 saved successfully",
      step_completed: 4,
    });
  } catch (error) {
    console.error("Step 4 Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Step 5: Nominee (accepts S3 public URLs from frontend)
const registerStep5 = async (req, res) => {
  try {
    const {
      nominee_name,
      nominee_dob,
      nominee_phone,
      nominee_email,
      nominee_aadhaar,
      nominee_pan,
      nominee_relation,
      nominee_gender,
      nominee_address,
      nominee_image,         // S3 public URL
      nominee_aadhaar_image, // S3 public URL
      nominee_pan_image,     // S3 public URL
    } = req.body;

    const userId = req.user.userId;

    // Find farmer profile linked to this user
    const farmerProfile = await Farmer.findOne({ user: userId });

    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // Note: Old images in S3 can be cleaned up via a separate cleanup job or S3 lifecycle rules
    // We no longer delete from Cloudinary since we're using S3 now

    // --- UPDATE FARMER PROFILE with S3 URLs ---
    await Farmer.findByIdAndUpdate(
      farmerProfile._id,
      {
        nominee_name,
        nominee_dob,
        nominee_phone,
        nominee_email,
        nominee_aadhaar,
        nominee_pan,
        nominee_relation,
        nominee_gender,
        nominee_address,
        nominee_image: nominee_image || null,
        nominee_aadhaar_image: nominee_aadhaar_image || null,
        nominee_pan_image: nominee_pan_image || null,
      },
      { new: true }
    );

    // --- UPDATE USER STEP COMPLETED ---
    await User.findByIdAndUpdate(userId, { step_completed: 5 });

    return res.status(200).json({
      message: "Step 5 (Nominee Details) saved successfully 🎉",
      step_completed: 5,
    });
  } catch (error) {
    console.error("Step 5 Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// step 6: set PIN
const registerStep6 = async (req, res) => {
  try {
    const { account_pin } = req.body;
    const userId = req.user.userId;

    if (!account_pin) {
      return res.status(400).json({ message: "PIN is required" });
    }

    // Check if User exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Farmer profile check (just to ensure profile exists, same as steps 2–5)
    const farmerProfile = await Farmer.findOne({ user: userId });
    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // Encrypt PIN
    const encryptedPIN = await encryptPassword(account_pin);

    // Update user's PIN + step
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        account_pin: encryptedPIN,
        step_completed: 6,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Step 6 saved successfully",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Step 6 Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const currentStep = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      currentStep: user.step_completed,
    });
  } catch (error) {
    console.error("Error fetching current step:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  registerStep5,
  registerStep6,
  currentStep,
};
