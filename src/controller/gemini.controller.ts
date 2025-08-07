import UserModel from "../models/user.model";
import patientLabResult from "../models/labresults.model";
import PatientDetail from "../models/patientdetails.model";
import PatientReview from "../models/patientreview.model";
import PatientList from "../models/patientlist.model";
import AllergiesAndGeneralHealthInfo from "../models/allergiesandhealthinfo.model";
import { generateAIResponse } from "../lib/AiSummary";
import AiChatHistory from "../models/AiChatHistory.model";
import { Request, Response } from "express";

// Route to generate AI summary when doctor opens AI chat for a patient
export const aiSummary = async (req: Request, res: Response): Promise<void> => {
  const { patientId } = req.params;

  try {
    // Fetch patient data from MongoDB
    const userInfo = await UserModel.findById(patientId)
      .select("-password")
      .lean();
    if (!userInfo) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const patientDetails = await PatientDetail.find({ patient: patientId })
      .populate("doctor", "name email")
      .lean();

    const allergiesAndHealthInfo = await AllergiesAndGeneralHealthInfo.find({
      patient: patientId,
    }).lean();

    const labResults = await patientLabResult
      .find({ patient: patientId })
      .populate("addedBy", "name email")
      .lean();

    const patientReviews = await PatientReview.find({ patient: patientId })
      .populate("patientDetail", "Disease symptom medicationPrescribed")
      .lean();

    const doctorList = await PatientList.find({ patient: patientId })
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

    // Generate AI summary
    const summaryQuery =
      "Provide a concise medical summary of the patient's history based on the provided data.";
    const aiResponse = await generateAIResponse(patientData, summaryQuery);
    if (
      !aiResponse ||
      typeof aiResponse !== "string" ||
      aiResponse.trim() === ""
    ) {
      res.status(500).json({ error: "AI response is empty or invalid" });
      return;
    }
    // Store the summary in AiChatHistory as a model message
    let chatHistory = await AiChatHistory.findOne({ patientId });
    if (!chatHistory) {
      chatHistory = new AiChatHistory({ patientId, history: [] });
    }
    (chatHistory.history as any).push({
      role: "model",
      parts: [{ text: aiResponse }],
    });
    await chatHistory.save();

    res.status(200).json({
      message: "AI summary generated successfully",
      summary: aiResponse,
    });
  } catch (error) {
    console.error("Error in aiSummary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// API for doctor to ask questions
export const askPatientQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { patientId } = req.params;
  const { query } = req.body;

  try {
    // Fetch patient data from MongoDB (same as aiSummary)
    const userInfo = await UserModel.findById(patientId)
      .select("-password")
      .lean();
    if (!userInfo) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const patientDetails = await PatientDetail.find({ patient: patientId })
      .populate("doctor", "name email")
      .lean();

    const allergiesAndHealthInfo = await AllergiesAndGeneralHealthInfo.find({
      patient: patientId,
    }).lean();

    const labResults = await patientLabResult
      .find({ patient: patientId })
      .populate("addedBy", "name email")
      .lean();

    const patientReviews = await PatientReview.find({ patient: patientId })
      .populate("patientDetail", "Disease symptom medicationPrescribed")
      .lean();

    const doctorList = await PatientList.find({ patient: patientId })
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
    let chatHistory = await AiChatHistory.findOne({ patientId });
    if (!chatHistory) {
      chatHistory = new AiChatHistory({ patientId, history: [] });
    }
    (chatHistory.history as any).push({
      role: "user",
      parts: [{ text: query }],
    });
    await chatHistory.save();

    // Generate AI response
    const aiResponse = await generateAIResponse(patientData, query);
    if (
      !aiResponse ||
      typeof aiResponse !== "string" ||
      aiResponse.trim() === ""
    ) {
      res.status(500).json({ error: "AI response is empty or invalid" });
      return;
    }
    // Store the AI response in AiChatHistory
    (chatHistory.history as any).push({
      role: "model",
      parts: [{ text: aiResponse }],
    });
    await chatHistory.save();

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error("Error in askPatientQuestion:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
