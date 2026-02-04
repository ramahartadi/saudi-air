import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BookingSteps } from '@/components/booking/BookingSteps';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { baggageOptions } from '@/data/mockData';
import { Flight } from '@/types/booking';
import { ArrowLeft, Lock, Check, Plane, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

import { PassengerForm } from '@/components/booking/PassengerForm';

const BOOKING_STEPS = [
  { id: 1, label: 'Search' },
  { id: 2, label: 'Passengers' },
  { id: 3, label: 'Payment' },
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

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const initialPassengerCount = parseInt(searchParams.get('passengers') || '1');
  
  const [flight, setFlight] = useState<Flight | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passengerCount, setPassengerCount] = useState(initialPassengerCount);
  const [passengers, setPassengers] = useState<PassengerData[]>(
    Array(initialPassengerCount).fill(null).map(() => ({ ...emptyPassenger }))
  );

  const updatePassenger = (index: number, data: PassengerData) => {
    const updated = [...passengers];
    updated[index] = data;
    setPassengers(updated);
  };

  const isFormValid = useMemo(() => {
    return passengers.every(p => 
      p.title && p.firstName && p.lastName && p.dateOfBirth && 
      p.nationality && p.passportNumber && p.passportExpiry
    );
  }, [passengers]);

  useEffect(() => {
    // Reset passenger array if count changes
    setPassengers(Array(passengerCount).fill(null).map(() => ({ ...emptyPassenger })));
  }, [passengerCount]);

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedFlight');
    if (stored) {
      try {
        setFlight(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored flight", e);
      }
    }
  }, []);

  const totalPrice = useMemo(() => {
    if (!flight) return 0;
    return flight.price * passengerCount;
  }, [flight, passengerCount]);

  const handlePayment = async () => {
    if (!flight) return;
    
    setIsProcessing(true);
    
    try {
      // Generate booking reference
      const bookingRef = 'SB' + Math.random().toString(36).substr(2, 8).toUpperCase();
      
      const { data: bookingData, error: bookingError } = await supabase.from('bookings').insert({
        user_id: user?.id || null,
        flight_data: flight,
        passengers_count: passengerCount,
        total_price: totalPrice,
        status: 'Pending',
        booking_reference: bookingRef
      }).select().single();

      if (bookingError) {
        if (bookingError.code === '42P01') {
          toast.warning("Table 'bookings' not found. Simulating success...");
        } else {
          throw bookingError;
        }
      }

      // Insert into booking_passengers if booking record exists
      if (bookingData?.id) {
        const passengerRecords = passengers.map(p => ({
          booking_id: bookingData.id,
          title: p.title,
          first_name: p.firstName,
          last_name: p.lastName,
          date_of_birth: p.dateOfBirth,
          nationality: p.nationality,
          passport_number: p.passportNumber,
          passport_expiry: p.passportExpiry
        }));

        const { error: pError } = await supabase.from('booking_passengers').insert(passengerRecords);
        if (pError) {
          console.error("Passenger insert error:", pError);
          toast.warning("Booking created, but failed to save passenger details.");
        }

        // Send Invoice Email via Edge Function
        if (user?.email) {
          supabase.functions.invoke('send-invoice', {
            body: {
              email: user.email,
              bookingRef: bookingRef,
              flight: flight,
              passengers: passengers,
              totalPrice: totalPrice,
              status: 'Pending',
              baseUrl: window.location.origin,
              bookingId: bookingData?.id
            }
          }).then(({ error }) => {
            if (error) console.error('E-mail error:', error);
            else console.log('Invoice email triggered successfully');
          });
        }
      }
      
      // Store last booking for confirmation page
      sessionStorage.setItem('lastBooking', JSON.stringify({
        reference: bookingRef,
        flight,
        passengersCount: passengerCount,
        passengers,
        totalPrice: totalPrice,
      }));
      
      // Clear session data
      sessionStorage.removeItem('selectedFlight');
      
      toast.success("Booking locked! Proceeding to payment...");
      navigate(`/booking/checkout/${bookingData?.id}`);
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error("Failed to process booking: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!flight) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-xl font-bold">Flight not found</p>
          <Button onClick={() => navigate('/')} className="mt-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Search Flights</Button>
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
              <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Checkout</h1>
              <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest bg-secondary inline-block px-2 py-1 border border-foreground mb-4">
                Review and Confirm
              </p>
            </div>

            {/* Traveler Selection */}
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-amber-50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 border-4 border-foreground bg-primary flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Label className="font-black uppercase text-xs tracking-widest">Number of Travelers</Label>
                      <p className="text-sm font-bold text-muted-foreground">Modify seats for this booking</p>
                    </div>
                  </div>
                  
                  <Select value={passengerCount.toString()} onValueChange={(v) => setPassengerCount(parseInt(v))}>
                    <SelectTrigger className="w-full md:w-48 border-4 border-foreground h-14 font-black text-lg bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                      <SelectValue placeholder="Passengers" />
                    </SelectTrigger>
                    <SelectContent className="border-4 border-foreground rounded-none">
                      {[...Array(40)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()} className="font-black">
                          {i + 1} {i === 0 ? 'Traveler' : 'Travelers'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Forms */}
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5" />
                Traveler Details
              </h2>
              {passengers.map((passenger, index) => (
                <PassengerForm
                  key={index}
                  index={index}
                  data={passenger}
                  onChange={(data) => updatePassenger(index, data)}
                />
              ))}
            </div>

            {/* Price Confirmation */}
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <CardHeader className="border-b-4 border-foreground bg-primary text-primary-foreground">
                <CardTitle className="uppercase italic font-black flex items-center gap-3">
                  <Plane className="h-6 w-6" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-sm font-black text-muted-foreground uppercase">{flight.airline}</p>
                    <p className="text-3xl font-black uppercase text-foreground">{flight.departure.airport.city} → {flight.arrival.airport.city}</p>
                    <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">{flight.departure.date} • {flight.duration}</p>
                  </div>
                </div>

                <div className="space-y-4 border-t-2 border-foreground/10 pt-4">
                  <div className="flex justify-between font-bold">
                    <span className="text-muted-foreground uppercase text-xs">Price per Passenger</span>
                    <span>{flight.currency} {flight.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-muted-foreground uppercase text-xs">Number of Travelers</span>
                    <span className="bg-primary text-white px-2 py-0.5 text-xs font-black border border-foreground">{passengerCount}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black border-t-4 border-foreground pt-4">
                    <span className="uppercase italic">Total Amount</span>
                    <span className="text-primary">{flight.currency} {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulated Payment */}
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-foreground bg-secondary">
                <CardTitle className="flex items-center gap-2 uppercase font-black text-sm tracking-widest">
                  <Lock className="h-4 w-4" />
                  Instant Payment Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="p-8 border-4 border-foreground bg-slate-50 text-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Check className="h-12 w-12 mx-auto mb-4 text-emerald-500 stroke-[4px]" />
                  <p className="font-black uppercase text-xl mb-2 italic">Auto-Verification Active</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Payment will be processed and confirmed instantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 border-2 border-foreground bg-white">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Secure 256-bit Sync</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border-2 border-foreground bg-white">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Direct GDS Ticketing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-6 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="border-4 border-foreground h-16 px-8 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                disabled={isProcessing}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                BACK
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={isProcessing || !isFormValid}
                className="flex-1 border-4 border-foreground h-16 text-xl font-black uppercase italic tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-500 hover:text-white active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>CONFIRM & BOOK NOW</>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <BookingSummary
              flight={flight}
              passengers={passengers.map(p => ({
                title: p.title,
                firstName: p.firstName || 'Traveler',
                lastName: p.lastName,
              }))}
              selectedSeats={[]}
              baggageSelections={new Map()}
              baggageOptions={[]}
              serviceFee={0}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
