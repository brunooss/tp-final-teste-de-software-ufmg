'use server';

import { z } from 'zod';
import { getYesNoDecisionAdvice, type YesNoDecisionAdviceInput } from '@/ai/flows/yes-no-decision-advice';
import { getMultipleChoiceDecisionAdvice, type MultipleChoiceDecisionAdviceInput } from '@/ai/flows/multiple-choice-decision-advice';
import { suggestFinancialWeights, type FinancialWeightInput } from '@/ai/flows/financial-decision-weight-suggestion';
import { getFinancialSpendingAdvice, type FinancialSpendingAdviceInput } from '@/ai/flows/financial-spending-advice';
import { calculateConsortiumMonthlyPayment, calculateConsortiumTotal, calculateFinancingMonthlyPayment, calculateFinancingTotal } from '@/lib/financial-calculations';
import type { YesNoDecision, MultipleChoiceDecision, FinancialSpendingDecision, FinancialAnalysisDecision, WeightedAnalysisDecision } from '@/lib/types';
import { getWeightedDecisionSuggestions, type WeightedDecisionSuggestionsInput } from '@/ai/flows/weighted-decision-advice';

// --- Schemas ---
const yesNoSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
});

const multipleChoiceOptionSchema = z.object({
  value: z.string().min(1, 'A opção não pode estar vazia.'),
  description: z.string().optional(),
});

const multipleChoiceSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
  options: z.array(multipleChoiceOptionSchema).min(2, 'Por favor, forneça pelo menos duas opções.'),
});

const financialAnalysisSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão financeira.'),
  fixedCost: z.coerce.number().min(0),
  variableCost: z.coerce.number().min(0),
});

const financialSpendingSchema = z.object({
  context: z.string().min(1, 'Por favor, forneça o contexto da decisão.'),
  financing: z.object({
    totalValue: z.number(),
    downPayment: z.number(),
    interestRate: z.number(),
    installments: z.number(),
  }),
  consortium: z.object({
    totalValue: z.number(),
    adminFee: z.number(),
    installments: z.number(),
  }),
});

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

// --- Tipos de Decisão para Salvar ---
const saveYesNoDecisionSchema = yesNoSchema.extend({
  decision: z.enum(['Sim', 'Não']),
});

const saveMultipleChoiceDecisionSchema = multipleChoiceSchema.extend({
  decision: z.string().min(1),
});

const saveFinancialSpendingDecisionSchema = z.object({
    context: z.string().min(1),
    options: z.array(z.string()),
    decision: z.string().min(1),
});

const saveWeightedAnalysisDecisionSchema = z.object({
    context: z.string().optional(),
    criteria: z.array(z.object({ name: z.string(), weight: z.number() })),
    options: z.array(z.object({ name: z.string(), scores: z.record(z.string(), z.number()) })),
    decision: z.string().min(1),
});


// --- Lógica Core Testável ---

// --- GET ADVICE ---
export async function handleYesNoAdvice(data: unknown) {
  const validation = yesNoSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors.context?.[0] };
  }
  try {
    const result = await getYesNoDecisionAdvice(validation.data as YesNoDecisionAdviceInput);
    return { advice: result.advice };
  } catch (e) {
    console.error(e);
    return { error: 'Falha ao obter conselho da IA. Por favor, tente novamente.' };
  }
}

export async function handleMultipleChoiceAdvice(data: unknown) {
    const validation = multipleChoiceSchema.safeParse(data);
  
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const contextError = fieldErrors.context?.[0];
      const optionsError = (fieldErrors.options as unknown as string[])?.[0];
      return { error: contextError || optionsError || 'Entrada inválida.' };
    }
  
    try {
      const result = await getMultipleChoiceDecisionAdvice(validation.data as MultipleChoiceDecisionAdviceInput);
      return { advice: result.advice };
    } catch (e) {
      console.error(e);
      return { error: 'Falha ao obter conselho da IA. Por favor, tente novamente.' };
    }
}

export async function handleFinancialWeights(data: unknown) {
  const validation = financialAnalysisSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.flatten().fieldErrors.context?.[0] };
  }
  try {
    const result = await suggestFinancialWeights({context: validation.data.context});
    return { suggestions: result.suggestions };
  } catch (e) {
    console.error(e);
    return { error: 'Falha ao obter sugestões da IA. Por favor, tente novamente.' };
  }
}

export async function handleFinancialSpendingAdvice(data: unknown) {
  const validation = financialSpendingSchema.safeParse(data);
  if (!validation.success) {
    console.error(validation.error.flatten());
    return { error: 'Dados inválidos. Por favor, verifique os campos.' };
  }
  try {
    const inputData = validation.data;
    
    // Perform calculations before calling AI
    const financingTotal = calculateFinancingTotal(inputData.financing);
    const financingMonthly = calculateFinancingMonthlyPayment(inputData.financing);
    const consortiumTotal = calculateConsortiumTotal(inputData.consortium);
    const consortiumMonthly = calculateConsortiumMonthlyPayment(inputData.consortium);

    const aiInput: FinancialSpendingAdviceInput = {
      ...inputData,
      financing: {
        ...inputData.financing,
        totalCost: financingTotal,
        monthlyPayment: financingMonthly,
      },
      consortium: {
        ...inputData.consortium,
        totalCost: consortiumTotal,
        monthlyPayment: consortiumMonthly,
      },
    };

    const result = await getFinancialSpendingAdvice(aiInput);
    return { advice: result.advice };
  } catch (e) {
    console.error(e);
    return { error: 'Falha ao obter conselho da IA. Por favor, tente novamente.' };
  }
}


export async function handleFinancialTotals(data: unknown) {
    const validation = financialSpendingSchema.safeParse(data);
    if (!validation.success) {
      return { error: 'Dados inválidos.' };
    }
    try {
      const financingTotal = calculateFinancingTotal(validation.data.financing);
      const consortiumTotal = calculateConsortiumTotal(validation.data.consortium);
      return { totals: { financingTotal, consortiumTotal } };
    } catch (e) {
      console.error(e);
      return { error: 'Falha ao calcular totais.' };
    }
}

export async function handleWeightedSuggestions(data: unknown) {
  const validation = weightedAnalysisSchema.safeParse(data);
  if (!validation.success) {
    console.log(validation.error.flatten());
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

// --- SAVE DECISION ---

export async function handleSaveYesNoDecision(data: unknown) {
    const validation = saveYesNoDecisionSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors.context?.[0] || 'Dados inválidos.' };
    }
    const decisionData: Omit<YesNoDecision, 'id' | 'date'> = {
        type: 'Yes/No',
        context: validation.data.context,
        decision: validation.data.decision,
    };
    return { decision: decisionData };
}

export async function handleSaveMultipleChoiceDecision(data: unknown) {
    const validation = saveMultipleChoiceDecisionSchema.safeParse(data);
    if (!validation.success) {
        return { error: 'Dados inválidos para salvar a decisão.' };
    }
     const decisionData: Omit<MultipleChoiceDecision, 'id' | 'date'> = {
        type: 'Multiple Choice',
        context: validation.data.context,
        options: validation.data.options.map(o => o.value),
        decision: validation.data.decision,
    };
    return { decision: decisionData };
}

export async function handleSaveFinancialAnalysisDecision(data: unknown) {
    const validation = financialAnalysisSchema.safeParse(data);
    if (!validation.success) {
        return { error: 'Dados inválidos para salvar a análise.' };
    }
    const decisionData: Omit<FinancialAnalysisDecision, 'id' | 'date'> = {
        type: 'Financial Analysis',
        context: validation.data.context,
        fixedCost: validation.data.fixedCost,
        variableCost: validation.data.variableCost,
    };
    return { decision: decisionData };
}

export async function handleSaveFinancialSpendingDecision(data: unknown) {
    const validation = saveFinancialSpendingDecisionSchema.safeParse(data);
    if (!validation.success) {
        return { error: 'Dados inválidos para salvar a decisão.' };
    }
    const decisionData: Omit<FinancialSpendingDecision, 'id' | 'date'> = {
        type: 'Financial Spending',
        context: validation.data.context,
        options: validation.data.options,
        decision: validation.data.decision,
    };
    return { decision: decisionData };
}

export async function handleSaveWeightedAnalysisDecision(data: unknown) {
    const validation = saveWeightedAnalysisDecisionSchema.safeParse(data);
    if (!validation.success) {
        console.error(validation.error.flatten())
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


// --- Server Actions (Boundary) ---

export async function getYesNoAdviceAction(prevState: any, formData: FormData) {
  const rawData = { context: formData.get('context') };
  return handleYesNoAdvice(rawData);
}

export async function getMultipleChoiceAdviceAction(prevState: any, formData: FormData) {
  const optionValues = formData.getAll('options.value').map(String);
  const optionDescriptions = formData.getAll('options.description').map(String);
  
  const options = optionValues.map((value, index) => ({
    value,
    description: optionDescriptions[index] || '',
  })).filter(opt => opt.value.trim() !== '');

  const rawData = {
    context: formData.get('context'),
    options,
  };
  
  return handleMultipleChoiceAdvice(rawData);
}

export async function getFinancialWeightsAction(prevState: any, formData: FormData) {
  const rawData = { 
    context: formData.get('context'),
    fixedCost: Number(formData.get('fixedCost')),
    variableCost: Number(formData.get('variableCost')),
  };
  return handleFinancialWeights(rawData);
}

export async function getFinancialSpendingAdviceAction(prevState: any, formData: FormData) {
  const rawData = {
    context: formData.get('context'),
    financing: {
      totalValue: Number(formData.get('financing.totalValue')),
      downPayment: Number(formData.get('financing.downPayment')),
      interestRate: Number(formData.get('financing.interestRate')),
      installments: Number(formData.get('financing.installments')),
    },
    consortium: {
      totalValue: Number(formData.get('consortium.totalValue')),
      adminFee: Number(formData.get('consortium.adminFee')),
      installments: Number(formData.get('consortium.installments')),
    },
  };

  return handleFinancialSpendingAdvice(rawData);
}

export async function getWeightedSuggestionsAction(prevState: any, formData: FormData) {
  const rawData = {
    context: formData.get('context'),
    existingCriteria: JSON.parse(formData.get('existingCriteria') as string),
    existingOptions: JSON.parse(formData.get('existingOptions') as string),
  };
  return handleWeightedSuggestions(rawData);
}


export async function saveYesNoDecisionAction(data: unknown) {
    return await handleSaveYesNoDecision(data);
}

export async function saveMultipleChoiceDecisionAction(data: unknown) {
    return await handleSaveMultipleChoiceDecision(data);
}

export async function saveFinancialAnalysisAction(data: unknown) {
    return await handleSaveFinancialAnalysisDecision(data);
}

export async function saveFinancialSpendingAction(data: unknown) {
    return await handleSaveFinancialSpendingDecision(data);
}

export async function saveWeightedAnalysisAction(data: unknown) {
    return await handleSaveWeightedAnalysisDecision(data);
}
