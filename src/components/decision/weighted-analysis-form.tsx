'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getWeightedSuggestionsAction, saveWeightedAnalysisAction } from '@/app/actions';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Lightbulb, Sparkles, Wand2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { calculateWeightedScores } from '@/lib/financial-calculations';

const criterionSchema = z.object({
  name: z.string().min(1, 'O nome do critério não pode estar vazio.'),
  weight: z.coerce.number().min(0, 'O peso deve ser positivo.').max(100, 'O peso não pode ser maior que 100.'),
});

const optionSchema = z.object({
  name: z.string().min(1, 'O nome da opção não pode estar vazio.'),
  scores: z.record(z.string(), z.coerce.number().min(0, 'A nota deve ser positiva.').max(10, 'A nota não pode ser maior que 10.')),
});

const formSchema = z.object({
  context: z.string().optional(),
  criteria: z.array(criterionSchema).min(1, 'Adicione pelo menos um critério.'),
  options: z.array(optionSchema).min(2, 'Adicione pelo menos duas opções.'),
}).refine(data => {
    if (data.criteria.length === 0) return true;
    const totalWeight = data.criteria.reduce((sum, crit) => sum + (crit.weight || 0), 0);
    return Math.abs(totalWeight - 100) < 0.01;
}, {
  message: 'A soma dos pesos de todos os critérios deve ser exatamente 100.',
  path: ['criteria'],
});


type FormData = z.infer<typeof formSchema>;
type Suggestion = { name: string; weight: number; rationale: string; };

function SuggestionButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <Wand2 className="mr-2 h-4 w-4" />
      Sugerir Critérios com IA
    </Button>
  );
}

export function WeightedAnalysisForm() {
  const [suggestionState, suggestionAction, isSuggestionPending] = useActionState(getWeightedSuggestionsAction, { suggestions: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
      criteria: [{ name: '', weight: 50 }, { name: '', weight: 50 }],
      options: [{ name: '', scores: {} }, { name: '', scores: {} }],
    },
    mode: 'onChange',
  });

  const { fields: criteriaFields, append: appendCriterion, remove: removeCriterion, replace: replaceCriteria } = useFieldArray({ control: form.control, name: "criteria" });
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control: form.control, name: "options" });
  
  const watchedCriteria = useWatch({ control: form.control, name: 'criteria' });
  const watchedOptions = useWatch({ control: form.control, name: 'options' });

  const totalWeight = useMemo(() => {
    return watchedCriteria.reduce((sum, crit) => sum + (Number(crit.weight) || 0), 0);
  }, [watchedCriteria]);

  const finalScores = useMemo(() => {
    return calculateWeightedScores({ criteria: watchedCriteria, options: watchedOptions });
  }, [watchedCriteria, watchedOptions]);
  
  useEffect(() => {
    if (suggestionState.error) {
      toast({ variant: 'destructive', title: 'Erro', description: suggestionState.error });
    }
    if (suggestionState.suggestions) {
        const newCriteria = suggestionState.suggestions.map((s: Suggestion) => ({name: s.name, weight: s.weight}));
        replaceCriteria(newCriteria);
        toast({ title: 'Critérios Sugeridos!', description: 'A IA sugeriu alguns critérios para você começar.' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionState]);

  const handleSave = (decision: string) => {
    if (!form.getValues('context')) {
        toast({ variant: 'destructive', title: 'Contexto Necessário', description: 'Por favor, forneça um contexto para a decisão antes de salvar.' });
        return;
    }
     const validation = formSchema.safeParse(form.getValues());
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: validation.error.flatten().formErrors[0] || "Verifique os campos do formulário.",
      });
      return;
    }

    startSavingTransition(async () => {
      const result = await saveWeightedAnalysisAction({ ...validation.data, decision });
      if (result.decision) {
        addDecision(result.decision);
        toast({
          title: 'Decisão Salva',
          description: `Sua análise para "${result.decision.context?.substring(0,30)}..." foi salva.`,
        });
        form.reset();
        suggestionState.suggestions = null;
      } else if (result.error) {
        toast({ variant: 'destructive', title: 'Erro ao Salvar', description: result.error });
      }
    });
  };

  const isDecisionDisabled = isSaving || !form.formState.isValid;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form 
            noValidate
            action={(formData) => {
                const cleanCriteria = watchedCriteria.filter(c => c.name.trim() !== '');
                const cleanOptions = watchedOptions.filter(o => o.name.trim() !== '');
                formData.set('existingCriteria', JSON.stringify(cleanCriteria));
                formData.set('existingOptions', JSON.stringify(cleanOptions));
                suggestionAction(formData);
            }} 
            className="space-y-6"
        >
            <Card>
                <CardHeader>
                    <CardTitle>1. Contexto da Decisão</CardTitle>
                    <CardDescription>Primeiro, descreva a decisão que você está tentando tomar (opcional). Isso ajudará a IA a sugerir critérios relevantes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="context"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea placeholder="Ex: Escolher qual universidade cursar." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter>
                    <SuggestionButton />
                </CardFooter>
            </Card>
        
            {isSuggestionPending && (
                <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>Buscando sugestões...</AlertTitle>
                    <AlertDescription>
                        <Skeleton className="h-4 w-3/4 mt-2" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </AlertDescription>
                </Alert>
            )}

            {suggestionState.suggestions && (
                 <Alert variant="default" className="border-primary/20 bg-primary/10">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Sugestões da IA</AlertTitle>
                    <AlertDescription>
                        <p className="mb-2">Aqui estão alguns critérios sugeridos. Você pode usá-los ou modificá-los como desejar.</p>
                        <ul className="list-disc pl-5 space-y-1 text-foreground/80">
                            {suggestionState.suggestions.map((s: Suggestion) => (
                                <li key={s.name}><strong>{s.name} (Peso: {s.weight}%)</strong>: {s.rationale.replace(/(\*\*|__)(.*?)\1/g, '$2')}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>2. Critérios e Pesos</CardTitle>
                    <CardDescription>Liste os critérios importantes para sua decisão e atribua um peso a cada um. A soma total dos pesos deve ser 100%.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {criteriaFields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-start p-3 border rounded-md relative">
                        <FormField control={form.control} name={`criteria.${index}.name`} render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Critério {index + 1}</FormLabel>
                                <FormControl><Input placeholder="Ex: Custo" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name={`criteria.${index}.weight`} render={({ field }) => (
                            <FormItem className="w-24">
                                <FormLabel>Peso (%)</FormLabel>
                                <FormControl><Input type="number" placeholder="25" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <Button type="button" variant="ghost" size="icon" onClick={() => removeCriterion(index)} disabled={criteriaFields.length <= 1} className="mt-8">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    ))}
                    <div className='flex justify-between items-center'>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendCriterion({ name: '', weight: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Critério
                        </Button>
                        <div className={`text-sm font-medium ${totalWeight !== 100 ? 'text-destructive' : 'text-primary'}`}>
                            Peso Total: {totalWeight}%
                        </div>
                    </div>
                     {form.formState.errors.criteria && <p className="text-sm font-medium text-destructive">{form.formState.errors.criteria.root?.message}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>3. Opções e Pontuações</CardTitle>
                    <CardDescription>Liste as opções que você está considerando. Em seguida, para cada opção, dê uma nota de 0 a 10 para cada um dos critérios que você definiu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {optionFields.map((optionField, optionIndex) => (
                        <div key={optionField.id} className="p-4 border rounded-md space-y-3">
                             <div className="flex gap-4 items-center">
                                <FormField control={form.control} name={`options.${optionIndex}.name`} render={({ field }) => (
                                    <FormItem className="flex-1">
                                    <FormLabel>Opção {optionIndex + 1}</FormLabel>
                                    <FormControl><Input placeholder="Ex: Universidade A" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIndex)} disabled={optionFields.length <= 2}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                            {watchedCriteria.map((criterion, criterionIndex) => (
                               criterion.name && <FormField
                                    key={`${optionField.id}-${criterion.name}`}
                                    control={form.control}
                                    name={`options.${optionIndex}.scores.${criterion.name}`}
                                    defaultValue={0}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm">{criterion.name}</FormLabel>
                                            <FormControl><Input type="number" min="0" max="10" placeholder="0-10" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                            </div>
                        </div>
                    ))}
                     <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ name: '', scores: {} })}>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
                    </Button>
                </CardContent>
            </Card>
        </form>
      </Form>
      
       {finalScores.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>4. Resultados e Decisão</CardTitle>
                <CardDescription>Com base em seus critérios e pontuações, aqui está a análise. A opção com a maior pontuação é a que melhor se alinha com suas prioridades.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Posição</TableHead>
                            <TableHead>Opção</TableHead>
                            <TableHead className="text-right">Pontuação Final</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {finalScores.map((item, index) => (
                            <TableRow key={item.name} className={index === 0 ? 'bg-primary/10' : ''}>
                                <TableCell className="font-medium">{index + 1}º</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right font-bold">{item.score.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={isDecisionDisabled}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Decisão no Histórico
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem disabled>Qual foi sua escolha final?</DropdownMenuItem>
                        {finalScores.map((item) => (
                        <DropdownMenuItem key={item.name} onSelect={() => handleSave(item.name)} disabled={isSaving}>
                            {item.name}
                        </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
