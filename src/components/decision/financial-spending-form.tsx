'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
  options: z.array(z.object({ value: z.string().min(1, 'A opção não pode estar vazia.') })).min(2, 'Por favor, forneça pelo menos duas opções.'),
});

type FormData = z.infer<typeof formSchema>;


export function FinancialSpendingForm() {
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: 'Aquisição de carro',
      options: [{ value: 'Financiamento' }, { value: 'Consórcio' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });
  
  const handleDecision = (decision: string) => {
    const { context, options } = form.getValues();
    if (!decision) return;
    
    addDecision({
      type: 'Financial Spending',
      context,
      options: options.map(o => o.value),
      decision,
    });
    toast({
      title: 'Decisão Salva',
      description: `Você escolheu "${decision}" para: ${context.substring(0, 30)}...`,
    });
    form.reset({
      context: 'Aquisição de carro',
      options: [{ value: 'Financiamento' }, { value: 'Consórcio' }],
    });
  };
  
  const onSubmit = () => {
    // Este formulário não envia para uma ação, ele apenas habilita o dropdown de decisão.
    // O próprio dropdown lida com o salvamento da decisão.
  };

  const isFormInvalid = !form.formState.isValid;
  const currentOptions = form.watch('options');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sua Decisão</CardTitle>
            <CardDescription>Descreva o contexto e as opções financeiras que você está considerando.</CardDescription>
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
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`options.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder={`Opção ${index + 1}`} {...field} />
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" disabled={isFormInvalid}>Tomar uma Decisão</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {currentOptions.map((option, index) => (
                   option.value && <DropdownMenuItem key={index} onSelect={() => handleDecision(option.value)}>
                    {option.value}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
