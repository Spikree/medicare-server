import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const uploadDir = "uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const disallowedExtensions = [".exe", ".sh", ".bat", ".cmd", ".msi", ".js"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (disallowedExtensions.includes(ext)) {
    return cb(null, false);
  }

  if (
    file.mimetype.startsWith("application/x-msdownload") ||
    file.mimetype === "application/x-sh"
  ) {
    return cb(null, false);
  }

  cb(null, true);
};

const limits = {
  fileSize: 50 * 1024 * 1024,
};

const upload = multer({ storage, fileFilter,limits });

export default upload;
