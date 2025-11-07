import User from "../model/Users.model.js";
import { encryptPassword } from "../utils/bcrypt.js";
import {
  deleteFromCloudinary,
  extractPublicId,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { generateToken } from "../utils/jwt.js";
import { generateFarmerId } from "../utils/miscellaneous.js";

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

    const userId = await generateFarmerId();

    // Create user
    const newUser = await User.create({
      userId: userId,
      name,
      email,
      phone_number,
      password: hashedPassword,
      role: "farmer",
      gender,
      dob,
      step_completed: 1,
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

    // Update user in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        address,
        tehsil,
        district,
        state,
        landmark,
        pin_code,
        step_completed: 2,
      },
      { new: true } // return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Step 2 saved",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Step 2 Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Step 3: Farmer Identification (Mongoose)
const registerStep3 = async (req, res) => {
  try {
    const { aadhaar_number, pan_number, khatauni_id, land_size } = req.body;
    const { aadhaarImg, panImg, khatauniImg, userImage } = req.files;
    const userId = req.user.userId; // from authMiddleware

    // Get existing user data
    const existingUser = await User.findById(userId).select(
      "aadhaar_image pan_image khatauni_image user_image"
    );

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Delete old images if present ---
    if (existingUser.user_image) {
      const publicId = extractPublicId(existingUser.user_image);
      if (publicId) await deleteFromCloudinary(publicId);
    }
    if (existingUser.aadhaar_image) {
      const publicId = extractPublicId(existingUser.aadhaar_image);
      if (publicId) await deleteFromCloudinary(publicId);
    }
    if (existingUser.pan_image) {
      const publicId = extractPublicId(existingUser.pan_image);
      if (publicId) await deleteFromCloudinary(publicId);
    }
    if (existingUser.khatauni_image) {
      const publicId = extractPublicId(existingUser.khatauni_image);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    // --- Upload new images ---
    const userImageUrl = userImage
      ? await uploadOnCloudinary(userImage[0].path)
      : null;
    const aadhaarImageUrl = aadhaarImg
      ? await uploadOnCloudinary(aadhaarImg[0].path)
      : null;
    const panImageUrl = panImg
      ? await uploadOnCloudinary(panImg[0].path)
      : null;
    const khatauniImageUrl = khatauniImg
      ? await uploadOnCloudinary(khatauniImg[0].path)
      : null;

    // --- Update user in MongoDB ---
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        aadhaar_number,
        pan_number,
        khatauni_id,
        user_image: userImageUrl?.secure_url || existingUser.user_image,
        aadhaar_image:
          aadhaarImageUrl?.secure_url || existingUser.aadhaar_image,
        pan_image: panImageUrl?.secure_url || existingUser.pan_image,
        khatauni_image:
          khatauniImageUrl?.secure_url || existingUser.khatauni_image,
        land_size,
        step_completed: 3,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Step 3 saved",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Step 3 Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Step 4: Bank Details
const registerStep4 = async (req, res) => {
  try {
    const {
      account_number,
      ifsc_code,
      account_holder,
      bank_name,
      branch_name,
    } = req.body;

    const userId = req.user.userId; // from authMiddleware

    const { bank_passbook_img } = req.files;

    // Get existing user
    const existingUser = await User.findById(userId).select(
      "bank_passbook_img"
    );

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Delete old image if present ---
    if (existingUser.bank_passbook_img) {
      const publicId = extractPublicId(existingUser.bank_passbook_img);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    // --- Upload new image ---
    const bankPassbookImageUrl = bank_passbook_img
      ? await uploadOnCloudinary(bank_passbook_img[0].path)
      : null;

    // --- Update user in MongoDB ---
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        account_number,
        ifsc_code,
        account_holder,
        bank_name,
        branch_name,
        bank_passbook_img:
          bankPassbookImageUrl?.secure_url || existingUser.bank_passbook_img,
        step_completed: 4,
      },
      { new: true } // return updated document
    );

    return res.status(200).json({
      message: "Step 4 saved",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Step 4 Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Step 5: Nominee
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
    } = req.body;

    const userId = req.user.userId;

    const { nominee_image, nominee_aadhaar_image, nominee_pan_image } =
      req.files;

    const existingUser = await User.findById(userId).select(
      "nominee_image nominee_aadhaar_image nominee_pan_image"
    );

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existingUser.nominee_image) {
      const publicId = extractPublicId(existingUser.nominee_image);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    if (existingUser.nominee_aadhaar_image) {
      const publicId = extractPublicId(existingUser.nominee_aadhaar_image);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    if (existingUser.nominee_pan_image) {
      const publicId = extractPublicId(existingUser.nominee_pan_image);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    const nomineeImageUrl = nominee_image
      ? await uploadOnCloudinary(nominee_image[0].path)
      : null;
    const nomineeAadhaarImageUrl = nominee_aadhaar_image
      ? await uploadOnCloudinary(nominee_aadhaar_image[0].path)
      : null;
    const nomineePanImageUrl = nominee_pan_image
      ? await uploadOnCloudinary(nominee_pan_image[0].path)
      : null;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
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
        nominee_aadhaar_image:
          nomineeAadhaarImageUrl?.secure_url ||
          existingUser.nominee_aadhaar_image,
        nominee_image:
          nomineeImageUrl?.secure_url || existingUser.nominee_image,
        nominee_pan_image:
          nomineePanImageUrl?.secure_url || existingUser.nominee_pan_image,
        step_completed: 5,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Registration Completed 🎉",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Step 5 Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// step 6: set PIN
const registerStep6 = async (req, res) => {
  try {
    const { account_pin } = req.body;
    const userId = req.user.userId;

    const encryptPIN = await encryptPassword(account_pin);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        account_pin: encryptPIN,
        step_completed: 6,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Step 6 saved",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Step 6 Error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
