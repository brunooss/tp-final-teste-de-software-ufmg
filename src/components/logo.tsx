import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2 text-lg font-medium', className)}>
      <Compass className="h-6 w-6 text-primary" />
      <span className="font-headline">Clarity Compass</span>
    </div>
  );
}
