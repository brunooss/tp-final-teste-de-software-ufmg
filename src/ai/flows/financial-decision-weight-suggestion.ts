'use server';

/**
 * @fileOverview Suggests various weights for fixed and variable costs in financial decisions.
 *
 * - suggestFinancialWeights - A function that suggests weights for financial costs.
 * - FinancialWeightInput - The input type for the suggestFinancialWeights function.
 * - FinancialWeightOutput - The return type for the suggestFinancialWeights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialWeightInputSchema = z.object({
  context: z.string().describe('The context of the financial decision.'),
});
export type FinancialWeightInput = z.infer<typeof FinancialWeightInputSchema>;

const FinancialWeightOutputSchema = z.object({
  suggestions: z
    .array(z.object({
      fixedCostWeight: z.number().describe('Suggested weight for fixed costs (0-1).'),
      variableCostWeight: z.number().describe('Suggested weight for variable costs (0-1).'),
      rationale: z.string().describe('The rationale behind the suggested weights.'),
    }))
    .describe('A list of suggested weights for fixed and variable costs.'),
});
export type FinancialWeightOutput = z.infer<typeof FinancialWeightOutputSchema>;

export async function suggestFinancialWeights(input: FinancialWeightInput): Promise<FinancialWeightOutput> {
  return financialWeightSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialWeightSuggestionPrompt',
  input: {schema: FinancialWeightInputSchema},
  output: {schema: FinancialWeightOutputSchema},
  prompt: `You are an expert financial advisor. Given the following context, suggest several different weights for fixed and variable costs to help the user understand different scenarios.

Context: {{{context}}}

Provide a variety of suggestions with different weights, and a brief rationale for each suggestion.
Ensure that fixedCostWeight and variableCostWeight sum to 1 for each suggestion.
`,
});

const financialWeightSuggestionFlow = ai.defineFlow(
  {
    name: 'financialWeightSuggestionFlow',
    inputSchema: FinancialWeightInputSchema,
    outputSchema: FinancialWeightOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
