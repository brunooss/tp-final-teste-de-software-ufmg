'use server';

import { z } from 'zod';
import { getYesNoDecisionAdvice, type YesNoDecisionAdviceInput } from '@/ai/flows/yes-no-decision-advice';
import { getMultipleChoiceDecisionAdvice, type MultipleChoiceDecisionAdviceInput } from '@/ai/flows/multiple-choice-decision-advice';
import { suggestFinancialWeights, type FinancialWeightInput } from '@/ai/flows/financial-decision-weight-suggestion';
import { getFinancialSpendingAdvice, type FinancialSpendingAdviceInput } from '@/ai/flows/financial-spending-advice';
import { calculateConsortiumTotal, calculateFinancingTotal } from '@/lib/financial-calculations';
import type { YesNoDecision, MultipleChoiceDecision, FinancialSpendingDecision, FinancialAnalysisDecision } from '@/lib/types';

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
    const result = await getFinancialSpendingAdvice(validation.data as FinancialSpendingAdviceInput);
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

// --- SAVE DECISION ---

export function handleSaveYesNoDecision(data: unknown) {
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

export function handleSaveMultipleChoiceDecision(data: unknown) {
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

export function handleSaveFinancialAnalysisDecision(data: unknown) {
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

export function handleSaveFinancialSpendingDecision(data: unknown) {
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


export async function getFinancialTotalsAction(data: unknown) {
    return handleFinancialTotals(data);
}

export async function saveYesNoDecisionAction(data: unknown) {
    return handleSaveYesNoDecision(data);
}

export async function saveMultipleChoiceDecisionAction(data: unknown) {
    return handleSaveMultipleChoiceDecision(data);
}

export async function saveFinancialAnalysisAction(data: unknown) {
    return handleSaveFinancialAnalysisDecision(data);
}

export async function saveFinancialSpendingAction(data: unknown) {
    return handleSaveFinancialSpendingDecision(data);
}