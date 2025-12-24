import multer from "multer";
import path from "path";

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("/tmp"));
  },
  filename: function (req, file, cb) {
    // FIX: Remove [] from fieldname to avoid ENOENT
    const safeFieldname = file.fieldname.replace(/\[\]/g, "");
    cb(
      null,
      safeFieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// File filter to allow image types and PDFs
function fileFilter(req, file, cb) {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const upload = multer({ storage, fileFilter });

export const uploadMultiple = multer({
  storage,
  fileFilter,
}).fields([
  { name: "userImage", maxCount: 1 },
  { name: "aadhaarImg", maxCount: 1 },
  { name: "panImg", maxCount: 1 },
  { name: "khatauni_images[]", maxCount: 20 },
]);

export default upload;