'use server';

/**
 * @fileOverview Provides AI-generated advice for Yes/No decisions based on user-provided context.
 *
 * - `getYesNoDecisionAdvice` -  A function that takes a decision context and returns AI-generated advice.
 * - `YesNoDecisionAdviceInput` - The input type for the `getYesNoDecisionAdvice` function.
 * - `YesNoDecisionAdviceOutput` - The return type for the `getYesNoDecisionAdvice` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const YesNoDecisionAdviceInputSchema = z.object({
  context: z.string().describe('The context of the decision.'),
});
export type YesNoDecisionAdviceInput = z.infer<typeof YesNoDecisionAdviceInputSchema>;

const YesNoDecisionAdviceOutputSchema = z.object({
  advice: z.string().describe('AI-generated advice for the Yes/No decision.'),
});
export type YesNoDecisionAdviceOutput = z.infer<typeof YesNoDecisionAdviceOutputSchema>;

export async function getYesNoDecisionAdvice(
  input: YesNoDecisionAdviceInput
): Promise<YesNoDecisionAdviceOutput> {
  return yesNoDecisionAdviceFlow(input);
}

const yesNoDecisionPrompt = ai.definePrompt({
  name: 'yesNoDecisionPrompt',
  input: {schema: YesNoDecisionAdviceInputSchema},
  output: {schema: YesNoDecisionAdviceOutputSchema},
  prompt: `You are an AI assistant designed to provide helpful advice for making Yes/No decisions.

  Based on the following context, provide advice to help the user decide whether to proceed with a "Yes" or "No" decision.

  Context: {{{context}}}

  Consider potential benefits, risks, and alternative options.  The advice should be succinct and easy to understand.
  Focus on the user's best interests and well-being.  The output must be a single paragraph.
  `,
});

const yesNoDecisionAdviceFlow = ai.defineFlow(
  {
    name: 'yesNoDecisionAdviceFlow',
    inputSchema: YesNoDecisionAdviceInputSchema,
    outputSchema: YesNoDecisionAdviceOutputSchema,
  },
  async input => {
    const {output} = await yesNoDecisionPrompt(input);
    return output!;
  }
);
