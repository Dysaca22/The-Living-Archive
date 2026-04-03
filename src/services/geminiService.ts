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

    try {
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
    } catch (error) {
      console.error("Failed to parse or validate astral data:", error);
      if (error instanceof SyntaxError) {
        throw new Error("The cinematic flow was corrupted by malformed data. Re-initializing...");
      }
      throw error;
    }
  }
}
