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
exports.checkAuth = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const utils_1 = require("../lib/utils");
const user_model_1 = __importDefault(require("../models/user.model"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { name, email, password, role } = req.body;
    if (!email || !name || !password || !role) {
        res.status(400).json({
            message: "Please provide all the required fields",
        });
        return;
    }
    if (!["doctor", "patient"].includes(role)) {
        res.status(400).json({
            message: "Role must be either doctor or patient",
        });
        return;
    }
    try {
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                message: "User with this email already exists",
            });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const newUser = new user_model_1.default({
            name,
            email,
            password: hashedPassword,
            role,
        }) || null;
        if (newUser) {
            yield newUser.save();
            const newUserObj = newUser.toObject();
            delete newUserObj.password;
            const tokenPayload = {
                _id: newUserObj._id,
                role: newUserObj.role,
            };
            (0, utils_1.generateToken)(tokenPayload, res);
            res.json({
                user: newUserObj,
                message: "Registration sucessfull",
            });
            return;
        }
        else {
            res.status(400).json({
                message: "Invalid credentials",
            });
            return;
        }
    }
    catch (error) {
        console.log("error in register controller in auth controller", error.message);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || typeof req.body !== "object") {
        res.status(400).json({
            message: "Invalid request body",
        });
        return;
    }
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({
            message: "Invalid credentials",
        });
        return;
    }
    try {
        const user = (yield user_model_1.default.findOne({ email }));
        if (!user) {
            res.status(404).json({
                message: "User with this email not found",
            });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({
                message: "Invalid credentials",
            });
            return;
        }
        const UserObj = user.toObject();
        delete UserObj.password;
        const tokenPayload = {
            _id: UserObj._id,
            role: UserObj.role,
        };
        (0, utils_1.generateToken)(tokenPayload, res);
        res.status(200).json({
            message: "Logged in sucessfully",
            user: UserObj,
        });
    }
    catch (error) {
        console.log("error in login controller in auth controller", error.message);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.cookie("token", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: "none",
            secure: true
        });
        res.status(200).json({
            message: "Logged out sucessfully"
        });
    }
    catch (error) {
        console.log("Error in logout controller");
        res.status(500).json({
            message: "Internal server error"
        });
        return;
    }
});
exports.logout = logout;
const checkAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    try {
        res.status(200).json(user);
    }
    catch (error) {
        console.log("Error In auth controller at check auth", error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
});
exports.checkAuth = checkAuth;
