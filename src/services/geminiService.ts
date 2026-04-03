import { GoogleGenAI, Type } from "@google/genai";
import { movieRecommendationSchema, MovieRecommendation } from "../schemas/movieSchema";

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
    historicalContext: string
  ): Promise<MovieRecommendation> {
    const ai = new GoogleGenAI({ apiKey });
    
    // Convert Zod schema to Gemini-compatible JSON Schema
    // Note: We use the simplified schema structure required by the SDK
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Using 1.5 Flash for speed and structured output support
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are 'The Astral Curator'. 
              Historical Context for today: ${historicalContext}
              User Request: ${userPrompt}
              
              Generate a curated list of exactly 3 movie recommendations that bridge the user's request with the historical context provided.`
            }
          ]
        }
      ],
      config: {
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
    if (!text) {
      throw new Error("The Astral Curator returned an empty resonance. Try again.");
    }

    try {
      const data = JSON.parse(text);
      // Validate with Zod to ensure runtime safety
      return movieRecommendationSchema.parse(data);
    } catch (error) {
      console.error("Failed to parse astral data:", error);
      throw new Error("The cinematic flow was corrupted. Re-initializing...");
    }
  }
}
