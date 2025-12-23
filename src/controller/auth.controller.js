import Farmer from "../model/Farmer.model.js";
import Employee from "../model/Employee.model.js";
import User from "../model/Users.model.js";
import OTP from "../model/Otp.model.js";
import { decryptPassword, encryptPassword } from "../utils/bcrypt.js";
import { generateToken, verifyToken } from "../utils/jwt.js";
import { sendEmailOTP } from "../utils/miscellaneous.js";

const login = async (req, res) => {
  const { email, password, phone_number } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValidPassword = await decryptPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = await generateToken(user._id);

    return res.status(200).json({
      message: "login successful",
      currentStep: user.step_completed,
      role: user.role,
      token: token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const checkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const isTokenValid = verifyToken(token);
    const userId = isTokenValid.userId;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Token is valid", role: user.role });
  } catch (error) {
    console.error("Token check error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const pinVerification = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isValidPin = await decryptPassword(pin, user.account_pin);

    if (!isValidPin) {
      return res.status(401).json({ success: false, message: "Invalid PIN" });
    }

    return res.status(200).json({ success: true, message: "PIN verified" });
  } catch (error) {
    console.error("PIN verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Fetch basic user details
    const user = await User.findById(userId).select(
      "name phone_number email role is_active farmerVerification.overallStatus"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profileExtra = null;

    // If user is a farmer, fetch from Farmer model
    if (user.role === "farmer") {
      profileExtra = await Farmer.findOne({ user: userId }).select(
        "user_image farmerId"
      );
    }

    // If user is admin, manager, or supervisor, fetch from Employee model
    if (["admin", "manager", "supervisor"].includes(user.role)) {
      const employeeData = await Employee.findOne({ user: userId }).select(
        "employeeImage employeeId"
      );
      if (employeeData) {
        profileExtra = {
          user_image: employeeData.employeeImage,
          employeeId: employeeData.employeeId
        };
      }
    }

    const profile = {
      ...user.toObject(),
      ...(profileExtra ? (profileExtra.toObject ? profileExtra.toObject() : profileExtra) : {}),
    };

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// send OTP
const sendOTP = async (req, res) => {
  try {
    const { email, phone_number } = req.body;

    const user = await User.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpSend = await sendEmailOTP(email);

    if (!otpSend) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email , phone, otp } = req.body;

    const otpRecord=await OTP.findOne(
      { $and: [{ email:email }, { phone_number:phone }] }
    );

    if (!otpRecord) {
      return res.status(404).json({ message: "OTP not found" });
    }

    if (otpRecord.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// reset password
const resetPassword = async (req, res) => {
  try {
    const { email, phone_number, newPassword } = req.body;

    const user = await User.findOne({
      $and: [{ email }, { phone_number }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await encryptPassword(newPassword);
    await user.save();

    return res
      .status(200)
      .json({ message: `Password reset for ${email} successfully` });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// reset pin
const resetPin = async (req, res) => {
  try {
    const { email, phone_number, newPin } = req.body;

    const user = await User.findOne({
      $and: [{ email }, { phone_number }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.account_pin = await encryptPassword(newPin);
    await user.save();

    return res.status(200).json({ message: "PIN updated successfully" });
  } catch (error) {
    console.error("Error resetting pin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getCompleteProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Fetch basic user details
    const user = await User.findById(userId).select(
      "name phone_number secondary_phone_number email gender dob role is_active registration_date step_completed farmerVerification"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let profileData = null;

    // If user is a farmer, fetch complete details from Farmer model
    if (user.role === "farmer") {
      profileData = await Farmer.findOne({ user: userId }).select(
        "farmerId user_image address tehsil district state landmark pin_code aadhaar_number pan_number aadhaar_image pan_image khatauni_images land_size account_number ifsc_code account_holder bank_name branch_name bank_passbook_img nominee_name nominee_dob nominee_phone nominee_email nominee_aadhaar nominee_pan nominee_relation nominee_gender nominee_address nominee_image nominee_aadhaar_image nominee_pan_image"
      );
    }

    // If user is admin, manager, supervisor, or staff, fetch complete details from Employee model
    if (["admin", "manager", "supervisor", "staff"].includes(user.role)) {
      profileData = await Employee.findOne({ user: userId })
        .select(
          "employeeId employeeImage maritalStatus nationality bloodGroup permanentAddress currentAddress sameAsPermanent employmentType dateOfJoining employmentStatus isActive salary account_number ifsc_code account_holder bank_name branch_name upiId panNumber aadhaarNumber passportNumber passportExpiry pfNumber esiNumber taxStatus education certifications experience totalExperienceYears skills medicalConditions emergencyContacts hrNotes backgroundCheckStatus onboardingCompleted"
        )
        .populate("reportingManager", "employeeId user")
        .populate({
          path: "reportingManager",
          populate: {
            path: "user",
            select: "name email phone_number role",
          },
        });
    }

    const profile = {
      ...user.toObject(),
      ...(profileData ? profileData.toObject() : {}),
    };

    return res.status(200).json({ 
      success: true, 
      message: "Profile fetched successfully",
      profile 
    });
  } catch (error) {
    console.error("Error fetching complete profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export {
  login,
  checkToken,
  pinVerification,
  getProfile,
  getCompleteProfile,
  sendOTP,
  verifyOTP,
  resetPassword,
  resetPin,
};
