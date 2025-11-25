
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("API_KEY is not defined");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        const response = await ai.models.list();
        console.log("Full response:", JSON.stringify(response, null, 2));
        console.log("Available models:");
        for await (const model of response) {
            console.log(`- ${model.name}`);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
