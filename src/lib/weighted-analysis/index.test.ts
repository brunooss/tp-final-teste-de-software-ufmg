import { describe, it, expect, vi } from 'vitest';
import { handleWeightedSuggestions, handleSaveWeightedAnalysisDecision } from '.';
import * as weightedSuggestionsFlow from '@/ai/flows/weighted-decision-advice';

// Mock the AI flow
vi.mock('@/ai/flows/weighted-decision-advice');

describe('Weighted Analysis Decision Logic', () => {

  describe('handleWeightedSuggestions', () => {
    it('should return suggestions for valid input', async () => {
      const mockSuggestions = [{ name: 'Cost', weight: 50, rationale: 'It is important' }];
      vi.mocked(weightedSuggestionsFlow.getWeightedDecisionSuggestions).mockResolvedValue({ suggestions: mockSuggestions });

      const input = {
          context: 'Choose a university',
          existingCriteria: [],
          existingOptions: []
      };
      const result = await handleWeightedSuggestions(input);
      
      expect(result).toEqual({ suggestions: mockSuggestions });
      expect(weightedSuggestionsFlow.getWeightedDecisionSuggestions).toHaveBeenCalledWith(input);
    });

    it('should return a validation error for invalid input (e.g., wrong type)', async () => {
      const input = { context: 123 }; // Invalid context type
      const result = await handleWeightedSuggestions(input);

      expect(result.error).toBe('Os dados fornecidos para sugestão são inválidos.');
      expect(result.suggestions).toBeUndefined();
    });

     it('should return a generic error if the AI flow fails', async () => {
      vi.mocked(weightedSuggestionsFlow.getWeightedDecisionSuggestions).mockRejectedValue(new Error('AI fail'));
      
      const input = { context: 'A valid decision context' };
      const result = await handleWeightedSuggestions(input);

      expect(result.error).toBe('Falha ao obter sugestões da IA. Por favor, tente novamente.');
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('handleSaveWeightedAnalysisDecision', () => {
    it('should return a structured decision object for valid input', async () => {
      const input = {
          context: 'Choose job',
          criteria: [{ name: 'Salary', weight: 100 }],
          options: [{ name: 'Job A', scores: { 'Salary': 10 } }],
          decision: 'Job A'
      };
      const result = await handleSaveWeightedAnalysisDecision(input);

      expect(result.decision?.type).toBe('Weighted Analysis');
      expect(result.decision?.context).toBe('Choose job');
      expect(result.decision?.criteria).toEqual(input.criteria);
      expect(result.decision?.decision).toBe('Job A');
      expect(result.error).toBeUndefined();
    });

    it('should return an error for invalid data', async () => {
      const input = { context: 'Test', criteria: [], options: [], decision: '' }; // Invalid: decision is empty
      const result = await handleSaveWeightedAnalysisDecision(input);

      expect(result.error).toBeDefined();
      expect(result.decision).toBeUndefined();
    });
  });
});
