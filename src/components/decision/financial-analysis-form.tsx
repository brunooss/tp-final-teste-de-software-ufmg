'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFinancialWeightsAction } from '@/app/actions';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  context: z.string().min(10, 'Please provide more context for the decision.'),
  fixedCost: z.coerce.number().min(0, 'Fixed cost must be a positive number.'),
  variableCost: z.coerce.number().min(0, 'Variable cost must be a positive number.'),
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
      Suggest Weights
    </Button>
  );
}

export function FinancialAnalysisForm() {
  const [state, formAction] = useFormState(getFinancialWeightsAction, { suggestions: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const { pending } = useFormStatus();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
      fixedCost: 0,
      variableCost: 0,
    },
  });

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
  }, [state.error, toast]);

  const handleSave = () => {
    form.trigger();
    if (!form.formState.isValid) return;

    const { context, fixedCost, variableCost } = form.getValues();
    addDecision({
      type: 'Financial Analysis',
      context,
      fixedCost,
      variableCost,
    });
    toast({
      title: 'Analysis Saved',
      description: `Analysis saved for: ${context.substring(0, 30)}...`,
    });
    form.reset();
  };

  const customAction = (formData: FormData) => {
    const newFormData = new FormData();
    newFormData.append('context', formData.context);
    // The other fields are not needed by the action.
    formAction(newFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(customAction)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Context</CardTitle>
            <CardDescription>Detail the financial decision and its associated costs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision Context</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Evaluating the cost of a new manufacturing process." {...field} />
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
                    <FormLabel>Fixed Cost ($)</FormLabel>
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
                    <FormLabel>Variable Cost ($ per unit)</FormLabel>
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
            <Button type="button" variant="outline" onClick={handleSave} disabled={!form.formState.isValid}>
              Save Analysis to History
            </Button>
          </CardFooter>
        </Card>
        
        {pending && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-headline">AI-Powered Scenarios</h2>
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

        {state.suggestions && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-headline">AI-Powered Scenarios</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {state.suggestions.map((suggestion: Suggestion, index: number) => (
                <Card key={index} className="bg-primary/10 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-primary">Scenario {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium">
                      <p>Fixed Cost Weight: {suggestion.fixedCostWeight.toFixed(2)}</p>
                      <p>Variable Cost Weight: {suggestion.variableCostWeight.toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-foreground/80 mt-2">{suggestion.rationale}</p>
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
