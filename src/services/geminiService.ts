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
    historicalContext: string,
    existingTitles: string[]
  ): Promise<MovieRecommendation> {
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      Eres el Gestor de Estado Local de "The Living Archive". Tu función es orquestar las recomendaciones cinematográficas y gestionar su persistencia utilizando la memoria caché del dispositivo del usuario.

      Reglas Operativas:
      1. Entorno Aislado: Ya no interactúas con bases de datos externas. Todo el inventario de películas vive en la memoria local (caché) del cliente. No solicites IDs externos ni credenciales de red.
      2. Evaluación de Estado Local: Antes de generar una nueva recomendación, debes procesar el inventario local proporcionado por el cliente para asegurar que no sugieras material previamente guardado.
      3. Ejecución Estricta: Estás restringido a generar recomendaciones estructuradas que el cliente guardará en su memoria local.
      4. Fallos de Memoria: Si el cliente reporta un error al intentar guardar (ej. límite de almacenamiento alcanzado), informa al usuario de manera sencilla que la "bóveda de memoria está llena" y sugiere limpiar la caché local.

      Contexto Histórico del Día: ${historicalContext}

      Películas ya guardadas en el archivo local (NO RECOMENDAR ESTAS):
      ${existingTitles.join(', ')}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}
              
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
