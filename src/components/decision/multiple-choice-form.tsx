'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getMultipleChoiceAdviceAction } from '@/app/actions';
import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { AiAdviceCard } from './ai-advice-card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  context: z.string().min(10, 'Please provide more context for the decision.'),
  options: z.array(z.object({ value: z.string().min(1, 'Option cannot be empty.') })).min(2, 'Please provide at least two options.'),
});

type FormData = z.infer<typeof formSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Get AI Advice
    </Button>
  );
}

export function MultipleChoiceForm() {
  const [state, formAction] = useFormState(getMultipleChoiceAdviceAction, { advice: null, error: null });
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();
  const { pending } = useFormStatus();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: '',
      options: [{ value: '' }, { value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
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
  
  const handleDecision = (decision: string) => {
    const { context, options } = form.getValues();
    if (!decision) return;
    
    addDecision({
      type: 'Multiple Choice',
      context,
      options: options.map(o => o.value),
      decision,
    });
    toast({
      title: 'Decision Saved',
      description: `You chose "${decision}" for: ${context.substring(0, 30)}...`,
    });
    form.reset();
  };

  const isFormInvalid = !form.formState.isValid;
  const currentOptions = form.watch('options');

  const customAction = (formData: FormData) => {
    const newFormData = new FormData();
    newFormData.append('context', formData.context);
    formData.options.forEach(option => {
      newFormData.append('options', option.value);
    });
    formAction(newFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(customAction)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Decision</CardTitle>
            <CardDescription>Describe the context and the choices you are considering.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision Context</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Which laptop should I buy for my new job?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Options</FormLabel>
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
                            <Input placeholder={`Option ${index + 1}`} {...field} />
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
              <Plus className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
            <SubmitButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isFormInvalid}>Make a Decision</Button>
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
        
        <AiAdviceCard advice={state.advice} isLoading={pending} />
      </form>
    </Form>
  );
}
