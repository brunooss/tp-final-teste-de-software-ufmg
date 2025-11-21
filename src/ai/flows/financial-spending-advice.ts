'use server';
/**
 * @fileOverview Fornece conselhos sobre decisões de gastos financeiros, comparando financiamento e consórcio.
 *
 * - getFinancialSpendingAdvice - Uma função que analisa dados financeiros e retorna conselhos da IA.
 * - FinancialSpendingAdviceInput - O tipo de entrada para a função `getFinancialSpendingAdvice`.
 * - FinancialSpendingAdviceOutput - O tipo de retorno para a função `getFinancialSpendingAdvice`.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FinancialSpendingAdviceInputSchema = z.object({
  context: z.string().describe('O contexto da decisão financeira (ex: comprar um carro).'),
  financing: z.object({
    totalValue: z.number().describe('O valor total do bem no financiamento.'),
    downPayment: z.number().describe('O valor da entrada do financiamento.'),
    interestRate: z.number().describe('A taxa de juros mensal do financiamento (em %).'),
    installments: z.number().describe('O número de parcelas do financiamento.'),
    monthlyPayment: z.number().describe('O valor da parcela mensal do financiamento.'),
    totalCost: z.number().describe('O custo total do financiamento, incluindo juros.'),
  }),
  consortium: z.object({
    totalValue: z.number().describe('O valor total da carta de crédito no consórcio.'),
    adminFee: z.number().describe('A taxa de administração do consórcio (em %).'),
    installments: z.number().describe('O número de parcelas do consórcio.'),
    monthlyPayment: z.number().describe('O valor da parcela mensal do consórcio.'),
    totalCost: z.number().describe('O custo total do consórcio, incluindo taxas.'),
  }),
});
export type FinancialSpendingAdviceInput = z.infer<typeof FinancialSpendingAdviceInputSchema>;

const FinancialSpendingAdviceOutputSchema = z.object({
  advice: z.string().describe('Conselho gerado por IA comparando as duas opções financeiras, formatado como Markdown.'),
});
export type FinancialSpendingAdviceOutput = z.infer<typeof FinancialSpendingAdviceOutputSchema>;

export async function getFinancialSpendingAdvice(input: FinancialSpendingAdviceInput): Promise<FinancialSpendingAdviceOutput> {
  return financialSpendingAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialSpendingAdvicePrompt',
  input: { schema: FinancialSpendingAdviceInputSchema },
  output: { schema: FinancialSpendingAdviceOutputSchema },
  prompt: `Você é um consultor financeiro especialista. Analise a seguinte decisão financeira e forneça um conselho claro e conciso para o usuário, formatado em Markdown.

Contexto da Decisão: {{{context}}}

Opção 1: Financiamento
- Valor do Bem: R$ {{{financing.totalValue}}}
- Entrada: R$ {{{financing.downPayment}}}
- Taxa de Juros: {{{financing.interestRate}}}% ao mês
- Parcelas: {{{financing.installments}}}
- **Valor da Parcela Mensal: R$ {{{financing.monthlyPayment}}}**
- **Custo Total do Financiamento: R$ {{{financing.totalCost}}}**

Opção 2: Consórcio
- Valor da Carta: R$ {{{consortium.totalValue}}}
- Taxa de Administração: {{{consortium.adminFee}}}%
- Parcelas: {{{consortium.installments}}}
- **Valor da Parcela Mensal: R$ {{{consortium.monthlyPayment}}}**
- **Custo Total do Consórcio: R$ {{{consortium.totalCost}}}**

Compare os prós e contras de cada opção, usando listas e negrito para destacar pontos importantes. Considere o custo total, a liquidez, o tempo para aquisição do bem e outros fatores relevantes. Dê uma recomendação fundamentada sobre qual opção parece mais vantajosa para o cenário apresentado. Seja direto e objetivo. Use o formato Markdown.`,
});

const financialSpendingAdviceFlow = ai.defineFlow(
  {
    name: 'financialSpendingAdviceFlow',
    inputSchema: FinancialSpendingAdviceInputSchema,
    outputSchema: FinancialSpendingAdviceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
