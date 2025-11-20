import { DecisionHistoryList } from "@/components/decision/decision-history-list";

export default function HistoryPage() {
    return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Decision History</h1>
            <p className="text-muted-foreground">
              Review your past decisions to reflect on your choices and learn from them.
            </p>
          </div>
          <DecisionHistoryList />
        </div>
      );
}
