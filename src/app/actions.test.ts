import { describe, it, expect, vi } from 'vitest';
import * as actions from './actions';
import * as yesNoFlow from '@/ai/flows/yes-no-decision-advice';
import * as multipleChoiceFlow from '@/ai/flows/multiple-choice-decision-advice';
import * as financialWeightFlow from '@/ai/flows/financial-decision-weight-suggestion';
import * as financialSpendingFlow from '@/ai/flows/financial-spending-advice';
import * as weightedSuggestionsFlow from '@/ai/flows/weighted-decision-advice';

// Mock AI flows
vi.mock('@/ai/flows/yes-no-decision-advice');
vi.mock('@/ai/flows/multiple-choice-decision-advice');
vi.mock('@/ai/flows/financial-decision-weight-suggestion');
vi.mock('@/ai/flows/financial-spending-advice');
vi.mock('@/ai/flows/weighted-decision-advice');


describe('Server Actions Logic (actions.ts)', () => {

  // --- GET ADVICE HANDLERS ---

  describe('handleYesNoAdvice', () => {
    it('should return advice for valid input', async () => {
      const mockAdvice = 'Yes';
      vi.mocked(yesNoFlow.getYesNoDecisionAdvice).mockResolvedValue({ advice: mockAdvice });
      const result = await actions.handleYesNoAdvice({ context: 'Should I learn Vitest?' });
      expect(result).toEqual({ advice: mockAdvice });
    });

    // it('should return an error for invalid input', async () => {
    //   const result = await actions.handleYesNoAdvice({ context: 'short' });
    //   expect(result.error).toBeDefined();
    // });
  });

  describe('handleMultipleChoiceAdvice', () => {
    it('should return advice for valid input', async () => {
        const mockAdvice = 'Choose option B.';
        vi.mocked(multipleChoiceFlow.getMultipleChoiceDecisionAdvice).mockResolvedValue({ advice: mockAdvice });

        const input = {
            context: 'Which testing library is best?',
            options: [{ value: 'A' }, { value: 'B' }]
        };
        const result = await actions.handleMultipleChoiceAdvice(input);
        expect(result).toEqual({ advice: mockAdvice });
    });

    it('should return an error for invalid input', async () => {
        const input = { context: 'test', options: [] };
        const result = await actions.handleMultipleChoiceAdvice(input);
        expect(result.error).toBeDefined();
    });
  });

  describe('handleFinancialWeights', () => {
    it('should return suggestions for valid input', async () => {
      const mockSuggestions = [{ fixedCostWeight: 0.5, variableCostWeight: 0.5, rationale: 'Balanced' }];
      vi.mocked(financialWeightFlow.suggestFinancialWeights).mockResolvedValue({ suggestions: mockSuggestions });
      const input = { context: 'Valid context here', fixedCost: 100, variableCost: 50 };
      const result = await actions.handleFinancialWeights(input);
      expect(result).toEqual({ suggestions: mockSuggestions });
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
        // Check if the flow was called with calculated values
        expect(vi.mocked(financialSpendingFlow.getFinancialSpendingAdvice).mock.calls[0][0].financing).toHaveProperty('totalCost');
        expect(vi.mocked(financialSpendingFlow.getFinancialSpendingAdvice).mock.calls[0][0].consortium).toHaveProperty('totalCost');
    });
  });
  
  describe('handleWeightedSuggestions', () => {
    it('should return suggestions for valid input', async () => {
        const mockSuggestions = [{ name: 'Cost', weight: 50, rationale: 'It is important' }];
        vi.mocked(weightedSuggestionsFlow.getWeightedDecisionSuggestions).mockResolvedValue({ suggestions: mockSuggestions });

        const input = {
            context: 'Choose a university',
            existingCriteria: [],
            existingOptions: []
        };
        const result = await actions.handleWeightedSuggestions(input);
        expect(result).toEqual({ suggestions: mockSuggestions });
    });
  });


  // --- SAVE DECISION HANDLERS ---

  describe('handleSaveYesNoDecision', () => {
    it('should return a structured decision object for valid input', async () => {
      const input = { context: 'A valid decision context', decision: 'Sim' as const };
      const result = await actions.handleSaveYesNoDecision(input);
      expect(result.decision?.type).toBe('Yes/No');
      expect(result.decision?.context).toBe(input.context);
      expect(result.decision?.decision).toBe(input.decision);
      expect(result.error).toBeUndefined();
    });

    it('should return an error for invalid data', async () => {
        const input = { context: 'short', decision: 'Maybe' };
        const result = await actions.handleSaveYesNoDecision(input);
        expect(result.error).toBeDefined();
        expect(result.decision).toBeUndefined();
    });
  });
  
  describe('handleSaveMultipleChoiceDecision', () => {
    it('should return a structured decision object', async () => {
        const input = { context: 'Valid context', options: [{value: 'A'}, {value: 'B'}], decision: 'A' };
        const result = await actions.handleSaveMultipleChoiceDecision(input);
        expect(result.decision?.type).toBe('Multiple Choice');
        expect(result.decision?.options).toEqual(['A', 'B']);
        expect(result.decision?.decision).toBe('A');
        expect(result.error).toBeUndefined();
    });
  });

  describe('handleSaveFinancialAnalysisDecision', () => {
    it('should return a structured decision object', async () => {
        const input = { context: 'Valid context', fixedCost: 1000, variableCost: 50 };
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
  
  describe('handleSaveWeightedAnalysisDecision', () => {
    it('should return a structured decision object', async () => {
        const input = {
            context: 'Choose job',
            criteria: [{ name: 'Salary', weight: 100 }],
            options: [{ name: 'Job A', scores: { 'Salary': 10 } }],
            decision: 'Job A'
        };
        const result = await actions.handleSaveWeightedAnalysisDecision(input);
        expect(result.decision?.type).toBe('Weighted Analysis');
        expect(result.decision?.decision).toBe('Job A');
        expect(result.error).toBeUndefined();
    });
  });

});
