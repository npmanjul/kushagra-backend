import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {string} localFilePath - Path of the local file to upload
 * @returns {object|null} - Cloudinary response object or null if failed
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Remove the local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response; // contains secure_url, public_id, etc.
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // Remove local file even if upload failed
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {object|null} - Cloudinary deletion response or null if failed
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    const result = await cloudinary.uploader.destroy(publicId);

    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return null;
  }
};

/**
 * Extract the public_id from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - public_id or null if not found
 */
const extractPublicId = (url) => {
  if (!url) return null;

  const regex = /\/image\/upload\/(?:v[0-9]+\/)?([^\/.]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicId };
