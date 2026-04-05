export type SearchFlowMode = 'general' | 'quote_scene';

interface PromptContextInput {
  userPrompt: string;
  historicalContext: string;
  existingTitles: string[];
  count: number;
}

interface PromptDefinition {
  systemInstruction: string;
  formatUserPrompt: (input: PromptContextInput) => string;
}

function formatInventory(existingTitles: string[]): string {
  if (existingTitles.length === 0) {
    return 'Inventario local: vacío.';
  }
  return `Inventario local (evitar repetir en modo general): ${existingTitles.join(', ')}`;
}

const GENERAL_PROMPT: PromptDefinition = {
  systemInstruction: `
Eres un curador de cine y series para un producto local-first.
Objetivo: generar descubrimiento general de alta relevancia con salida JSON estricta.

Reglas:
1. Prioriza títulos reales y conocidos; evita inventar contenido.
2. Usa movie o tv según corresponda.
3. Incluye narrativa breve y útil, no texto poético.
4. En este flujo, evita recomendar títulos ya guardados en inventario local.
5. Devuelve entre 1 y N resultados según el límite solicitado por el cliente.
`.trim(),
  formatUserPrompt: ({ userPrompt, historicalContext, existingTitles, count }) => `
--- CONTEXTO DEL DÍA ---
${historicalContext}

--- INVENTARIO LOCAL ---
${formatInventory(existingTitles)}

--- SOLICITUD ---
${userPrompt}

--- INSTRUCCION ---
Devuelve máximo ${count} recomendaciones de descubrimiento general (no exactamente una cantidad fija).
`.trim(),
};

const QUOTE_SCENE_PROMPT: PromptDefinition = {
  systemInstruction: `
Eres un motor de matching de frases y escenas famosas para cine y series.
Objetivo: mapear una frase memorable, una escena conocida o una descripción parcial a títulos plausibles con confianza.

Reglas:
1. Si la entrada parece cita exacta, usa match_mode=quote_exact.
2. Si la entrada es descripción de escena sin cita literal, usa match_mode=scene_description.
3. Si solo hay semejanza conceptual, usa match_mode=theme_similarity y baja la confianza.
4. confidence_score debe estar en rango 0..1.
5. Si hay ambigüedad real, llena ambiguity_note explicando la confusión.
6. Devuelve entre 1 y N resultados según el límite solicitado por el cliente.
`.trim(),
  formatUserPrompt: ({ userPrompt, historicalContext, count }) => `
--- ENTRADA DEL USUARIO ---
${userPrompt}

--- CONTEXTO AUXILIAR DEL DÍA ---
${historicalContext}

--- INSTRUCCION ---
Devuelve máximo ${count} coincidencias para frases/escenas.
Incluye por cada item: match_explanation, match_mode, confidence_score, ambiguity_note opcional y matched_quote opcional.
Si no es cita textual exacta, déjalo claro en match_mode y en match_explanation.
`.trim(),
};

const PROMPTS: Record<SearchFlowMode, PromptDefinition> = {
  general: GENERAL_PROMPT,
  quote_scene: QUOTE_SCENE_PROMPT,
};

export function getSearchPromptDefinition(mode: SearchFlowMode): PromptDefinition {
  return PROMPTS[mode];
}
