import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

type AiAdviceCardProps = {
  advice?: string | null;
  isLoading: boolean;
};

export function AiAdviceCard({ advice, isLoading }: AiAdviceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Conselho da IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <Card className="bg-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Lightbulb className="h-5 w-5" />
          Conselho da IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80">{advice}</p>
      </CardContent>
    </Card>
  );
}
