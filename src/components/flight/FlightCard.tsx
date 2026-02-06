import { Plane, Clock, Luggage, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all bg-white rounded-none overflow-hidden group mb-6">
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Main Info Row */}
          <div className="flex flex-col lg:flex-row p-6 items-center gap-6 lg:gap-10">
            {/* Airline */}
            <div className="flex items-center gap-3 w-full lg:w-48 shrink-0">
              <div className="h-12 w-12 border-2 border-foreground bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Plane className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight">{flight.airline}</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{flight.flightNumber}</span>
              </div>
            </div>

            {/* Departure */}
            <div className="text-center min-w-[100px]">
              <p className="text-2xl font-black font-mono leading-none mb-1">{flight.departure.time}</p>
              <p className="text-[11px] font-black uppercase">{flight.departure.airport.code}</p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase truncate max-w-[120px]">{flight.departure.airport.name}</p>
            </div>

            {/* Path */}
            <div className="flex-1 flex flex-col items-center px-4 relative">
              <span className="text-[9px] font-bold text-muted-foreground mb-1">{flight.duration}</span>
              <div className="w-full flex items-center">
                <div className="h-0.5 flex-1 bg-foreground" />
                <ArrowRight className="h-3 w-3 -ml-1 text-foreground" />
              </div>
              <span className={`text-[9px] font-black uppercase mt-1 ${flight.stops > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {flight.stops === 0 ? 'DIRECT' : `${flight.stops} STOP`}
              </span>
            </div>

            {/* Arrival */}
            <div className="text-center min-w-[100px]">
              <p className="text-2xl font-black font-mono leading-none mb-1">{flight.arrival.time}</p>
              <p className="text-[11px] font-black uppercase">{flight.arrival.airport.code}</p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase truncate max-w-[120px]">{flight.arrival.airport.name}</p>
            </div>

            {/* Badge & Radio */}
            <div className="hidden xl:flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border-2 border-foreground rounded-full">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-black">{flight.duration}</span>
              </div>
              <div className="h-6 w-6 rounded-full border-2 border-foreground flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Price & Action */}
            <div className="w-full lg:w-fit flex flex-col items-end gap-2 lg:ml-auto">
              {flight.originalPrice && flight.originalPrice > flight.price && (
                <div className="flex items-center gap-2">
                  <span className="text-xs line-through text-muted-foreground font-black italic">
                    {flight.currency} {flight.originalPrice.toLocaleString()}
                  </span>
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 uppercase italic border-2 border-foreground">
                    -{flight.discountPercent}%
                  </span>
                </div>
              )}
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black italic tracking-tighter leading-none">
                  {flight.currency} {flight.price.toLocaleString()}
                </span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase border border-muted-foreground px-2 py-0.5 mt-1 tracking-widest">
                  PER PASSENGER
                </span>
              </div>
              <Button 
                onClick={() => onSelect(flight)} 
                className="mt-2 px-8 h-12 bg-black text-white hover:bg-slate-800 font-black uppercase italic tracking-tighter rounded-none border-2 border-black active:translate-y-[2px] transition-all"
              >
                SELECT FLIGHT
              </Button>
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="border-t-2 border-foreground p-3 bg-secondary/10 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-foreground text-[9px] font-black uppercase italic">
              <Plane className="h-3 w-3" />
              {flight.aircraft || 'AIRBUS A330-900NEO'}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#E8F1FF] border border-[#0060E9] text-[#0060E9] text-[9px] font-black uppercase">
              <Luggage className="h-3 w-3" />
              BAGGAGE: {flight.baggage}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
