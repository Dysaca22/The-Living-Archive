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
    return 'Inventario local: vacio.';
  }
  return `Inventario local (evitar repetir en modo general): ${existingTitles.join(', ')}`;
}

const GENERAL_PROMPT: PromptDefinition = {
  systemInstruction: `
Eres un curador de cine y series para un producto local-first.
Objetivo: generar descubrimiento general de alta relevancia con salida JSON estricta.

Reglas:
1. Prioriza titulos reales y conocidos; evita inventar contenido.
2. Usa movie o tv segun corresponda.
3. Incluye narrativa breve y util, no texto poetico.
4. En este flujo, evita recomendar titulos ya guardados en inventario local.
5. Devuelve entre 1 y N resultados segun el limite solicitado por el cliente.
`.trim(),
  formatUserPrompt: ({ userPrompt, historicalContext, existingTitles, count }) => `
--- CONTEXTO DEL DIA ---
${historicalContext}

--- INVENTARIO LOCAL ---
${formatInventory(existingTitles)}

--- SOLICITUD ---
${userPrompt}

--- INSTRUCCION ---
Devuelve maximo ${count} recomendaciones de descubrimiento general (no exactamente una cantidad fija).
`.trim(),
};

const QUOTE_SCENE_PROMPT: PromptDefinition = {
  systemInstruction: `
Eres un motor de matching de frases y escenas famosas para cine y series.
Objetivo: mapear una frase memorable, una escena conocida o una descripcion parcial a titulos plausibles con confianza.

Reglas:
1. Si la entrada parece cita exacta, usa match_mode=quote_exact.
2. Si la entrada es descripcion de escena sin cita literal, usa match_mode=scene_description.
3. Si solo hay semejanza conceptual, usa match_mode=theme_similarity y baja la confianza.
4. confidence_score debe estar en rango 0..1.
5. Si hay ambiguedad real, llena ambiguity_note explicando la confusion.
6. Devuelve entre 1 y N resultados segun el limite solicitado por el cliente.
`.trim(),
  formatUserPrompt: ({ userPrompt, historicalContext, count }) => `
--- ENTRADA DEL USUARIO ---
${userPrompt}

--- CONTEXTO AUXILIAR DEL DIA ---
${historicalContext}

--- INSTRUCCION ---
Devuelve maximo ${count} coincidencias para frases/escenas.
Incluye por cada item: match_explanation, match_mode, confidence_score, ambiguity_note opcional y matched_quote opcional.
Si no es cita textual exacta, dejalo claro en match_mode y en match_explanation.
`.trim(),
};

const PROMPTS: Record<SearchFlowMode, PromptDefinition> = {
  general: GENERAL_PROMPT,
  quote_scene: QUOTE_SCENE_PROMPT,
};

export function getSearchPromptDefinition(mode: SearchFlowMode): PromptDefinition {
  return PROMPTS[mode];
}
