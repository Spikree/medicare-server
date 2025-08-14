"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudinaryPublicId = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (user, res) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    const token = jsonwebtoken_1.default.sign({ user }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    res.cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
    });
    return token;
};
exports.generateToken = generateToken;
const getCloudinaryPublicId = (url) => {
    var _a;
    try {
        const parts = url.split('/');
        const fileName = (_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.split('.')[0];
        const folder = parts.slice(-1)[0];
        return folder && fileName ? `${folder}/${fileName}` : null;
    }
    catch (_b) {
        return null;
    }
};
exports.getCloudinaryPublicId = getCloudinaryPublicId;
