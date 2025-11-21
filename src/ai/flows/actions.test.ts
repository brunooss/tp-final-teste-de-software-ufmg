import { describe, it, expect, vi } from 'vitest';
import * as actions from '../../app/actions';
import * as yesNo from '../../lib/yes-no';
import * as multipleChoice from '../../lib/multiple-choice';
import * as weightedAnalysis from '../../lib/weighted-analysis';
import * as financialWeightFlow from './financial-decision-weight-suggestion';
import * as financialSpendingFlow from './financial-spending-advice';

// Mock lib functions
vi.mock('../../lib/yes-no');
vi.mock('../../lib/multiple-choice');
vi.mock('../../lib/weighted-analysis');

// Mock AI flows that are still directly called by actions.ts
vi.mock('./financial-decision-weight-suggestion');
vi.mock('./financial-spending-advice');

describe('Server Actions Logic (actions.ts)', () => {

  // --- ACTION -> LIB FUNCTION MAPPING ---

  describe('getYesNoAdviceAction', () => {
    it('should call handleYesNoAdvice with form data', async () => {
      const formData = new FormData();
      formData.append('context', 'test context');
      vi.mocked(yesNo.handleYesNoAdvice).mockResolvedValue({ advice: 'test advice' });
      
      await actions.getYesNoAdviceAction(null, formData);
      
      expect(yesNo.handleYesNoAdvice).toHaveBeenCalledWith({ context: 'test context' });
    });
  });

  describe('getMultipleChoiceAdviceAction', () => {
    it('should call handleMultipleChoiceAdvice with form data', async () => {
      const formData = new FormData();
      formData.append('context', 'test context');
      formData.append('options.value', 'A');
      formData.append('options.description', 'Desc A');
      formData.append('options.value', 'B');
      formData.append('options.description', 'Desc B');
      vi.mocked(multipleChoice.handleMultipleChoiceAdvice).mockResolvedValue({ advice: 'test advice' });

      await actions.getMultipleChoiceAdviceAction(null, formData);

      expect(multipleChoice.handleMultipleChoiceAdvice).toHaveBeenCalledWith({
        context: 'test context',
        options: [{ value: 'A', description: 'Desc A' }, { value: 'B', description: 'Desc B' }]
      });
    });
  });
  
    describe('getWeightedSuggestionsAction', () => {
    it('should call handleWeightedSuggestions with form data', async () => {
      const formData = new FormData();
      formData.append('context', 'test context');
      formData.append('existingCriteria', JSON.stringify([{ name: 'C1', weight: 50 }]));
      formData.append('existingOptions', JSON.stringify([{ name: 'O1', scores: {} }]));
      vi.mocked(weightedAnalysis.handleWeightedSuggestions).mockResolvedValue({ suggestions: [] });

      await actions.getWeightedSuggestionsAction(null, formData);

      expect(weightedAnalysis.handleWeightedSuggestions).toHaveBeenCalledWith({
        context: 'test context',
        existingCriteria: [{ name: 'C1', weight: 50 }],
        existingOptions: [{ name: 'O1', scores: {} }]
      });
    });
  });


  // --- DIRECTLY CALLED LOGIC (Still in actions.ts) ---

  describe('handleFinancialWeights', () => {
    it('should return suggestions for valid input', async () => {
      const mockSuggestions = [{ fixedCostWeight: 0.5, variableCostWeight: 0.5, rationale: 'Balanced' }];
      vi.mocked(financialWeightFlow.suggestFinancialWeights).mockResolvedValue({ suggestions: mockSuggestions });
      const input = { context: 'Valid context here for finance', fixedCost: 100, variableCost: 50 };
      const result = await actions.handleFinancialWeights(input);
      expect(result).toEqual({ suggestions: mockSuggestions });
    });

    it('should return a validation error for invalid context', async () => {
       const input = { context: 'short', fixedCost: 100, variableCost: 50 };
       const result = await actions.handleFinancialWeights(input);
       expect(result.error).toBeDefined();
    });
  });

  describe('handleFinancialSpendingAdvice', () => {
    it('should perform calculations and return advice', async () => {
        const mockAdvice = 'Financing is better.';
        vi.mocked(financialSpendingFlow.getFinancialSpendingAdvice).mockResolvedValue({ advice: mockAdvice });

        const input = {
            context: 'Buy a car',
            financing: { totalValue: 50000, downPayment: 10000, interestRate: 1.5, installments: 48 },
            consortium: { totalValue: 50000, adminFee: 15, installments: 60 }
        };
        const result = await actions.handleFinancialSpendingAdvice(input);
        expect(result).toEqual({ advice: mockAdvice });
        expect(vi.mocked(financialSpendingFlow.getFinancialSpendingAdvice).mock.calls[0][0].financing).toHaveProperty('totalCost');
        expect(vi.mocked(financialSpendingFlow.getFinancialSpendingAdvice).mock.calls[0][0].consortium).toHaveProperty('totalCost');
    });
  });

  // --- SAVE DECISION HANDLERS ---
  
  describe('handleSaveFinancialAnalysisDecision', () => {
    it('should return a structured decision object', async () => {
        const input = { context: 'Valid context for saving finance', fixedCost: 1000, variableCost: 50 };
        const result = await actions.handleSaveFinancialAnalysisDecision(input);
        expect(result.decision?.type).toBe('Financial Analysis');
        expect(result.decision?.fixedCost).toBe(1000);
        expect(result.error).toBeUndefined();
    });
  });
  
  describe('handleSaveFinancialSpendingDecision', () => {
    it('should return a structured decision object', async () => {
        const input = { context: 'Buy a house', options: ['Financing', 'Consortium'], decision: 'Financing' };
        const result = await actions.handleSaveFinancialSpendingDecision(input);
        expect(result.decision?.type).toBe('Financial Spending');
        expect(result.decision?.context).toBe(input.context);
        expect(result.error).toBeUndefined();
    });
  });

  // These now just pass through to the lib functions
  it('saveYesNoDecisionAction calls handleSaveYesNoDecision', async () => {
    const data = { context: 'test', decision: 'Sim' };
    await actions.saveYesNoDecisionAction(data);
    expect(yesNo.handleSaveYesNoDecision).toHaveBeenCalledWith(data);
  });
  
  it('saveMultipleChoiceDecisionAction calls handleSaveMultipleChoiceDecision', async () => {
    const data = { context: 'test', options: [], decision: 'A' };
    await actions.saveMultipleChoiceDecisionAction(data);
    expect(multipleChoice.handleSaveMultipleChoiceDecision).toHaveBeenCalledWith(data);
  });
  
  it('saveWeightedAnalysisAction calls handleSaveWeightedAnalysisDecision', async () => {
    const data = { context: 'test', criteria: [], options: [], decision: 'A' };
    await actions.saveWeightedAnalysisAction(data);
    expect(weightedAnalysis.handleSaveWeightedAnalysisDecision).toHaveBeenCalledWith(data);
  });

});
