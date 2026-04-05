import { GoogleGenAI, Type } from "@google/genai";
import {
  MovieRecommendation,
  QuoteSceneRecommendation,
  movieRecommendationSchema,
  quoteSceneRecommendationSchema,
} from "../schemas/movieSchema";
import { AI_CONFIG } from "../constants/aiConfig";
import { SearchFlowMode, getSearchPromptDefinition } from "../prompts/searchPromptLayer";

interface SearchGenerationOptions {
  count?: number;
}

interface GenerationRequest {
  apiKey: string;
  mode: SearchFlowMode;
  userPrompt: string;
  historicalContext: string;
  existingTitles: string[];
  count: number;
}

/**
 * Gemini Service for The Living Archive.
 * Provides structured generation for general discovery and quote/scene matching.
 */
export class GeminiService {
  public static async generateRecommendations(
    apiKey: string,
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options: SearchGenerationOptions = {}
  ): Promise<MovieRecommendation> {
    const count = options.count ?? AI_CONFIG.DEFAULT_GENERAL_COUNT;
    const result = await this.generateStructured({
      apiKey,
      mode: "general",
      userPrompt,
      historicalContext,
      existingTitles,
      count,
    });

    const parsed = movieRecommendationSchema.parse(result);
    return deduplicate(parsed);
  }

  public static async generateQuoteSceneMatches(
    apiKey: string,
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options: SearchGenerationOptions = {}
  ): Promise<QuoteSceneRecommendation> {
    const count = options.count ?? AI_CONFIG.DEFAULT_QUOTE_SCENE_COUNT;
    const result = await this.generateStructured({
      apiKey,
      mode: "quote_scene",
      userPrompt,
      historicalContext,
      existingTitles,
      count,
    });

    const parsed = quoteSceneRecommendationSchema.parse(result);
    return deduplicate(parsed);
  }

  private static async generateStructured(request: GenerationRequest): Promise<unknown> {
    try {
      const ai = new GoogleGenAI({ apiKey: request.apiKey });
      const promptDefinition = getSearchPromptDefinition(request.mode);

      const response = await ai.models.generateContent({
        model: AI_CONFIG.MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: promptDefinition.formatUserPrompt({
                  userPrompt: request.userPrompt,
                  historicalContext: request.historicalContext,
                  existingTitles: request.existingTitles,
                  count: request.count,
                }),
              },
            ],
          },
        ],
        config: {
          systemInstruction: promptDefinition.systemInstruction,
          temperature: AI_CONFIG.TEMPERATURE,
          responseMimeType: "application/json",
          responseSchema: getResponseSchema(request.mode),
        },
      });

      const text = response.text;
      if (!text || text.trim() === "") {
        throw new Error("Gemini devolvio una respuesta vacia.");
      }

      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanText);
    } catch (error: unknown) {
      console.error("Gemini flow error:", error);

      const candidate = error as { status?: number; message?: string; name?: string };
      const status = candidate.status;
      const messageText = candidate.message ?? '';

      if (status === 404 || messageText.includes("404")) {
        throw new Error(`El modelo "${AI_CONFIG.MODEL_NAME}" no esta disponible.`);
      }
      if (
        status === 401 ||
        status === 403 ||
        messageText.includes("401") ||
        messageText.includes("403")
      ) {
        throw new Error("La API key de Gemini no es valida o no tiene permisos.");
      }
      if (status === 429 || messageText.includes("429")) {
        throw new Error("Gemini esta saturado temporalmente. Intenta de nuevo.");
      }
      if (error instanceof SyntaxError) {
        throw new Error("Gemini devolvio JSON invalido para este flujo.");
      }
      if (candidate.name === "AbortError" || messageText.includes("fetch")) {
        throw new Error("No se pudo conectar con Gemini.");
      }

      const message = error instanceof Error ? error.message : "Error desconocido en Gemini.";
      throw new Error(message);
    }
  }
}

function getResponseSchema(mode: SearchFlowMode) {
  if (mode === "quote_scene") {
    return {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Official title." },
          release_year: { type: Type.NUMBER, description: "Release year." },
          media_type: { type: Type.STRING, description: "movie or tv." },
          tmdb_database_id: { type: Type.NUMBER, description: "TMDB id when known." },
          soundtrack_highlight: { type: Type.STRING, description: "Optional soundtrack highlight." },
          match_explanation: { type: Type.STRING, description: "Why this result matches the phrase/scene." },
          match_mode: {
            type: Type.STRING,
            description: "quote_exact | scene_description | theme_similarity",
          },
          confidence_score: { type: Type.NUMBER, description: "Confidence score from 0 to 1." },
          ambiguity_note: { type: Type.STRING, description: "Optional ambiguity explanation." },
          matched_quote: { type: Type.STRING, description: "Optional exact quote fragment." },
        },
        required: [
          "title",
          "release_year",
          "match_explanation",
          "match_mode",
          "confidence_score",
        ],
      },
    };
  }

  return {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The official original title of the film or show." },
        narrative_justification: { type: Type.STRING, description: "Why this recommendation matches the request." },
        release_year: { type: Type.NUMBER, description: "Release year." },
        media_type: { type: Type.STRING, description: "movie or tv." },
        tmdb_database_id: { type: Type.NUMBER, description: "TMDB id when known." },
        soundtrack_highlight: { type: Type.STRING, description: "Optional soundtrack highlight." },
      },
      required: ["title", "narrative_justification", "release_year"],
    },
  };
}

function deduplicate<T extends { title: string; release_year: number; media_type?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const item of items) {
    const key = `${item.title.toLowerCase().trim()}::${item.release_year}::${item.media_type ?? "movie"}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
  }

  return output;
}
