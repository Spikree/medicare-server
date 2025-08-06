import { GoogleGenerativeAI } from "@google/generative-ai";

// A single, reusable instance of the Generative AI client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Function to generate AI response using Gemini API
export async function generateAIResponse(patientData: any, query: string): Promise<string> {
  try {
    // Prepare the prompt with patient data and query
    const prompt = `
      Patient Data: ${JSON.stringify(patientData.allPatientInfo, null, 2)}
      
      Query: ${query}
      
      Provide a concise and accurate response based on the patient data provided. If the query is a question, answer it directly. If it's a request for a summary, generate a brief medical summary. Ensure the response is professional, suitable for a medical context, and adheres to privacy and ethical standards.
    `;

    // The generateContent call returns a promise, so we await it.
    const result = await model.generateContent({
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

  } catch (error) {
    console.error("Error generating AI response:", error);
    // It's good practice to re-throw the error or throw a new, more specific one.
    throw new Error("Failed to generate AI response from Gemini API");
  }
}