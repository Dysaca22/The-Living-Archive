import { GoogleGenAI, Type } from "@google/genai";
import { movieRecommendationSchema, MovieRecommendation } from "../schemas/movieSchema";
import { AI_CONFIG } from "../constants/aiConfig";
import { DISCOVERY_PROMPT } from "../prompts/discoveryPrompt";

/**
 * Gemini Service for The Living Archive.
 * Handles structured content generation for movie recommendations.
 */
export class GeminiService {
  /**
   * Generates cinematic recommendations based on user prompt and historical context.
   * Uses Structured Outputs to ensure data integrity.
   */
  public static async generateRecommendations(
    apiKey: string,
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[]
  ): Promise<MovieRecommendation> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: AI_CONFIG.MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: DISCOVERY_PROMPT.formatUserPrompt(userPrompt, historicalContext, existingTitles)
              }
            ]
          }
        ],
        config: {
          systemInstruction: DISCOVERY_PROMPT.SYSTEM_INSTRUCTION,
          temperature: AI_CONFIG.TEMPERATURE,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The official original title of the film." },
                narrative_justification: { type: Type.STRING, description: "A detailed explanation of why this film fits the prompt and context." },
                release_year: { type: Type.NUMBER, description: "The year the film was released." },
                tmdb_database_id: { type: Type.NUMBER, description: "The official TMDB ID." },
                soundtrack_highlight: { type: Type.STRING, description: "An iconic song from the film." }
              },
              required: ["title", "narrative_justification", "release_year"]
            }
          }
        }
      });

      const text = response.text;
      if (!text || text.trim() === "") {
        throw new Error("The Astral Curator returned an empty resonance. The cinematic flow is currently dry.");
      }

      const data = JSON.parse(text);
      
      // 1. Strict Schema Validation
      const validatedData = movieRecommendationSchema.parse(data);

      // 2. Quantity Check
      if (validatedData.length === 0) {
        throw new Error("No cinematic resonances were found for this query.");
      }

      // 3. Deduplication (Self-check)
      const uniqueTitles = new Set<string>();
      const deduplicated = validatedData.filter(movie => {
        const titleKey = movie.title.toLowerCase();
        if (uniqueTitles.has(titleKey)) return false;
        uniqueTitles.add(titleKey);
        return true;
      });

      return deduplicated;
    } catch (error: any) {
      console.error("Gemini Astral Flow Error:", error);

      // Handle specific API errors
      if (error.status === 404 || error.message?.includes("404")) {
        throw new Error(`The astral model "${AI_CONFIG.MODEL_NAME}" was not found or is deprecated. Please contact the architect.`);
      }
      if (error.status === 401 || error.status === 403 || error.message?.includes("401") || error.message?.includes("403")) {
        throw new Error("Your Astral Key (API Key) is invalid or lacks permissions. Please check your configuration.");
      }
      if (error.status === 429 || error.message?.includes("429")) {
        throw new Error("The astral flow is congested (Rate Limit). Please wait a moment before seeking more resonances.");
      }
      if (error instanceof SyntaxError) {
        throw new Error("The cinematic flow was corrupted by malformed data. Re-initializing...");
      }
      if (error.name === "AbortError" || error.message?.includes("fetch")) {
        throw new Error("The astral connection was severed. Please check your network resonance.");
      }

      const message = error instanceof Error ? error.message : "An unknown error occurred in the astral flow.";
      throw new Error(message);
    }
  }
}
