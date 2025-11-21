import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HelpCircle, ListChecks, Banknote, Landmark, History, ArrowRight, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const tools = [
  {
    href: '/yes-no',
    label: 'Decisão Sim/Não',
    description: 'Para quando você precisa fazer uma escolha de sim ou não.',
    icon: HelpCircle,
  },
  {
    href: '/multiple-choice',
    label: 'Múltipla Escolha',
    description: 'Para quando sua decisão tem mais de duas opções.',
    icon: ListChecks,
  },
  {
    href: '/weighted-analysis',
    label: 'Análise Ponderada',
    description: 'Tome decisões complexas com base em critérios e pesos.',
    icon: Scale,
  },
  {
    href: '/financial-analysis',
    label: 'Análise Financeira',
    description: 'Analise decisões com custos fixos e variáveis.',
    icon: Banknote,
  },
  {
    href: '/financial-spending',
    label: 'Gasto Financeiro',
    description: 'Compare diferentes opções financeiras.',
    icon: Landmark,
  },
  {
    href: '/history',
    label: 'Histórico de Decisões',
    description: 'Revise suas decisões passadas.',
    icon: History,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao DataDiver. Comece selecionando uma ferramenta abaixo.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.href} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                 <tool.icon className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{tool.label}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Button asChild className="w-full">
                <Link href={tool.href}>
                  Abrir <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
