import { Plane, Calendar, User, Luggage, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Flight, Seat, BaggageOption } from '@/types/booking';

interface PassengerData {
  title: string;
  firstName: string;
  lastName: string;
  seat?: Seat;
}

interface BookingSummaryProps {
  flight: Flight;
  passengers: PassengerData[];
  selectedSeats: Seat[];
  baggageSelections: Map<string, number>;
  baggageOptions: BaggageOption[];
  serviceFee?: number;
}

export function BookingSummary({
  flight,
  passengers,
  selectedSeats,
  baggageSelections,
  baggageOptions,
  serviceFee = 25,
}: BookingSummaryProps) {
  const flightTotal = flight.price * passengers.length;
  
  const seatsTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  
  const baggageTotal = baggageOptions.reduce((sum, opt) => {
    const count = baggageSelections.get(opt.id) || 0;
    return sum + (opt.price * count);
  }, 0);

  const subtotal = flightTotal + seatsTotal + baggageTotal;
  const total = subtotal + serviceFee;

  return (
    <Card className="border-2 border-foreground sticky top-20">
      <CardHeader className="border-b-2 border-foreground bg-secondary">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Outbound Flight Info */}
        <div className="p-4 border-b-2 border-foreground">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase bg-foreground text-white px-2 py-0.5">Outbound</span>
            <Plane className="h-4 w-4" />
            <span className="font-bold text-sm uppercase">{flight.flightNumber}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{flight.departure.airport.code}</p>
              <p className="text-xs text-muted-foreground font-mono">{flight.departure.time}</p>
            </div>
            <div className="text-center flex-1 px-2">
              <p className="text-[10px] text-muted-foreground font-bold">{flight.duration}</p>
              <div className="relative h-4 flex items-center justify-center">
                <div className="w-full h-0.5 bg-foreground/20" />
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  {[...Array(flight.stops)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground border border-white" />
                  ))}
                </div>
              </div>
              <p className={`text-[10px] font-black uppercase ${flight.stops > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{flight.arrival.airport.code}</p>
              <p className="text-xs text-muted-foreground font-mono">{flight.arrival.time}</p>
            </div>
          </div>
          
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {flight.departure.date}
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
              <Luggage className="h-3.5 w-3.5" />
              Baggage: {flight.baggage}
            </div>
          </div>
        </div>

        {/* Return Flight Info */}
        {flight.isRoundTrip && flight.returnFlight && (
          <div className="p-4 border-b-2 border-foreground bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase bg-primary text-white px-2 py-0.5">Return</span>
              <Plane className="h-4 w-4 rotate-180" />
              <span className="font-bold text-sm uppercase">{flight.returnFlight.flightNumber}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">{flight.returnFlight.departure.airport.code}</p>
                <p className="text-xs text-muted-foreground font-mono">{flight.returnFlight.departure.time}</p>
              </div>
              <div className="text-center flex-1 px-2">
                <p className="text-[10px] text-muted-foreground font-bold">{flight.returnFlight.duration || flight.duration}</p>
                <div className="relative h-4 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-foreground/20" />
                  <div className="absolute inset-0 flex items-center justify-center gap-1">
                    {[...Array(flight.returnFlight.stops)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground border border-white" />
                    ))}
                  </div>
                </div>
                <p className={`text-[10px] font-black uppercase ${flight.returnFlight.stops > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {flight.returnFlight.stops === 0 ? 'Direct' : `${flight.returnFlight.stops} Stop${flight.returnFlight.stops > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{flight.returnFlight.arrival.airport.code}</p>
                <p className="text-xs text-muted-foreground font-mono">{flight.returnFlight.arrival.time}</p>
              </div>
            </div>
            
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {flight.returnFlight.departure.date}
              </div>
            </div>
          </div>
        )}

        {/* Passengers */}
        <div className="p-4 border-b-2 border-foreground">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4" />
            <span className="font-bold text-sm uppercase">Passengers ({passengers.length})</span>
          </div>
          <div className="space-y-2">
            {passengers.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{p.title} {p.firstName} {p.lastName}</span>
                {selectedSeats[i] && (
                  <span className="font-mono text-muted-foreground">Seat {selectedSeats[i].id}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Flight × {passengers.length}</span>
            <span>{flight.currency} {flightTotal.toLocaleString()}</span>
          </div>
          
          {seatsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Seat Selection</span>
              <span>{flight.currency} {seatsTotal.toLocaleString()}</span>
            </div>
          )}
          
          {baggageTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Luggage className="h-3 w-3" />
                Extra Baggage
              </span>
              <span>{flight.currency} {baggageTotal.toLocaleString()}</span>
            </div>
          )}

          <Separator className="border-foreground" />
          
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{flight.currency} {subtotal.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Service Fee</span>
            <span>{flight.currency} {serviceFee.toLocaleString()}</span>
          </div>

          <Separator className="border-foreground" />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{flight.currency} {total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
