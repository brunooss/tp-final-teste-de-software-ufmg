'use client';

import { useDecisionHistory } from '@/hooks/use-decision-history';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { Badge } from '../ui/badge';
import type { Decision } from '@/lib/types';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">{decision.context}</CardTitle>
                <CardDescription>
                {format(parseISO(decision.date), "MMMM d, yyyy 'at' h:mm a")}
                </CardDescription>
            </div>
            <Badge variant="secondary">{decision.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {decision.type === 'Yes/No' && <p>Your choice: <span className="font-semibold">{decision.decision}</span></p>}
        {decision.type === 'Multiple Choice' && <p>Your choice: <span className="font-semibold">{decision.decision}</span></p>}
        {decision.type === 'Financial Spending' && <p>Your choice: <span className="font-semibold">{decision.decision}</span></p>}
        {decision.type === 'Financial Analysis' && (
            <div className='text-sm text-muted-foreground'>
                <p>Fixed Cost: ${decision.fixedCost.toLocaleString()}</p>
                <p>Variable Cost: ${decision.variableCost.toLocaleString()}</p>
            </div>
        )}
      </CardContent>
      {(decision.type === 'Multiple Choice' || decision.type === 'Financial Spending') && decision.options.length > 0 && (
        <CardFooter>
            <div className="text-sm">
                <p className="font-medium">Options considered:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                    {decision.options.map((opt, i) => <li key={i}>{opt}</li>)}
                </ul>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}

export function DecisionHistoryList() {
  const { history, isLoaded, clearHistory } = useDecisionHistory();

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {history.length > 0 && (
            <div className="flex justify-end">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Clear History</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your entire decision history. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
      {history.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium">No decisions yet!</h3>
            <p className="text-muted-foreground">Start using the tools and your decisions will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  );
}
