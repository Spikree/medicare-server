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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIResponse = generateAIResponse;
const generative_ai_1 = require("@google/generative-ai");
const geminiInstructions_1 = require("./geminiInstructions");
// A single, reusable instance of the Generative AI client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// Function to generate AI response using Gemini API
function generateAIResponse(patientData, todaysChat, query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Prepare the prompt with patient data and query
            const prompt = `
      Patient Data: ${JSON.stringify(patientData.allPatientInfo, null, 2)}
      
      Query: ${query}

      todays chat history : ${todaysChat}
      
      ${geminiInstructions_1.DOCTOR_APP_SYSTEM_INSTRUCTION}
    `;
            // The generateContent call returns a promise, so we await it.
            const result = yield model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                },
            });
            // The 'result' object is now available. Its 'response' property is a standard object.
            const response = result.response;
            // Call the text() method to get the generated text as a string.
            return response.text();
        }
        catch (error) {
            console.error("Error generating AI response:", error);
            // It's good practice to re-throw the error or throw a new, more specific one.
            throw new Error("Failed to generate AI response from Gemini API");
        }
    });
}
