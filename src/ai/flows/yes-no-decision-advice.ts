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
  prompt: `Você é um assistente de IA projetado para fornecer conselhos úteis para tomar decisões de Sim/Não.

  Com base no seguinte contexto, forneça conselhos para ajudar o usuário a decidir se deve prosseguir com uma decisão de "Sim" ou "Não".

  Contexto: {{{context}}}

  Considere os benefícios potenciais, riscos e opções alternativas. O conselho deve ser sucinto e fácil de entender.
  Concentre-se nos melhores interesses e bem-estar do usuário. A saída deve ser um único parágrafo.
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
