import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { FlightCard } from '@/components/flight/FlightCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Flight } from '@/types/booking';
import { ArrowLeft, Plane, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface CheapDate {
  departureDate: string;
  price: number;
  currency: string;
}

export default function FlightsPage() {
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
  const [eurRate, setEurRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('id', 'currency').single();
        if (data?.value?.eurToIdr !== undefined) {
          setEurRate(data.value.eurToIdr || 1);
        } else {
          setEurRate(1);
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
        setEurRate(1);
      }
    };
    fetchSettings();
  }, []);

  // REDIRECTION LOGIC
  useEffect(() => {
    if (!authLoading && role) {
      const params = searchParams.toString();
      if (role === 'agent') {
        navigate(`/agent/flights?${params}`, { replace: true });
      } else if (role === 'user') {
        navigate(`/user/flights?${params}`, { replace: true });
      }
    }
  }, [role, authLoading, navigate, searchParams]);

  const mapSearchApiToFlight = (offer: any): Flight => {
    const segments = offer.flights || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const durationTotal = offer.total_duration || 0;
    const hours = Math.floor(durationTotal / 60);
    const minutes = durationTotal % 60;
    const durationStr = `${hours}h ${minutes}m`;

    const rawPrice = offer.price || 0;
    const finalPrice = rawPrice;

    // Layovers processing
    const layovers = (offer.layovers || []).map((l: any) => ({
      duration: l.duration,
      name: l.name,
      id: l.id
    }));
    
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
        time: firstSegment?.departure_airport?.time || '',
        date: firstSegment?.departure_airport?.date || '',
      },
      arrival: {
        airport: { 
          code: lastSegment?.arrival_airport?.id || '', 
          city: lastSegment?.arrival_airport?.name || '', 
          name: lastSegment?.arrival_airport?.name || '', 
          country: '' 
        },
        time: lastSegment?.arrival_airport?.time || '',
        date: lastSegment?.arrival_airport?.date || '',
      },
      duration: durationStr,
      stops: segments.length - 1,
      layovers: layovers,
      price: finalPrice,
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

  const fetchCheapestDates = async () => {
    setLoading(false);
    toast.info("Cheapest dates search is not supported with SearchApi yet.");
  };

  useEffect(() => {
    if (!authLoading && !role && origin && destination && eurRate !== null) {
      if (departureDate) fetchSpecificFlights();
      else fetchCheapestDates();
    }
  }, [role, authLoading, origin, destination, departureDate, returnDate, tripType, eurRate]);

  // If loading auth or has role (waiting for redirect), show loader
  if (authLoading || role) {
    return (
      <Layout>
        <div className="py-20 text-center flex flex-col items-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="font-black uppercase tracking-widest italic">Identifying Account Tier...</p>
        </div>
      </Layout>
    );
  }

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
              <p className="font-bold text-muted-foreground uppercase text-xs mt-2 bg-secondary inline-block px-2 py-1 border border-foreground">
                Public Search Mode
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-black uppercase tracking-widest italic">Syncing with Google Network...</p>
          </div>
        ) : departureDate ? (
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
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {cheapDates.map((d, i) => (
              <div key={i} onClick={() => navigate(`/flights?origin=${origin}&destination=${destination}&departureDate=${d.departureDate}`)} className="bg-white border-2 border-foreground p-6 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Calendar className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-black mb-4 uppercase">{new Date(d.departureDate).toLocaleDateString()}</h3>
                <p className="text-xl font-black">{d.currency} {d.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
