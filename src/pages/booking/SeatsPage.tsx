import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BookingSteps } from '@/components/booking/BookingSteps';
import { SeatMap } from '@/components/seat/SeatMap';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { Button } from '@/components/ui/button';
import { mockFlights, generateSeatMap } from '@/data/mockData';
import { Seat } from '@/types/booking';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const BOOKING_STEPS = [
  { id: 1, label: 'Passengers' },
  { id: 2, label: 'Seats' },
  { id: 3, label: 'Baggage' },
  { id: 4, label: 'Payment' },
];

export default function SeatsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const flightId = searchParams.get('flightId') || '';
  const passengerCount = parseInt(searchParams.get('passengers') || '1');
  
  const flight = mockFlights.find(f => f.id === flightId);
  
  const storedPassengers = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('bookingPassengers') || '[]');
    } catch {
      return [];
    }
  }, []);

  const seats = useMemo(() => generateSeatMap(), []);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  const handleSeatSelect = (seat: Seat) => {
    if (selectedSeats.some(s => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else if (selectedSeats.length < passengerCount) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleContinue = () => {
    sessionStorage.setItem('bookingSeats', JSON.stringify(selectedSeats));
    
    const params = new URLSearchParams({
      flightId,
      passengers: passengerCount.toString(),
    });
    navigate(`/booking/baggage?${params.toString()}`);
  };

  if (!flight) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-xl font-bold">Flight not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">Search Flights</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <BookingSteps steps={BOOKING_STEPS} currentStep={2} />

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          {/* Main Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Select Your Seats</h1>
              <p className="text-muted-foreground">
                Choose {passengerCount} seat{passengerCount > 1 ? 's' : ''} for your journey. 
                Selected: {selectedSeats.length}/{passengerCount}
              </p>
            </div>

            <SeatMap
              seats={seats}
              selectedSeats={selectedSeats}
              maxSelectable={passengerCount}
              onSeatSelect={handleSeatSelect}
            />

            {/* Navigation */}
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="border-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleContinue}
                className="flex-1 shadow-sm"
              >
                {selectedSeats.length === 0 ? 'Skip Seat Selection' : 'Continue to Baggage'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <BookingSummary
              flight={flight}
              passengers={storedPassengers.map((p: any) => ({
                title: p.title,
                firstName: p.firstName || 'Passenger',
                lastName: p.lastName,
              }))}
              selectedSeats={selectedSeats}
              baggageSelections={new Map()}
              baggageOptions={[]}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
