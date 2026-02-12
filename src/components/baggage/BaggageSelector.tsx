import { Luggage, Check, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BaggageOption } from '@/types/booking';
import { cn } from '@/lib/utils';

interface BaggageSelectorProps {
  options: BaggageOption[];
  selectedBaggage: Map<string, number>;
  passengerCount: number;
  onBaggageChange: (optionId: string, count: number) => void;
}

export function BaggageSelector({ 
  options, 
  selectedBaggage, 
  passengerCount,
  onBaggageChange 
}: BaggageSelectorProps) {
  const getCount = (optionId: string) => selectedBaggage.get(optionId) || 0;

  const totalBaggagePrice = options.reduce((total, opt) => {
    return total + (opt.price * getCount(opt.id));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => {
          const count = getCount(option.id);
          const isIncluded = option.price === 0;
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "border-2 border-foreground transition-all",
                count > 0 && "shadow-sm"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "h-14 w-14 border-2 border-foreground flex items-center justify-center shrink-0",
                    count > 0 ? "bg-primary" : "bg-secondary"
                  )}>
                    <Luggage className={cn(
                      "h-7 w-7",
                      count > 0 && "text-primary-foreground"
                    )} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold">
                          {option.weight} kg {option.type === 'cabin' ? 'Cabin' : 'Checked'}
                        </h4>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <div className="text-right">
                        {isIncluded ? (
                          <span className="font-bold text-primary">Included</span>
                        ) : (
                          <span className="font-bold">IDR {option.price}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {isIncluded ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4" />
                          <span>Included for {passengerCount} passenger(s)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onBaggageChange(option.id, Math.max(0, count - 1))}
                            disabled={count === 0}
                            className="h-8 w-8 border-2"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-bold font-mono">{count}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onBaggageChange(option.id, Math.min(passengerCount * 2, count + 1))}
                            disabled={count >= passengerCount * 2}
                            className="h-8 w-8 border-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total */}
      <div className="p-4 border-2 border-foreground bg-secondary flex justify-between items-center">
        <span className="font-bold uppercase text-sm">Additional Baggage Total</span>
        <span className="text-xl font-bold font-mono">IDR {totalBaggagePrice.toLocaleString()}</span>
      </div>
    </div>
  );
}
