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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = yield req.cookies.token;
        if (!token) {
            res.status(401).json({
                message: "Unauthorized - No Token Provided",
            });
            return;
        }
        if (!process.env.JWT_SECRET) {
            console.log("JWT_SECRET is not defined");
            res.status(400).json({
                message: "Authorisation error",
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            res.status(401).json({
                message: "Unauthorized - Token Is Invalid",
            });
            return;
        }
        const user = yield user_model_1.default.findById((_a = decoded === null || decoded === void 0 ? void 0 : decoded.user) === null || _a === void 0 ? void 0 : _a._id).select("-password");
        if (!user) {
            res.status(400).json({
                message: "User not found",
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.log("error in verifyToken middleware", error);
        res.status(500).json({
            message: "Invalid User",
        });
    }
});
exports.default = verifyToken;
