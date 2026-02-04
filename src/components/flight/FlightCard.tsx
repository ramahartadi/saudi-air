import { Plane, Clock, Luggage, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flight } from '@/types/booking';

interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  passengers?: number;
}

export function FlightCard({ flight, onSelect, passengers = 1 }: FlightCardProps) {
  const classLabel = {
    economy: 'Economy',
    business: 'Business',
    first: 'First Class',
  };

  return (
    <Card className="border-2 border-foreground shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Airline Info */}
          <div className="flex items-center gap-3 md:w-40">
            <div className="h-12 w-12 border-2 border-foreground bg-secondary flex items-center justify-center shrink-0">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold">{flight.airline}</p>
              <p className="text-sm text-muted-foreground font-mono">{flight.flightNumber}</p>
            </div>
          </div>

          {/* Flight Times */}
          <div className="flex-1">
            <div className="flex items-center gap-4 md:gap-8">
              {/* Departure */}
              <div className="text-center">
                <p className="text-2xl font-bold font-mono">{flight.departure.time}</p>
                <p className="text-sm font-bold">{flight.departure.airport.code}</p>
                <p className="text-xs text-muted-foreground">{flight.departure.airport.city}</p>
              </div>

              {/* Duration */}
              <div className="flex-1 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">{flight.duration}</p>
                <div className="w-full flex items-center gap-1">
                  <div className="h-0.5 flex-1 bg-foreground" />
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-black uppercase mt-1 ${flight.stops > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                  </p>
                  {flight.layovers && flight.layovers.length > 0 && (
                    <p className="text-[9px] text-muted-foreground font-bold truncate max-w-[120px]">
                      via {flight.layovers.map(l => l.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <p className="text-2xl font-bold font-mono">{flight.arrival.time}</p>
                <p className="text-sm font-bold">{flight.arrival.airport.code}</p>
                <p className="text-xs text-muted-foreground">{flight.arrival.airport.city}</p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-2 md:w-32">
            <Badge variant="outline" className="border-2">
              <Clock className="h-3 w-3 mr-1" />
              {flight.duration}
            </Badge>
            <Badge variant="secondary" className="border-2 border-foreground">
              {classLabel[flight.class]}
            </Badge>
          </div>

          {/* Price & Select */}
          <div className="flex flex-col items-end gap-3 md:w-60">
            <div className="text-right">
              {flight.originalPrice && flight.originalPrice > flight.price && (
                <div className="flex flex-col items-end gap-1 mb-2">
                  <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Limited Offer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm line-through text-muted-foreground font-bold italic">
                      {flight.currency} {flight.originalPrice.toLocaleString()}
                    </span>
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 uppercase italic border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      -{flight.discountPercent}% OFF
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black italic tracking-tighter text-primary leading-none">
                  {flight.currency} {flight.price.toLocaleString()}
                </span>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 bg-secondary border border-foreground px-2 py-0.5">
                  Per Passenger
                </span>
              </div>
            </div>
            <div className="w-full">
              <Button 
                onClick={() => onSelect(flight)} 
                className="w-full border-4 border-foreground h-14 text-lg font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:bg-primary hover:text-white active:translate-y-0 active:shadow-none transition-all"
              >
                Select Flight
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info Footer */}
        <div className="mt-4 pt-4 border-t-2 border-foreground flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary border border-foreground">
            <Plane className="h-3.5 w-3.5" />
            {flight.aircraft}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary border border-foreground text-rose-600">
            <Luggage className="h-3.5 w-3.5" />
            {flight.seatsAvailable} seats available
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
