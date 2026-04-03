import { z } from 'zod';

/**
 * Movie recommendation schema for Gemini's Structured Outputs.
 * Architected with Zod for strict validation and semantic descriptions.
 */
export const movieRecommendationSchema = z.array(
  z.object({
    title: z.string()
      .describe("The official original title of the film."),
    
    narrative_justification: z.string()
      .describe("A detailed explanation (max 3 lines) of why this film fits the user's prompt and current historical context."),
    
    release_year: z.number()
      .describe("The year the film was released in theaters."),
    
    tmdb_database_id: z.number().optional()
      .describe("The official TMDB (The Movie Database) ID for later poster resolution."),
    
    soundtrack_highlight: z.string().optional()
      .describe("An iconic song or theme from the film's original soundtrack.")
  })
).describe("A curated collection of cinematic recommendations based on the user's request.");

/**
 * Derived TypeScript types from the Zod schema.
 */
export type MovieRecommendation = z.infer<typeof movieRecommendationSchema>;
export type Movie = MovieRecommendation[number];
