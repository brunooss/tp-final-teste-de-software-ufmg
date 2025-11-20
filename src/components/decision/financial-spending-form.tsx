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
  context: z.string().min(10, 'Please provide more context for the decision.'),
  options: z.array(z.object({ value: z.string().min(1, 'Option cannot be empty.') })).min(2, 'Please provide at least two options.'),
});

type FormData = z.infer<typeof formSchema>;


export function FinancialSpendingForm() {
  const { addDecision } = useDecisionHistory();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      context: 'Car acquisition',
      options: [{ value: 'Financing' }, { value: 'Consortium' }],
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
      title: 'Decision Saved',
      description: `You chose "${decision}" for: ${context.substring(0, 30)}...`,
    });
    form.reset({
      context: 'Car acquisition',
      options: [{ value: 'Financing' }, { value: 'Consortium' }],
    });
  };
  
  const onSubmit = () => {
    // This form doesn't submit to an action, it just enables the decision dropdown.
    // The dropdown itself handles the decision saving.
  };

  const isFormInvalid = !form.formState.isValid;
  const currentOptions = form.watch('options');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Decision</CardTitle>
            <CardDescription>Describe the context and the financial choices you are considering.</CardDescription>
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
          <CardFooter className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" disabled={isFormInvalid}>Make a Decision</Button>
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
