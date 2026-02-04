import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BookingSteps } from '@/components/booking/BookingSteps';
import { PassengerForm } from '@/components/booking/PassengerForm';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { Button } from '@/components/ui/button';
import { mockFlights } from '@/data/mockData';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const BOOKING_STEPS = [
  { id: 1, label: 'Passengers' },
  { id: 2, label: 'Seats' },
  { id: 3, label: 'Baggage' },
  { id: 4, label: 'Payment' },
];

interface PassengerData {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

const emptyPassenger: PassengerData = {
  title: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  nationality: '',
  passportNumber: '',
  passportExpiry: '',
};

export default function PassengersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const flightId = searchParams.get('flightId') || '';
  const passengerCount = parseInt(searchParams.get('passengers') || '1');
  
  const flight = mockFlights.find(f => f.id === flightId);
  
  const [passengers, setPassengers] = useState<PassengerData[]>(
    Array(passengerCount).fill(null).map(() => ({ ...emptyPassenger }))
  );

  const updatePassenger = (index: number, data: PassengerData) => {
    const updated = [...passengers];
    updated[index] = data;
    setPassengers(updated);
  };

  const isValid = passengers.every(p => 
    p.title && p.firstName && p.lastName && p.dateOfBirth && 
    p.nationality && p.passportNumber && p.passportExpiry
  );

  const handleContinue = () => {
    if (!isValid) return;
    
    // Store passenger data in session storage for next steps
    sessionStorage.setItem('bookingPassengers', JSON.stringify(passengers));
    
    const params = new URLSearchParams({
      flightId,
      passengers: passengerCount.toString(),
    });
    navigate(`/booking/seats?${params.toString()}`);
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
        <BookingSteps steps={BOOKING_STEPS} currentStep={1} />

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          {/* Main Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Passenger Details</h1>
              <p className="text-muted-foreground">
                Enter details for {passengerCount} passenger{passengerCount > 1 ? 's' : ''} as shown on passport.
              </p>
            </div>

            {passengers.map((passenger, index) => (
              <PassengerForm
                key={index}
                index={index}
                data={passenger}
                onChange={(data) => updatePassenger(index, data)}
              />
            ))}

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
                disabled={!isValid}
                className="flex-1 shadow-sm"
              >
                Continue to Seat Selection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <BookingSummary
              flight={flight}
              passengers={passengers.map(p => ({
                title: p.title,
                firstName: p.firstName || 'Passenger',
                lastName: p.lastName,
              }))}
              selectedSeats={[]}
              baggageSelections={new Map()}
              baggageOptions={[]}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
