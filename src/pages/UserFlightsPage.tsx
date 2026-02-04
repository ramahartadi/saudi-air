import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { FlightCard } from '@/components/flight/FlightCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Flight } from '@/types/booking';
import { Plane, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface CheapDate {
  departureDate: string;
  price: number;
  currency: string;
}

export default function UserFlightsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, isLoading: authLoading } = useAuth();
  
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const tripType = searchParams.get('tripType') || 'one-way';
  const passengers = parseInt(searchParams.get('passengers') || '1');
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [cheapDates, setCheapDates] = useState<CheapDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountRate, setDiscountRate] = useState<number | null>(null);
  const [eurRate, setEurRate] = useState<number | null>(null);

  // Protection logic
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center border-4 border-foreground bg-primary animate-bounce shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Plane className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="font-black uppercase tracking-widest text-foreground">Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (role !== 'user') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch Discount
        const { data: discData } = await supabase.from('app_settings').select('value').eq('id', 'discounts').single();
        if (discData?.value?.user !== undefined) {
          setDiscountRate(discData.value.user);
        } else {
          setDiscountRate(0);
        }

        // Fetch Currency
        const { data: currData } = await supabase.from('app_settings').select('value').eq('id', 'currency').single();
        if (currData?.value?.eurToIdr !== undefined) {
          setEurRate(currData.value.eurToIdr || 1);
        } else {
          setEurRate(1);
        }
      } catch (err) {
        console.error("Settings Fetch Error:", err);
        setDiscountRate(0);
        setEurRate(1);
      }
    };
    fetchSettings();
  }, []);

  const mapSearchApiToFlight = (offer: any): Flight => {
    const segments = offer.flights || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const durationTotal = offer.total_duration || 0;
    const hours = Math.floor(durationTotal / 60);
    const minutes = durationTotal % 60;
    const durationStr = `${hours}h ${minutes}m`;

    const rawPrice = offer.price || 0;
    // USER DISCOUNT (Strict calculation)
    const effectiveDiscount = discountRate || 0;
    const priceAfterDiscount = rawPrice * (1 - (effectiveDiscount / 100));
    
    const finalPrice = priceAfterDiscount;
    const finalOriginalPrice = rawPrice;

    return {
      id: Math.random().toString(36).substr(2, 9),
      flightNumber: firstSegment?.flight_number || 'N/A',
      airline: firstSegment?.airline || 'Unknown Airline',
      departure: {
        airport: { 
          code: firstSegment?.departure_airport?.id || '', 
          city: firstSegment?.departure_airport?.name || '', 
          name: firstSegment?.departure_airport?.name || '', 
          country: '' 
        },
        time: firstSegment?.departure_airport?.time?.split(' ')[1] || '',
        date: firstSegment?.departure_airport?.time?.split(' ')[0] || '',
      },
      arrival: {
        airport: { 
          code: lastSegment?.arrival_airport?.id || '', 
          city: lastSegment?.arrival_airport?.name || '', 
          name: lastSegment?.arrival_airport?.name || '', 
          country: '' 
        },
        time: lastSegment?.arrival_airport?.time?.split(' ')[1] || '',
        date: lastSegment?.arrival_airport?.time?.split(' ')[0] || '',
      },
      duration: durationStr,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      discountPercent: discountRate,
      currency: 'IDR',
      class: (offer.type || 'Economy').toLowerCase() as any,
      seatsAvailable: 9,
      aircraft: firstSegment?.airplane || 'N/A',
    };
  };

  const fetchSpecificFlights = async () => {
    setLoading(true);
    setFlights([]);
    try {
      const { data, error } = await supabase.functions.invoke('searchapi-flights', {
        body: {
          action: 'search-flights',
          params: { 
            origin, 
            destination, 
            date: departureDate, 
            returnDate: tripType === 'round-trip' ? returnDate : undefined,
            tripType,
            adults: 1 
          }
        }
      });
      if (error) throw error;
      
      const combinedFlights = [
        ...(data?.best_flights || []),
        ...(data?.other_flights || [])
      ];

      if (combinedFlights.length > 0) {
        const flightsData = combinedFlights.map((f: any) => mapSearchApiToFlight(f));
        setFlights(flightsData);
      }
    } catch (err: any) {
      console.error('Crash:', err);
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // TUNGGU DISKON & KURS LOADED AGAR TIDAK ADA DATA MENTAH YANG MUNCUL
    if (origin && destination && departureDate && discountRate !== null && eurRate !== null) {
      fetchSpecificFlights();
    }
  }, [origin, destination, departureDate, returnDate, tripType, discountRate, eurRate]);

  return (
    <Layout>
      <div className="container py-8 min-h-screen">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 border-2 border-foreground font-black">
          <ArrowLeft className="mr-2 h-4 w-4" /> BACK TO SEARCH
        </Button>

        <div className="bg-white border-4 border-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">
                {origin} <Plane className="h-6 w-6 inline text-primary" /> {destination}
              </h1>
              <p className="font-bold text-rose-500 uppercase text-xs mt-2 bg-secondary inline-block px-2 py-1 border border-foreground">
                Verified User Discount Activated: {discountRate}% OFF
              </p>
            </div>
          </div>
        </div>

        {loading || discountRate === null ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-black uppercase tracking-widest italic">
              {discountRate === null ? 'Loading Exclusive Deals...' : 'Calculating Your Best Price...'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {flights.map(f => (
              <FlightCard 
                key={f.id} 
                flight={f} 
                passengers={passengers}
                onSelect={(selectedFlight) => {
                  sessionStorage.setItem('selectedFlight', JSON.stringify(selectedFlight));
                  navigate(`/booking/payment?flightId=${selectedFlight.id}&passengers=${passengers}`);
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
