// src/ai/flows/multiple-choice-decision-advice.ts
'use server';
/**
 * @fileOverview Provides AI-generated advice for making decisions with multiple options.
 *
 * - `getMultipleChoiceDecisionAdvice` - A function that takes a decision context and multiple options, and returns AI-generated advice.
 * - `MultipleChoiceDecisionAdviceInput` - The input type for the `getMultipleChoiceDecisionAdvice` function.
 * - `MultipleChoiceDecisionAdviceOutput` - The return type for the `getMultipleChoiceDecisionAdvice` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultipleChoiceDecisionAdviceInputSchema = z.object({
  context: z.string().describe('The context of the decision.'),
  options: z.array(z.string()).describe('The multiple options to select from.'),
});

export type MultipleChoiceDecisionAdviceInput = z.infer<
  typeof MultipleChoiceDecisionAdviceInputSchema
>;

const MultipleChoiceDecisionAdviceOutputSchema = z.object({
  advice: z.string().describe('AI-generated advice for choosing the best option.'),
});

export type MultipleChoiceDecisionAdviceOutput = z.infer<
  typeof MultipleChoiceDecisionAdviceOutputSchema
>;

export async function getMultipleChoiceDecisionAdvice(
  input: MultipleChoiceDecisionAdviceInput
): Promise<MultipleChoiceDecisionAdviceOutput> {
  return multipleChoiceDecisionAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'multipleChoiceDecisionAdvicePrompt',
  input: {schema: MultipleChoiceDecisionAdviceInputSchema},
  output: {schema: MultipleChoiceDecisionAdviceOutputSchema},
  prompt: `Dado o seguinte contexto de decisão e opções, forneça conselhos gerados por IA para ajudar a escolher a melhor opção.\n\nContexto: {{{context}}}\nOpções: {{#each options}}- {{{this}}}\n{{/each}}\n\nConselho: `,
});

const multipleChoiceDecisionAdviceFlow = ai.defineFlow(
  {
    name: 'multipleChoiceDecisionAdviceFlow',
    inputSchema: MultipleChoiceDecisionAdviceInputSchema,
    outputSchema: MultipleChoiceDecisionAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
