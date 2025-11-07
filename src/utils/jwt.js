import jwt from "jsonwebtoken";

const generateToken = async (userId) => {
  try {
    return jwt.sign(
      { userId: userId },
      process.env.JWT_TOKEN_SECRET,
      {
        expiresIn: process.env.JWT_TOKEN_EXPIRY,
      }
    );
  } catch (error) {
    console.log(error);
  }
};


const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_TOKEN_SECRET);
  } catch (error) {
    console.error("Invalid token:", error.message);
    return null; 
  }
};

export { generateToken, verifyToken };
