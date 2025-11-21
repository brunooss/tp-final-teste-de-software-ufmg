'use server';

import { z } from 'zod';
import { getWeightedDecisionSuggestions, type WeightedDecisionSuggestionsInput } from '@/ai/flows/weighted-decision-advice';
import type { WeightedAnalysisDecision } from '../types';

// --- Schemas ---
const criterionSchema = z.object({
  name: z.string(),
  weight: z.coerce.number(),
});

const optionSchema = z.object({
  name: z.string(),
  scores: z.record(z.string(), z.coerce.number()),
});

const weightedAnalysisSchema = z.object({
  context: z.string().optional(),
  existingCriteria: z.array(criterionSchema).optional(),
  existingOptions: z.array(optionSchema).optional(),
});

const saveWeightedAnalysisDecisionSchema = z.object({
    context: z.string().optional(),
    criteria: z.array(z.object({ name: z.string(), weight: z.number() })),
    options: z.array(z.object({ name: z.string(), scores: z.record(z.string(), z.number()) })),
    decision: z.string().min(1),
});

/**
 * Validates input, calls the AI flow, and returns criteria suggestions for a Weighted Analysis decision.
 * @param data - The raw input data, usually from a form.
 * @returns An object with either the AI suggestions or an error message.
 */
export async function handleWeightedSuggestions(data: unknown) {
  const validation = weightedAnalysisSchema.safeParse(data);
  if (!validation.success) {
    return { error: 'Os dados fornecidos para sugestão são inválidos.' };
  }
  try {
    const result = await getWeightedDecisionSuggestions(validation.data as WeightedDecisionSuggestionsInput);
    return { suggestions: result.suggestions };
  } catch (e) {
    console.error(e);
    return { error: 'Falha ao obter sugestões da IA. Por favor, tente novamente.' };
  }
}

/**
 * Validates the data for a Weighted Analysis decision and formats it for saving.
 * @param data - The raw input data containing context, criteria, options, and the final decision.
 * @returns An object with either the structured decision data or an error message.
 */
export async function handleSaveWeightedAnalysisDecision(data: unknown) {
    const validation = saveWeightedAnalysisDecisionSchema.safeParse(data);
    if (!validation.success) {
        console.error(validation.error.flatten());
        return { error: 'Dados inválidos para salvar a decisão.' };
    }
    const decisionData: Omit<WeightedAnalysisDecision, 'id' | 'date'> = {
        type: 'Weighted Analysis',
        context: validation.data.context || 'Análise Ponderada',
        criteria: validation.data.criteria,
        options: validation.data.options,
        decision: validation.data.decision,
    };
    return { decision: decisionData };
}
