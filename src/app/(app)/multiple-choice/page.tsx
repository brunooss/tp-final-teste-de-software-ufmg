import { MultipleChoiceForm } from '@/components/decision/multiple-choice-form';

export default function MultipleChoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Multiple Choice Decision</h1>
        <p className="text-muted-foreground">
          For when your decision has more than two outcomes. Add your options and get AI-powered insights.
        </p>
      </div>
      <MultipleChoiceForm />
    </div>
  );
}
