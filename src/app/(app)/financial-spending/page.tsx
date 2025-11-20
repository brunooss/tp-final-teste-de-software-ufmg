import { FinancialSpendingForm } from '@/components/decision/financial-spending-form';

export default function FinancialSpendingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Financial Spending Decision</h1>
        <p className="text-muted-foreground">
          Compare different financial options like financing vs. a consortium loan. Lay out the choices to make an informed decision.
        </p>
      </div>
      <FinancialSpendingForm />
    </div>
  );
}
