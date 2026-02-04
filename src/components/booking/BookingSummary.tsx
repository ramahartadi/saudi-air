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
        {/* Flight Info */}
        <div className="p-4 border-b-2 border-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Plane className="h-4 w-4" />
            <span className="font-bold text-sm uppercase">{flight.flightNumber}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{flight.departure.airport.code}</p>
              <p className="text-xs text-muted-foreground">{flight.departure.time}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{flight.duration}</p>
              <div className="w-16 h-0.5 bg-foreground my-1" />
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{flight.arrival.airport.code}</p>
              <p className="text-xs text-muted-foreground">{flight.arrival.time}</p>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {flight.departure.date}
          </div>
        </div>

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
