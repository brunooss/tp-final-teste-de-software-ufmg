import { FinancialSpendingForm } from '@/components/decision/financial-spending-form';

export default function FinancialSpendingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Decisão de Gasto Financeiro</h1>
        <p className="text-muted-foreground">
          Compare diferentes opções financeiras, como financiamento vs. consórcio. Apresente as escolhas para tomar uma decisão informada.
        </p>
      </div>
      <FinancialSpendingForm />
    </div>
  );
}
