import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BookingSteps } from '@/components/booking/BookingSteps';
import { BaggageSelector } from '@/components/baggage/BaggageSelector';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { Button } from '@/components/ui/button';
import { mockFlights, baggageOptions } from '@/data/mockData';
import { Seat } from '@/types/booking';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const BOOKING_STEPS = [
  { id: 1, label: 'Passengers' },
  { id: 2, label: 'Seats' },
  { id: 3, label: 'Baggage' },
  { id: 4, label: 'Payment' },
];

export default function BaggagePage() {
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

  const storedSeats: Seat[] = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('bookingSeats') || '[]');
    } catch {
      return [];
    }
  }, []);

  const [baggageSelections, setBaggageSelections] = useState<Map<string, number>>(new Map());

  const handleBaggageChange = (optionId: string, count: number) => {
    const updated = new Map(baggageSelections);
    if (count === 0) {
      updated.delete(optionId);
    } else {
      updated.set(optionId, count);
    }
    setBaggageSelections(updated);
  };

  const handleContinue = () => {
    const baggageArray = Array.from(baggageSelections.entries());
    sessionStorage.setItem('bookingBaggage', JSON.stringify(baggageArray));
    
    const params = new URLSearchParams({
      flightId,
      passengers: passengerCount.toString(),
    });
    navigate(`/booking/payment?${params.toString()}`);
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
        <BookingSteps steps={BOOKING_STEPS} currentStep={3} />

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          {/* Main Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Add Extra Baggage</h1>
              <p className="text-muted-foreground">
                Add additional baggage for your journey. Each passenger includes one 7kg carry-on bag.
              </p>
            </div>

            <BaggageSelector
              options={baggageOptions}
              selectedBaggage={baggageSelections}
              passengerCount={passengerCount}
              onBaggageChange={handleBaggageChange}
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
                Continue to Payment
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
              selectedSeats={storedSeats}
              baggageSelections={baggageSelections}
              baggageOptions={baggageOptions}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
