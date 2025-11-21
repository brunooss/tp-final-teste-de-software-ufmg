'use client';

import { useForm } from 'react-hook-form';
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


export function FinancialSpendingForm() {
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();

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
  };
  
  const onSubmit = () => {
    // A lógica de decisão está no handleDecision
  };

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
              </TabsContent>
            </Tabs>

          </CardContent>
          <CardFooter className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" disabled={!form.formState.isValid}>Tomar uma Decisão</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
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
      </form>
    </Form>
  );
}
