"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = "uploads/";
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (req, file, cb) => {
    const disallowedExtensions = [".exe", ".sh", ".bat", ".cmd", ".msi", ".js"];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (disallowedExtensions.includes(ext)) {
        return cb(null, false);
    }
    if (file.mimetype.startsWith("application/x-msdownload") ||
        file.mimetype === "application/x-sh") {
        return cb(null, false);
    }
    cb(null, true);
};
const limits = {
    fileSize: 50 * 1024 * 1024,
};
const upload = (0, multer_1.default)({ storage, fileFilter, limits });
exports.default = upload;
