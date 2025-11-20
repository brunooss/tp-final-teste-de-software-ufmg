import { FinancialAnalysisForm } from '@/components/decision/financial-analysis-form';

export default function FinancialAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Financial Decision Analysis</h1>
        <p className="text-muted-foreground">
          Analyze decisions with fixed and variable costs. Our AI can suggest different weightings to help you see the bigger picture.
        </p>
      </div>
      <FinancialAnalysisForm />
    </div>
  );
}
