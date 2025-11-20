import { FinancialAnalysisForm } from '@/components/decision/financial-analysis-form';

export default function FinancialAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Análise de Decisão Financeira</h1>
        <p className="text-muted-foreground">
          Analise decisões com custos fixos e variáveis. Nossa IA pode sugerir diferentes pesos para ajudá-lo a ver o cenário completo.
        </p>
      </div>
      <FinancialAnalysisForm />
    </div>
  );
}
