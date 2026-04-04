import { z } from 'zod';

/**
 * General discovery schema for Gemini structured outputs.
 */
export const movieRecommendationSchema = z.array(
  z.object({
    title: z.string()
      .describe("The official original title of the film."),
    
    narrative_justification: z.string()
      .describe("A detailed explanation (max 3 lines) of why this film fits the user's prompt and current historical context."),
    
    release_year: z.number()
      .describe("The year the film was released in theaters."),

    media_type: z.enum(['movie', 'tv']).optional()
      .describe("The media type. Defaults to movie if omitted."),
    
    tmdb_database_id: z.number().optional()
      .describe("The official TMDB (The Movie Database) ID for later poster resolution."),
    
    soundtrack_highlight: z.string().optional()
      .describe("An iconic song or theme from the film's original soundtrack.")
  })
).describe("A curated collection of cinematic recommendations based on the user's request.");

function normalizeConfidence(raw: unknown): number {
  if (typeof raw === 'number') {
    if (raw >= 0 && raw <= 1) return raw;
    if (raw > 1 && raw <= 100) return Math.round((raw / 100) * 100) / 100;
    return 0;
  }

  if (typeof raw === 'string') {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) {
      return normalizeConfidence(parsed);
    }
  }

  return 0;
}

/**
 * Dedicated schema for phrase/scene search.
 */
export const quoteSceneRecommendationSchema = z.array(
  z.object({
    title: z.string().describe('Official title for the matched movie or TV show.'),
    release_year: z.number().describe('Release year (movie) or first air year (tv).'),
    media_type: z.enum(['movie', 'tv']).optional(),
    tmdb_database_id: z.number().optional(),
    soundtrack_highlight: z.string().optional(),
    match_explanation: z.string().describe('Short explanation of why this title matches the user phrase/scene.'),
    match_mode: z.enum(['quote_exact', 'scene_description', 'theme_similarity'])
      .describe('How the match was inferred from user input.'),
    confidence_score: z.preprocess(normalizeConfidence, z.number().min(0).max(1))
      .describe('Confidence score between 0 and 1.'),
    ambiguity_note: z.string().optional()
      .describe('Optional note when there are possible alternative interpretations.'),
    matched_quote: z.string().optional()
      .describe('Exact quote fragment if the match is based on an exact memorable quote.'),
  })
).describe('Matches for phrase-or-scene search with confidence and ambiguity metadata.');

/**
 * Derived TypeScript types from the Zod schema.
 */
export type MovieRecommendation = z.infer<typeof movieRecommendationSchema>;
export type Movie = MovieRecommendation[number];
export type QuoteSceneRecommendation = z.infer<typeof quoteSceneRecommendationSchema>;
export type QuoteSceneMatch = QuoteSceneRecommendation[number];
