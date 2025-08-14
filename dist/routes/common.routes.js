"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifytoken_middleware_1 = __importDefault(require("../middleware/verifytoken.middleware"));
const multer_middleware_1 = __importDefault(require("../middleware/multer.middleware"));
const common_controller_1 = require("../controller/common.controller");
const router = express_1.default.Router();
router.post("/updateProfile", verifytoken_middleware_1.default, multer_middleware_1.default.single("profilePicture"), common_controller_1.editProfile);
exports.default = router;
