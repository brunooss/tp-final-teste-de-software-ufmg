'use client';

import { useForm, useWatch } from 'react-hook-form';
import { useFormState, useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useMemo } from 'react';
import { getFinancialSpendingAdviceAction } from '@/app/actions';
import { AiAdviceCard } from './ai-advice-card';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  context: z.string().min(10, 'Por favor, forneça mais contexto para a decisão.'),
  financing: z.object({
    totalValue: z.coerce.number().min(0, 'O valor total deve ser positivo.'),
    downPayment: z.coerce.number().min(0, 'A entrada deve ser positiva.'),
    interestRate: z.coerce.number().min(0, 'A taxa de juros deve ser positiva.'),
    installments: z.coerce.number().int().min(1, 'O número de parcelas deve ser pelo menos 1.'),
  }),
  consortium: z.object({
    totalValue: z.coerce.number().min(0, 'O valor total deve ser positivo.'),
    adminFee: z.coerce.number().min(0, 'A taxa de administração deve ser positiva.'),
    installments: z.coerce.number().int().min(1, 'O número de parcelas deve ser pelo menos 1.'),
  }),
});

type FormData = z.infer<typeof formSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Me ajude a escolher
    </Button>
  );
}

export function FinancialSpendingForm() {
  const [state, formAction] = useFormState(getFinancialSpendingAdviceAction, { advice: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const { pending } = useFormStatus();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: 'Aquisição de carro',
      financing: {
        totalValue: 50000,
        downPayment: 10000,
        interestRate: 1.5,
        installments: 48,
      },
      consortium: {
        totalValue: 50000,
        adminFee: 15,
        installments: 60,
      }
    },
  });

  const financingData = useWatch({ control: form.control, name: 'financing' });
  const consortiumData = useWatch({ control: form.control, name: 'consortium' });

  const financingTotal = useMemo(() => {
    const { totalValue, downPayment, interestRate, installments } = financingData;
    if (interestRate === 0) {
      return totalValue;
    }
    const principal = totalValue - downPayment;
    const monthlyRate = interestRate / 100;
    if (principal <= 0) return downPayment;
    
    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1);
    
    return downPayment + (monthlyPayment * installments);
  }, [financingData]);

  const consortiumTotal = useMemo(() => {
    const { totalValue, adminFee } = consortiumData;
    return totalValue * (1 + adminFee / 100);
  }, [consortiumData]);
  
  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: state.error,
      });
    }
  }, [state.error, toast]);
  
  const handleDecision = (decision: string) => {
    const { context } = form.getValues();
    
    addDecision({
      type: 'Financial Spending',
      context,
      options: ['Financiamento', 'Consórcio'],
      decision,
    });
    toast({
      title: 'Decisão Salva',
      description: `Você escolheu "${decision}" para: ${context.substring(0, 30)}...`,
    });
    state.advice = null;
  };

  const customAction = (formData: FormData) => {
    const newFormData = new FormData();
    newFormData.append('context', formData.context);
    Object.keys(formData.financing).forEach(key => {
        newFormData.append(`financing.${key}`, String(formData.financing[key as keyof typeof formData.financing]));
    });
    Object.keys(formData.consortium).forEach(key => {
        newFormData.append(`consortium.${key}`, String(formData.consortium[key as keyof typeof formData.consortium]));
    });
    formAction(newFormData);
  };
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(customAction)} className="space-y-6">
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
                    <Textarea placeholder="Ex: Comprar um carro novo." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Tabs defaultValue="financing" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="financing">Financiamento</TabsTrigger>
                <TabsTrigger value="consortium">Consórcio</TabsTrigger>
              </TabsList>
              <TabsContent value="financing">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField control={form.control} name="financing.totalValue" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Total do Bem</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="financing.downPayment" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor da Entrada</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="financing.interestRate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Taxa de Juros (% a.m.)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="financing.installments" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de Parcelas</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-lg">Custo Total Estimado:</h4>
                    <p className="text-2xl font-bold text-primary">{financingTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              </TabsContent>
              <TabsContent value="consortium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField control={form.control} name="consortium.totalValue" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Total da Carta</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="consortium.adminFee" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Taxa de Administração (%)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="consortium.installments" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de Parcelas</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-lg">Custo Total Estimado:</h4>
                    <p className="text-2xl font-bold text-primary">{consortiumTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              </TabsContent>
            </Tabs>

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <SubmitButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!form.formState.isValid} className="w-full">Tomar uma Decisão</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem onSelect={() => handleDecision('Financiamento')}>
                    Financiamento
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDecision('Consórcio')}>
                    Consórcio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
        
        <AiAdviceCard advice={state.advice} isLoading={pending} />
      </form>
    </Form>
  );
}
