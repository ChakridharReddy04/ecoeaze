// src/utils/fileUpload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload folder: /public/uploads
const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");

// Storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${baseName}-${timestamp}${ext}`);
  },
});

// Basic image filter
const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"), false);
  }
  cb(null, true);
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Convenience middlewares
// Single image field: "image"
export const uploadSingleImage = upload.single("image");

// Multiple images: up to 5 files in "images"
export const uploadMultipleImages = upload.array("images", 5);

export default {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
};
