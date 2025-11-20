'use server';

import { z } from 'zod';
import { getYesNoDecisionAdvice } from '@/ai/flows/yes-no-decision-advice';
import { getMultipleChoiceDecisionAdvice } from '@/ai/flows/multiple-choice-decision-advice';
import { suggestFinancialWeights } from '@/ai/flows/financial-decision-weight-suggestion';

const yesNoSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
});

export async function getYesNoAdviceAction(prevState: any, formData: FormData) {
  const rawData = { context: formData.get('context') };
  const validation = yesNoSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors.context?.[0] };
  }
  try {
    const result = await getYesNoDecisionAdvice({ context: validation.data.context });
    return { advice: result.advice };
  } catch (e) {
    console.error(e);
    return { error: 'Falha ao obter conselho da IA. Por favor, tente novamente.' };
  }
}

const multipleChoiceSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
  options: z.array(z.string().min(1, 'A opção não pode estar vazia.')).min(2, 'Por favor, forneça pelo menos duas opções.'),
});

export async function getMultipleChoiceAdviceAction(prevState: any, formData: FormData) {
  const options = formData.getAll('options').map(String).filter(opt => opt.trim() !== '');
  const rawData = {
    context: formData.get('context'),
    options,
  };
  
  const validation = multipleChoiceSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return { error: fieldErrors.context?.[0] || fieldErrors.options?.[0] || 'Entrada inválida.' };
  }
  try {
    const result = await getMultipleChoiceDecisionAdvice({ context: validation.data.context, options: validation.data.options });
    return { advice: result.advice };
  } catch (e) {
    console.error(e);
    return { error: 'Falha ao obter conselho da IA. Por favor, tente novamente.' };
  }
}

const financialAnalysisSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão financeira.'),
});

export async function getFinancialWeightsAction(prevState: any, formData: FormData) {
  const rawData = { context: formData.get('context') };
  const validation = financialAnalysisSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors.context?.[0] };
  }
  try {
    const result = await suggestFinancialWeights({ context: validation.data.context });
    return { suggestions: result.suggestions };
  } catch (e) {
    console.error(e);
    return { error: 'Falha ao obter sugestões da IA. Por favor, tente novamente.' };
  }
}
