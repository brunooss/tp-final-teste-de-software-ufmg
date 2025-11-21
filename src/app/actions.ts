'use server';

import { z } from 'zod';
import { handleYesNoAdvice, handleSaveYesNoDecision } from '../lib/yes-no';
import { handleMultipleChoiceAdvice, handleSaveMultipleChoiceDecision } from '../lib/multiple-choice';
import { handleWeightedSuggestions, handleSaveWeightedAnalysisDecision } from '../lib/weighted-analysis';

import { suggestFinancialWeights } from '../ai/flows/financial-decision-weight-suggestion';
import { getFinancialSpendingAdvice, type FinancialSpendingAdviceInput } from '../ai/flows/financial-spending-advice';
import { calculateConsortiumMonthlyPayment, calculateConsortiumTotal, calculateFinancingMonthlyPayment, calculateFinancingTotal } from '../lib/financial-calculations';
import type { YesNoDecision, MultipleChoiceDecision, FinancialSpendingDecision, FinancialAnalysisDecision, WeightedAnalysisDecision } from '../lib/types';
import { getWeightedDecisionSuggestions, type WeightedDecisionSuggestionsInput } from '../ai/flows/weighted-decision-advice';

// --- Schemas ---
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
const saveFinancialSpendingDecisionSchema = z.object({
    context: z.string().min(1),
    options: z.array(z.string()),
    decision: z.string().min(1),
});

// --- Lógica Core Testável ---

// --- GET ADVICE ---
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


// --- SAVE DECISION ---

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
