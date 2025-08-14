"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editProfile = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("../lib/utils");
const cloudinary_1 = __importDefault(require("../lib/cloudinary"));
const editProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const currentUser = req.user;
    const { bio } = req.body;
    try {
        const user = yield user_model_1.default.findById(currentUser === null || currentUser === void 0 ? void 0 : currentUser._id);
        if (!user) {
            res.status(400).json({
                message: "No user found",
            });
            return;
        }
        let fileLink;
        if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
            if (user.profilePicture) {
                const publicId = (0, utils_1.getCloudinaryPublicId)(user.profilePicture);
                if (publicId) {
                    yield cloudinary_1.default.uploader.destroy(publicId);
                }
            }
            const cloudinaryResult = yield cloudinary_1.default.uploader.upload(req.file.path, {
                folder: "profile-picture",
            });
            fs_1.default.unlinkSync(req.file.path);
            fileLink = cloudinaryResult.secure_url;
        }
        if (bio)
            user.bio = bio;
        if (fileLink)
            user.profilePicture = fileLink;
        yield user.save();
        res.status(200).json({
            message: "User profile updated",
            user,
        });
    }
    catch (error) {
        console.log("error in common controller at edit user profile", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.editProfile = editProfile;
