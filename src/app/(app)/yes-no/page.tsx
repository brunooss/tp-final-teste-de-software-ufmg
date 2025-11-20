import { YesNoForm } from '@/components/decision/yes-no-form';

export default function YesNoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Decisão Sim/Não</h1>
        <p className="text-muted-foreground">
          Para quando você precisa fazer uma escolha de sim ou não. Insira o contexto e deixe nossa IA ajudá-lo a ponderar suas opções.
        </p>
      </div>
      <YesNoForm />
    </div>
  );
}
