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
  prompt: `Você é um consultor financeiro especialista. Dado o seguinte contexto, sugira vários pesos diferentes para custos fixos e variáveis para ajudar o usuário a entender diferentes cenários.

Contexto: {{{context}}}

Forneça uma variedade de sugestões com pesos diferentes e uma breve justificativa para cada sugestão.
Certifique-se de que fixedCostWeight e variableCostWeight somem 1 para cada sugestão.
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
