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
exports.getAiChatHistory = exports.askPatientQuestion = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const labresults_model_1 = __importDefault(require("../models/labresults.model"));
const patientdetails_model_1 = __importDefault(require("../models/patientdetails.model"));
const patientreview_model_1 = __importDefault(require("../models/patientreview.model"));
const patientlist_model_1 = __importDefault(require("../models/patientlist.model"));
const allergiesandhealthinfo_model_1 = __importDefault(require("../models/allergiesandhealthinfo.model"));
const AiSummary_1 = require("../lib/AiSummary");
const AiChatHistory_model_1 = __importDefault(require("../models/AiChatHistory.model"));
// // Route to generate AI summary when doctor opens AI chat for a patient
// export const aiSummary = async (req: Request, res: Response): Promise<void> => {
//   const { patientId } = req.params;
//   try {
//     // Fetch patient data from MongoDB
//     const userInfo = await UserModel.findById(patientId)
//       .select("-password")
//       .lean();
//     if (!userInfo) {
//       res.status(404).json({ error: "Patient not found" });
//       return;
//     }
//     const patientDetails = await PatientDetail.find({ patient: patientId })
//       .populate("doctor", "name email")
//       .lean();
//     const allergiesAndHealthInfo = await AllergiesAndGeneralHealthInfo.find({
//       patient: patientId,
//     }).lean();
//     const labResults = await patientLabResult
//       .find({ patient: patientId })
//       .populate("addedBy", "name email")
//       .lean();
//     const patientReviews = await PatientReview.find({ patient: patientId })
//       .populate("patientDetail", "Disease symptom medicationPrescribed")
//       .lean();
//     const doctorList = await PatientList.find({ patient: patientId })
//       .populate("doctor", "name email bio")
//       .lean();
//     const allPatientInfo = {
//       userInfo,
//       patientDetails,
//       allergiesAndHealthInfo,
//       labResults,
//       patientReviews,
//       doctorList,
//       summary: {
//         totalMedicalRecords: patientDetails.length,
//         totalLabResults: labResults.length,
//         totalReviews: patientReviews.length,
//         totalDoctors: doctorList.length,
//       },
//     };
//     const patientData = {
//       message: "All patient information fetched successfully",
//       allPatientInfo,
//     };
//     // Generate AI summary
//     const summaryQuery =
//       "Provide a concise medical summary of the patient's history based on the provided data.";
//     const aiResponse = await generateAIResponse(patientData, summaryQuery);
//     if (
//       !aiResponse ||
//       typeof aiResponse !== "string" ||
//       aiResponse.trim() === ""
//     ) {
//       res.status(500).json({ error: "AI response is empty or invalid" });
//       return;
//     }
//     // Store the summary in AiChatHistory as a model message
//     let chatHistory = await AiChatHistory.findOne({ patientId });
//     if (!chatHistory) {
//       chatHistory = new AiChatHistory({ patientId, history: [] });
//     }
//     (chatHistory.history as any).push({
//       role: "model",
//       parts: [{ text: aiResponse }],
//     });
//     await chatHistory.save();
//     res.status(200).json({
//       message: "AI summary generated successfully",
//       summary: aiResponse,
//     });
//   } catch (error) {
//     console.error("Error in aiSummary:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
// API for doctor to ask questions
const askPatientQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId } = req.params;
    const { query } = req.body;
    try {
        // Fetch patient data from MongoDB (same as aiSummary)
        const userInfo = yield user_model_1.default.findById(patientId)
            .select("-password")
            .lean();
        if (!userInfo) {
            res.status(404).json({ error: "Patient not found" });
            return;
        }
        const patientDetails = yield patientdetails_model_1.default.find({ patient: patientId })
            .populate("doctor", "name email")
            .lean();
        const allergiesAndHealthInfo = yield allergiesandhealthinfo_model_1.default.find({
            patient: patientId,
        }).lean();
        const labResults = yield labresults_model_1.default
            .find({ patient: patientId })
            .populate("addedBy", "name email")
            .lean();
        const patientReviews = yield patientreview_model_1.default.find({ patient: patientId })
            .populate("patientDetail", "Disease symptom medicationPrescribed")
            .lean();
        const doctorList = yield patientlist_model_1.default.find({ patient: patientId })
            .populate("doctor", "name email bio")
            .lean();
        const allPatientInfo = {
            userInfo,
            patientDetails,
            allergiesAndHealthInfo,
            labResults,
            patientReviews,
            doctorList,
            summary: {
                totalMedicalRecords: patientDetails.length,
                totalLabResults: labResults.length,
                totalReviews: patientReviews.length,
                totalDoctors: doctorList.length,
            },
        };
        const patientData = {
            message: "All patient information fetched successfully",
            allPatientInfo,
        };
        // Check if query is provided
        if (!query || typeof query !== "string") {
            res
                .status(400)
                .json({ error: "Query is required and must be a string." });
            return;
        }
        // Store the user question in AiChatHistory
        let chatHistory = yield AiChatHistory_model_1.default.findOne({ patientId });
        if (!chatHistory) {
            chatHistory = new AiChatHistory_model_1.default({ patientId, history: [] });
        }
        chatHistory.history.push({
            role: "user",
            parts: [{ text: query }],
        });
        yield chatHistory.save();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todaysChat = yield AiChatHistory_model_1.default.find({
            patientId: patientId,
            createdAt: { $gte: todayStart, $lt: todayEnd },
        });
        // Generate AI response
        const aiResponse = yield (0, AiSummary_1.generateAIResponse)(patientData, todaysChat, query);
        if (!aiResponse ||
            typeof aiResponse !== "string" ||
            aiResponse.trim() === "") {
            res.status(500).json({ error: "AI response is empty or invalid" });
            return;
        }
        // Store the AI response in AiChatHistory
        chatHistory.history.push({
            role: "model",
            parts: [{ text: aiResponse }],
        });
        const newChatHistory = yield chatHistory.save();
        res.status(200).json({ newChatHistory });
    }
    catch (error) {
        console.error("Error in askPatientQuestion:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.askPatientQuestion = askPatientQuestion;
const getAiChatHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patientId } = req.params;
    if (!patientId) {
        res.status(400).json({
            message: "Patient id not provided",
        });
        return;
    }
    try {
        const aiChatHistory = yield AiChatHistory_model_1.default.findOne({
            patientId: patientId,
        });
        if (!aiChatHistory) {
            res.status(404).json({
                message: "No ai chat history",
            });
            return;
        }
        res.status(200).json({
            aiChatHistory,
            message: "fetched ai chats sucessfully",
        });
    }
    catch (error) {
        console.error("Error in getAiChatHistory:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getAiChatHistory = getAiChatHistory;
