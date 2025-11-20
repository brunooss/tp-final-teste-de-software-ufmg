import { DecisionHistoryList } from "@/components/decision/decision-history-list";

export default function HistoryPage() {
    return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Histórico de Decisões</h1>
            <p className="text-muted-foreground">
              Revise suas decisões passadas para refletir sobre suas escolhas e aprender com elas.
            </p>
          </div>
          <DecisionHistoryList />
        </div>
      );
}
