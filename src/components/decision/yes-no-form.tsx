'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getYesNoAdviceAction } from '@/app/actions';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
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
  const [state, formAction] = useFormState(getYesNoAdviceAction, { advice: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const { pending } = useFormStatus();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
    },
  });

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: state.error,
      });
    }
  }, [state.error, toast]);

  const handleDecision = (decision: 'Sim' | 'Não') => {
    const { context } = form.getValues();
    if (!context) {
      form.trigger('context');
      return;
    }
    if (form.formState.errors.context) return;
    
    addDecision({ type: 'Yes/No', context, decision });
    toast({
      title: 'Decisão Salva',
      description: `Você decidiu "${decision}" para: ${context.substring(0, 30)}...`,
    });
    form.reset();
    // Clear advice when a decision is made
    state.advice = null;
  };
  
  const isFormInvalid = !form.formState.isValid;
  
  const customAction = (formData: FormData) => {
    const newFormData = new FormData();
    newFormData.append('context', formData.context);
    formAction(newFormData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(customAction)} className="space-y-6">
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
              <Button variant="outline" type="button" onClick={() => handleDecision('Sim')} className="flex-1" disabled={isFormInvalid}>
                Decidir 'Sim'
              </Button>
              <Button variant="outline" type="button" onClick={() => handleDecision('Não')} className="flex-1" disabled={isFormInvalid}>
                Decidir 'Não'
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <AiAdviceCard advice={state.advice} isLoading={pending} />
      </form>
    </Form>
  );
}
