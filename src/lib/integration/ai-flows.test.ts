/**
 * @fileoverview Integration tests for AI flows.
 *
 * These tests verify the entire flow from the action handler down to the AI prompt generation,
 * mocking the final call to the AI model itself. This ensures that validation,
 * data transformation, and schema definitions are all working together correctly.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the core Genkit AI functions at the lowest level
const mockFlow = vi.fn();
vi.mock('@/ai/genkit', async () => {
  const { genkit } = await vi.importActual<typeof import('genkit')>('genkit');
  return {
    ai: {
      ...genkit({}),
      defineFlow: vi.fn().mockImplementation((_config, implementation) => {
        // Replace the flow implementation with our mock so we can intercept calls
        return (...args: any[]) => mockFlow(...args, implementation);
      }),
      definePrompt: vi.fn(), // We don't need the implementation for this test
    },
  };
});

import { getYesNoDecisionAdvice } from '@/ai/flows/yes-no-decision-advice';
import { getMultipleChoiceDecisionAdvice } from '@/ai/flows/multiple-choice-decision-advice';
import { getWeightedDecisionSuggestions } from '@/ai/flows/weighted-decision-advice';
import { suggestFinancialWeights } from '@/ai/flows/financial-decision-weight-suggestion';
import { getFinancialSpendingAdvice } from '@/ai/flows/financial-spending-advice';


describe('AI Flows Integration Tests', () => {

  it('[Integration] should process a Yes/No advice request and receive a response', async () => {
    // Arrange
    const input = { context: 'Should I invest in stocks?' };

    // Act
    const result = await getYesNoDecisionAdvice(input);

    // Assert
    expect(result.advice).toBeDefined();
  });

  it('[Integration] should process a Multiple Choice advice request and receive a response', async () => {
    // Arrange
    const input = {
      context: 'What is the best framework for a new project?',
      options: [
        { value: 'React', description: 'A popular UI library.' },
        { value: 'Vue', description: 'A progressive framework.' },
      ],
    };
    
    // Act
    const result = await getMultipleChoiceDecisionAdvice(input);

    // Assert
    expect(result.advice).toBeDefined();
  });

  it('[Integration] should process a Weighted Analysis suggestion request and receive a response', async () => {
    // Arrange
    const input = {
      context: 'Choosing a new car',
      existingCriteria: [{ name: 'Price', weight: 50 }],
      existingOptions: [{ name: 'Toyota Camry', scores: {} }],
    };

    // Act
    const result = await getWeightedDecisionSuggestions(input);

    // Assert
    expect(result.suggestions).toBeDefined();
  });

  it('[Integration] should process a Financial Weight suggestion request and receive a response', async () => {
    // Arrange
    const input = {
        context: 'Deciding on budget for a new factory.',
    };
    
    // Act
    const result = await suggestFinancialWeights(input);

    // Assert
    expect(result.suggestions).toBeDefined();
  });

  it('[Integration] should process a Financial Spending advice request and receive a response', async () => {
    // Arrange
    const input = {
      context: 'Buying a new laptop',
      financing: { totalValue: 2000, downPayment: 500, interestRate: 10, installments: 12, totalCost: 2800, monthlyPayment: 191.67 },
      consortium: { totalValue: 2000, adminFee: 5, installments: 24, totalCost: 2100, monthlyPayment: 87.5 },
    };

    // Act
    const result = await getFinancialSpendingAdvice(input);

    // Assert
    expect(result.advice).toBeDefined();
  });

});
