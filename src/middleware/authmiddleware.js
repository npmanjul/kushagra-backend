import { verifyToken } from "../utils/jwt.js";

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // extract token

    // Decode token (without verifying signature)
    const decoded =  verifyToken(token);

    if (!decoded ) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Attach userId to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ success: false, message: "Error decoding token" });
  }
};

export default authMiddleware;