import User from "../model/Users.model.js";
import { decryptPassword } from "../utils/bcrypt.js";
import { generateToken, verifyToken } from "../utils/jwt.js";

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
    const userId =isTokenValid.userId;

    const user=await User.findOne({_id:userId});

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    return res.status(200).json({ success: true, message: "Token is valid",role:user.role });
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
      return res.status(404).json({ success: false, message: "User not found" });
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
    const userId = req.user.userId;
    const user = await User.findById(userId).select("name phone_number email role user_image isVerified userId");
    return res.status(200).json({ profile: user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res
      .status(500)
      .json({  message: "Internal server error" });
  }
};


export { login, checkToken, getProfile,pinVerification };
