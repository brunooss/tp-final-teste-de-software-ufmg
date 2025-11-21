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
      ...genkit(),
      defineFlow: vi.fn().mockImplementation((_config, implementation) => {
        // Replace the flow implementation with our mock so we can intercept calls
        return (...args: any[]) => mockFlow(...args, implementation);
      }),
      definePrompt: vi.fn(), // We don't need the implementation for this test
    },
  };
});

import { handleYesNoAdvice } from '@/lib/yes-no';
import { handleMultipleChoiceAdvice } from '@/lib/multiple-choice';
import { handleWeightedSuggestions } from '@/lib/weighted-analysis';
import { handleFinancialWeights, handleFinancialSpendingAdvice } from '@/app/actions';

describe('AI Flows Integration Tests', () => {

  it('[Integration] should process a Yes/No advice request and receive a response', async () => {
    // Arrange
    const input = { context: 'Should I invest in stocks?' };
    const mockAiResponse = { advice: 'A valid AI response.' };
    mockFlow.mockResolvedValue({ output: mockAiResponse });

    // Act
    const result = await handleYesNoAdvice(input);

    // Assert
    expect(result.advice).toBeDefined();
    // Verify that the flow was called with the correct input after validation
    const lastCallArgs = mockFlow.mock.lastCall;
    const receivedInput = lastCallArgs[0];
    expect(receivedInput).toEqual(input);
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
    const mockAiResponse = { advice: 'A valid AI response.' };
    mockFlow.mockResolvedValue({ output: mockAiResponse });

    // Act
    const result = await handleMultipleChoiceAdvice(input);

    // Assert
    expect(result.advice).toBeDefined();
    const lastCallArgs = mockFlow.mock.lastCall;
    const receivedInput = lastCallArgs[0];
    expect(receivedInput).toEqual(input);
  });

  it('[Integration] should process a Weighted Analysis suggestion request and receive a response', async () => {
    // Arrange
    const input = {
      context: 'Choosing a new car',
      existingCriteria: [{ name: 'Price', weight: 50 }],
      existingOptions: [{ name: 'Toyota Camry', scores: {} }],
    };
    const mockAiResponse = { suggestions: [{ name: 'Safety', weight: 30, rationale: 'Crucial for family.' }] };
    mockFlow.mockResolvedValue({ output: mockAiResponse });

    // Act
    const result = await handleWeightedSuggestions(input);

    // Assert
    expect(result.suggestions).toBeDefined();
    const lastCallArgs = mockFlow.mock.lastCall;
    const receivedInput = lastCallArgs[0];
    expect(receivedInput).toEqual(input);
  });

  it('[Integration] should process a Financial Weight suggestion request and receive a response', async () => {
    // Arrange
    const input = {
        context: 'Deciding on budget for a new factory.',
        fixedCost: 500000,
        variableCost: 100
    };
    const mockAiResponse = { suggestions: [{ fixedCostWeight: 0.7, variableCostWeight: 0.3, rationale: 'Prioritize fixed costs.' }] };
    mockFlow.mockResolvedValue({ output: mockAiResponse });

    // Act
    const result = await handleFinancialWeights(input);

    // Assert
    expect(result.suggestions).toBeDefined();
    const lastCallArgs = mockFlow.mock.lastCall;
    const receivedInput = lastCallArgs[0];
    // The flow only expects the context
    expect(receivedInput).toEqual({ context: input.context });
  });

  it('[Integration] should process a Financial Spending advice request and receive a response', async () => {
    // Arrange
    const input = {
      context: 'Buying a new laptop',
      financing: { totalValue: 2000, downPayment: 500, interestRate: 10, installments: 12 },
      consortium: { totalValue: 2000, adminFee: 5, installments: 24 },
    };
    const mockAiResponse = { advice: 'A valid AI response.' };
    mockFlow.mockResolvedValue({ output: mockAiResponse });

    // Act
    const result = await handleFinancialSpendingAdvice(input);

    // Assert
    expect(result.advice).toBeDefined();
    const lastCallArgs = mockFlow.mock.lastCall;
    const receivedInput = lastCallArgs[0];
    // The action calculates totals before passing to the flow, so we check if they exist.
    expect(receivedInput.context).toBe(input.context);
    expect(receivedInput.financing).toHaveProperty('totalCost');
    expect(receivedInput.financing).toHaveProperty('monthlyPayment');
    expect(receivedInput.consortium).toHaveProperty('totalCost');
    expect(receivedInput.consortium).toHaveProperty('monthlyPayment');
  });

});
