"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gemini_controller_1 = require("../controller/gemini.controller");
const verifytoken_middleware_1 = __importDefault(require("../middleware/verifytoken.middleware"));
const checkdoctor_middleware_1 = __importDefault(require("../middleware/checkdoctor.middleware"));
const router = express_1.default.Router();
// router.get("/ai-summary/:patientId", verifyToken, checkDoctorRole,aiSummary);
router.post("/ai-chat/:patientId", verifytoken_middleware_1.default, checkdoctor_middleware_1.default, gemini_controller_1.askPatientQuestion);
router.get("/getAiChatHistory/:patientId", verifytoken_middleware_1.default, checkdoctor_middleware_1.default, gemini_controller_1.getAiChatHistory);
exports.default = router;
