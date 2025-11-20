import { YesNoForm } from '@/components/decision/yes-no-form';

export default function YesNoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Yes/No Decision</h1>
        <p className="text-muted-foreground">
          For when you need to make a black or white choice. Enter the context and let our AI help you weigh your options.
        </p>
      </div>
      <YesNoForm />
    </div>
  );
}
