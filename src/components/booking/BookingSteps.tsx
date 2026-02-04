import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
}

interface BookingStepsProps {
  steps: Step[];
  currentStep: number;
}

export function BookingSteps({ steps, currentStep }: BookingStepsProps) {
  return (
    <nav className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 border-2 border-foreground flex items-center justify-center font-bold text-sm",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-secondary",
                    !isCompleted && !isCurrent && "bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-bold uppercase text-center hidden sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2",
                    isCompleted ? "bg-foreground" : "bg-muted"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
