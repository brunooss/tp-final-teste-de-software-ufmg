'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFinancialWeightsAction, saveFinancialAnalysisAction } from '@/app/actions';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import ReactMarkdown from 'react-markdown';


const formSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão financeira.'),
  fixedCost: z.coerce.number().min(0, 'O custo fixo deve ser um número positivo.'),
  variableCost: z.coerce.number().min(0, 'O custo variável deve ser um número positivo.'),
});

type FormData = z.infer<typeof formSchema>;

type Suggestion = {
  fixedCostWeight: number;
  variableCostWeight: number;
  rationale: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Sugerir Pesos
    </Button>
  );
}

export function FinancialAnalysisForm() {
  const [weightState, weightAction, isWeightPending] = useActionState(getFinancialWeightsAction, { suggestions: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
      fixedCost: 0,
      variableCost: 0,
    },
  });

  useEffect(() => {
    if (weightState.error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: weightState.error,
      });
    }
  }, [weightState.error, toast]);

  const handleSave = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    startSavingTransition(async () => {
        const values = form.getValues();
        const result = await saveFinancialAnalysisAction(values);

        if (result.decision) {
            addDecision(result.decision);
            toast({
                title: 'Análise Salva',
                description: `Análise salva para: ${result.decision.context.substring(0, 30)}...`,
            });
            form.reset();
            weightState.suggestions = null;
        } else if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: result.error,
            });
        }
    });
  };

  const isDecisionDisabled = isSaving || !form.formState.isValid;

  return (
    <Form {...form}>
      <form action={weightAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contexto Financeiro</CardTitle>
            <CardDescription>Detalhe a decisão financeira e seus custos associados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contexto da Decisão</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Avaliando o custo de um novo processo de fabricação." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fixedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Fixo ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="variableCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Variável ($ por unidade)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
            <SubmitButton />
            <Button type="button" variant="outline" onClick={handleSave} disabled={isDecisionDisabled}>
               {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Análise no Histórico
            </Button>
          </CardFooter>
        </Card>
        
        {isWeightPending && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-headline">Cenários Gerados por IA</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                      <CardHeader>
                          <Skeleton className="h-6 w-1/2" />
                      </CardHeader>
                      <CardContent className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                  </Card>
              ))}
            </div>
          </div>
        )}

        {weightState.suggestions && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-headline">Cenários Gerados por IA</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weightState.suggestions.map((suggestion: Suggestion, index: number) => (
                <Card key={index} className="bg-primary/10 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-primary">Cenário {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium">
                      <p>Peso do Custo Fixo: {suggestion.fixedCostWeight.toFixed(2)}</p>
                      <p>Peso do Custo Variável: {suggestion.variableCostWeight.toFixed(2)}</p>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 mt-2">
                      <ReactMarkdown>{suggestion.rationale}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
