import express from "express";
import {  askPatientQuestion, getAiChatHistory } from "../controller/gemini.controller";
import verifyToken from "../middleware/verifytoken.middleware";
import checkDoctorRole from "../middleware/checkdoctor.middleware";

const router = express.Router();

// router.get("/ai-summary/:patientId", verifyToken, checkDoctorRole,aiSummary);
router.post("/ai-chat/:patientId", verifyToken, checkDoctorRole,askPatientQuestion);
router.get("/getAiChatHistory/:patientId", verifyToken, checkDoctorRole, getAiChatHistory);

export default router;
