'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getYesNoAdviceAction, saveYesNoDecisionAction } from '@/app/actions';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AiAdviceCard } from './ai-advice-card';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
});

type FormData = z.infer<typeof formSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Obter Conselho da IA
    </Button>
  );
}

export function YesNoForm() {
  const [adviceState, adviceAction, isAdvicePending] = useActionState(getYesNoAdviceAction, { advice: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
    },
  });

  useEffect(() => {
    if (adviceState.error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: adviceState.error,
      });
    }
  }, [adviceState.error, toast]);

  const handleDecision = async (decision: 'Sim' | 'Não') => {
    const isFormValid = await form.trigger('context');
    if (!isFormValid) return;

    startSavingTransition(async () => {
      const result = await saveYesNoDecisionAction({ context: form.getValues('context'), decision });
      
      if (result.decision) {
        addDecision(result.decision);
        toast({
          title: 'Decisão Salva',
          description: `Você decidiu "${decision}" para: ${result.decision.context.substring(0, 30)}...`,
        });
        form.reset();
        // Clear advice when a decision is made
        adviceState.advice = null;
      } else if (result.error) {
         toast({
          variant: 'destructive',
          title: 'Erro ao Salvar',
          description: result.error,
        });
      }
    });
  };
  
  const isFormInvalid = !form.formState.isValid && form.formState.isSubmitted;
  const isDecisionDisabled = isSaving || (!form.getValues('context') || !!form.formState.errors.context);

  return (
    <Form {...form}>
      <form action={adviceAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sua Decisão</CardTitle>
            <CardDescription>Descreva a decisão que você está tentando tomar.</CardDescription>
          </CardHeader>
          <CardContent>
              <FormField
                control={form.control}
                name="context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contexto da Decisão</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Devo aceitar a nova oferta de emprego em outra cidade?"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
            <SubmitButton />
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => handleDecision('Sim')} className="flex-1" disabled={isDecisionDisabled}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Decidir 'Sim'
              </Button>
              <Button variant="outline" type="button" onClick={() => handleDecision('Não')} className="flex-1" disabled={isDecisionDisabled}>
                 {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Decidir 'Não'
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <AiAdviceCard advice={adviceState.advice} isLoading={isAdvicePending} />
      </form>
    </Form>
  );
}
