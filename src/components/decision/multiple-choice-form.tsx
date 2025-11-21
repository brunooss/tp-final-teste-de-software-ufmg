'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getMultipleChoiceAdviceAction, saveMultipleChoiceDecisionAction } from '@/app/actions';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AiAdviceCard } from './ai-advice-card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
  options: z.array(z.object({ 
    value: z.string().min(1, 'A opção não pode estar vazia.'),
    description: z.string().optional(),
  })).min(2, 'Por favor, forneça pelo menos duas opções.'),
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

export function MultipleChoiceForm() {
  const [adviceState, adviceAction, isAdvicePending] = useActionState(getMultipleChoiceAdviceAction, { advice: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
      options: [{ value: '', description: '' }, { value: '', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  useEffect(() => {
    if (adviceState.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: adviceState.error,
      });
    }
  }, [adviceState.error, toast]);
  
  const handleDecision = (decision: string) => {
    if (!decision) return;

    startSavingTransition(async () => {
      const { context, options } = form.getValues();
      const result = await saveMultipleChoiceDecisionAction({ context, options, decision });

      if (result.decision) {
        addDecision(result.decision);
        toast({
          title: 'Decisão Salva',
          description: `Você escolheu "${decision}" para: ${context.substring(0, 30)}...`,
        });
        form.reset();
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

  const isFormInvalid = !form.formState.isValid;
  const currentOptions = form.watch('options');
  const isDecisionDisabled = isSaving || isFormInvalid;

  return (
    <Form {...form}>
      <form action={adviceAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sua Decisão</CardTitle>
            <CardDescription>Descreva o contexto e as opções que você está considerando.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contexto da Decisão</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Qual laptop devo comprar para o meu novo trabalho?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Opções</FormLabel>
              <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                     <FormField
                      control={form.control}
                      name={`options.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opção {index + 1}</FormLabel>
                          <FormControl>
                            <Input placeholder={`Nome da Opção ${index + 1}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detalhes sobre esta opção..." {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="absolute top-2 right-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 2}
                            >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '', description: '' })}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
            <SubmitButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isDecisionDisabled}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tomar uma Decisão
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {currentOptions.map((option, index) => (
                   option.value && <DropdownMenuItem key={index} onSelect={() => handleDecision(option.value)} disabled={isSaving}>
                    {option.value}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
        
        <AiAdviceCard advice={adviceState.advice} isLoading={isAdvicePending} />
      </form>
    </Form>
  );
}
