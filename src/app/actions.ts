'use server';

import { z } from 'zod';
import { getYesNoDecisionAdvice } from '@/ai/flows/yes-no-decision-advice';
import { getMultipleChoiceDecisionAdvice } from '@/ai/flows/multiple-choice-decision-advice';
import { suggestFinancialWeights } from '@/ai/flows/financial-decision-weight-suggestion';

const yesNoSchema = z.object({
  context: z.string().min(10, 'Please provide more context for the decision.'),
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
    return { error: 'Failed to get advice from AI. Please try again.' };
  }
}

const multipleChoiceSchema = z.object({
  context: z.string().min(10, 'Please provide more context for the decision.'),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).min(2, 'Please provide at least two options.'),
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
    return { error: fieldErrors.context?.[0] || fieldErrors.options?.[0] || 'Invalid input.' };
  }
  try {
    const result = await getMultipleChoiceDecisionAdvice({ context: validation.data.context, options: validation.data.options });
    return { advice: result.advice };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get advice from AI. Please try again.' };
  }
}

const financialAnalysisSchema = z.object({
  context: z.string().min(10, 'Please provide more context for the financial decision.'),
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
    return { error: 'Failed to get suggestions from AI. Please try again.' };
  }
}
