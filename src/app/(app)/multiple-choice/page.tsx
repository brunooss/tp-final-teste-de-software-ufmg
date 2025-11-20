import { MultipleChoiceForm } from '@/components/decision/multiple-choice-form';

export default function MultipleChoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Decisão de Múltipla Escolha</h1>
        <p className="text-muted-foreground">
          Para quando sua decisão tem mais de duas opções. Adicione suas opções e obtenha insights com IA.
        </p>
      </div>
      <MultipleChoiceForm />
    </div>
  );
}
