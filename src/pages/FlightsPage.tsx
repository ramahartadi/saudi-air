import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { FlightCard } from '@/components/flight/FlightCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Flight } from '@/types/booking';
import { ArrowLeft, Plane, Loader2, Calendar, ShieldCheck } from 'lucide-react';
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
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);

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

  const mapSearchApiToFlight = (offer: any, managedAirlines: any[] = []): Flight => {
    const segments = offer.flights || [];
    const isRoundTrip = tripType === 'round-trip' && segments.length > 1;
    
    let outboundSegments = [];
    let returnSegments = [];

    if (isRoundTrip) {
      let foundReturn = false;
      const targetDest = destination?.toUpperCase();
      
      for (const s of segments) {
        const currentDep = s.departure_airport?.id?.toUpperCase();
        if (!foundReturn && currentDep === targetDest) {
          foundReturn = true;
        }
        if (foundReturn) returnSegments.push(s);
        else outboundSegments.push(s);
      }
      
      if (returnSegments.length === 0 && segments.length > 1) {
        let splitIdx = -1;
        for (let i = 0; i < segments.length - 1; i++) {
          if (segments[i].arrival_airport?.id?.toUpperCase() === targetDest) {
            splitIdx = i + 1;
            break;
          }
        }
        if (splitIdx !== -1) {
          outboundSegments = segments.slice(0, splitIdx);
          returnSegments = segments.slice(splitIdx);
        } else {
          outboundSegments = segments;
        }
      }
    } else {
      outboundSegments = segments;
    }

    const firstOut = outboundSegments[0];
    const lastOut = outboundSegments[outboundSegments.length - 1];
    
    const durationTotal = offer.total_duration || 0;
    const hours = Math.floor(durationTotal / 60);
    const minutes = durationTotal % 60;
    const durationStr = `${hours}h ${minutes}m`;

    const rawPrice = offer.price || 0;
    
    // Manual Baggage Logic
    const airlineCode = firstOut?.flight_number?.split(' ')[0];
    const dbAirline = managedAirlines.find(a => a.code === airlineCode);
    const manualBaggage = dbAirline?.baggage_info;

    const baseFlight: any = {
      id: Math.random().toString(36).substr(2, 9),
      flightNumber: firstOut?.flight_number || 'N/A',
      airline: dbAirline?.name || firstOut?.airline || 'Unknown Airline',
      departure: {
        airport: { 
          code: firstOut?.departure_airport?.id || '', 
          city: firstOut?.departure_airport?.name || '', 
          name: firstOut?.departure_airport?.name || '', 
          country: '' 
        },
        time: firstOut?.departure_airport?.time || '',
        date: firstOut?.departure_airport?.date || '',
      },
      arrival: {
        airport: { 
          code: lastOut?.arrival_airport?.id || '', 
          city: lastOut?.arrival_airport?.name || '', 
          name: lastOut?.arrival_airport?.name || '', 
          country: '' 
        },
        time: lastOut?.arrival_airport?.time || '',
        date: lastOut?.arrival_airport?.date || '',
      },
      duration: durationStr,
      stops: outboundSegments.length - 1,
      price: rawPrice,
      currency: 'IDR',
      class: (offer.type || 'Economy').toLowerCase() as any,
      baggage: manualBaggage || "20kg included",
      aircraft: firstOut?.airplane || 'N/A',
      extensions: firstOut?.extensions || [],
      isRoundTrip: isRoundTrip && returnSegments.length > 0,
      booking_token: offer.booking_token
    };

    if (isRoundTrip && returnSegments.length > 0) {
      const firstRet = returnSegments[0];
      const lastRet = returnSegments[returnSegments.length - 1];
      baseFlight.returnFlight = {
        flightNumber: firstRet?.flight_number || 'N/A',
        airline: firstRet?.airline || 'Unknown Airline',
        departure: {
          airport: { 
            code: firstRet?.departure_airport?.id || '', 
            city: firstRet?.departure_airport?.name || '', 
            name: firstRet?.departure_airport?.name || '', 
            country: '' 
          },
          time: firstRet?.departure_airport?.time || '',
          date: firstRet?.departure_airport?.date || '',
        },
        arrival: {
          airport: { 
            code: lastRet?.arrival_airport?.id || '', 
            city: lastRet?.arrival_airport?.name || '', 
            name: lastRet?.arrival_airport?.name || '', 
            country: '' 
          },
          time: lastRet?.arrival_airport?.time || '',
          date: lastRet?.arrival_airport?.date || '',
        },
        duration: '', 
        stops: returnSegments.length - 1,
        aircraft: firstRet?.airplane || 'N/A',
        extensions: firstRet?.extensions || [],
      };
    }
    
    return baseFlight;
  };

  const [apiError, setApiError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const fetchSpecificFlights = async () => {
    setLoading(true);
    setFlights([]);
    setApiError(null);
    try {
      console.log('Invoking SearchApi with:', { origin, destination, departureDate, tripType });
      const { data, error } = await supabase.functions.invoke('searchapi-flights', {
        body: {
          action: 'search-flights',
          params: { 
            origin: origin?.trim().toUpperCase(), 
            destination: destination?.trim().toUpperCase(), 
            date: departureDate, 
            returnDate: tripType === 'round-trip' ? returnDate : undefined,
            tripType,
            adults: 1 
          }
        }
      });
      
      if (error) {
        console.error('Supabase Function Error:', error);
        throw error;
      }
      
      if (data?.error) {
        setApiError(data.error);
        toast.error(data.error);
      }

      const combinedFlights = [
        ...(data?.best_flights || []),
        ...(data?.other_flights || [])
      ];

      if (combinedFlights.length > 0) {
        const flightsData = combinedFlights.map((f: any) => mapSearchApiToFlight(f, data.managed_airlines));
        setFlights(flightsData);
      } else if (!data?.error) {
        // Only show this if it wasn't an explicit API error
        toast.info("Penerbangan tidak ditemukan untuk rute ini.");
      }
    } catch (err: any) {
      console.error('Search Crash:', err);
      setApiError(err.message || 'Gagal terhubung ke provider pencarian.');
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlightSelect = (selectedFlight: Flight) => {
    sessionStorage.setItem('selectedFlight', JSON.stringify(selectedFlight));
    navigate(`/booking/payment?flightId=${selectedFlight.id}&passengers=${passengers}`);
  };

  const initialSearch = async () => {
    await fetchSpecificFlights();
  };

  useEffect(() => {
    // Only fetch for guests (no role) OR admins (since they stay on this page)
    const isAllowedToSearch = !role || role === 'admin';
    if (!authLoading && isAllowedToSearch && origin && destination && eurRate !== null) {
      if (departureDate) initialSearch();
      else fetchCheapestDates();
    }
  }, [role, authLoading, origin, destination, departureDate, returnDate, tripType, eurRate]);

  const fetchCheapestDates = async () => {
    setLoading(false);
    // Removed toast info to avoid clutter
  };

  // If loading auth or has a role that should be redirected, show loader
  const isRedirecting = !authLoading && (role === 'user' || role === 'agent');
  if (authLoading || isRedirecting) {
    return (
      <Layout>
        <div className="py-20 text-center flex flex-col items-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="font-black uppercase tracking-widest italic">Redirecting to Your Portal...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 min-h-screen">
        {/* Admin Debug Panel */}
        {role === 'admin' && (
          <div className="mb-6 border-4 border-dashed border-rose-500 p-4 bg-rose-50 shadow-[4px_4px_0px_0px_rgba(244,63,94,1)]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-black uppercase text-rose-600 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Admin Debug Panel
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebug(!showDebug)}
                className="h-7 text-[10px] font-black border-2 border-rose-500 hover:bg-rose-100"
              >
                {showDebug ? 'HIDE STATUS' : 'SHOW STATUS'}
              </Button>
            </div>
            {showDebug && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold uppercase mt-4 border-t-2 border-rose-200 pt-4">
                <div><span className="text-muted-foreground mr-1">Origin:</span> {origin || 'NULL'}</div>
                <div><span className="text-muted-foreground mr-1">Dest:</span> {destination || 'NULL'}</div>
                <div><span className="text-muted-foreground mr-1">Date:</span> {departureDate || 'NULL'}</div>
                <div><span className="text-muted-foreground mr-1">Role:</span> {role || 'GUEST'}</div>
                <div><span className="text-muted-foreground mr-1">EUR/IDR:</span> {eurRate || 'NULL'}</div>
                <div><span className="text-muted-foreground mr-1">Flights:</span> {flights.length}</div>
                <div><span className="text-muted-foreground mr-1">Loading:</span> {loading ? 'YES' : 'NO'}</div>
                <div className="col-span-full mt-2">
                  <span className="text-rose-600">Error State:</span> {apiError || 'NONE'}
                </div>
              </div>
            )}
          </div>
        )}

        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 border-2 border-foreground font-black">
          <ArrowLeft className="mr-2 h-4 w-4" /> BACK TO SEARCH
        </Button>

        <div className="bg-white border-4 border-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                {origin} <Plane className="h-8 w-8 text-primary" /> {destination}
              </h1>
              <p className="font-bold text-muted-foreground uppercase text-xs mt-2 bg-secondary inline-block px-2 py-1 border border-foreground">
                Public Search Mode • {tripType.toUpperCase()} • {departureDate}
              </p>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchSpecificFlights} 
                disabled={loading}
                className="border-4 border-foreground bg-primary text-primary-foreground font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh Results
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-black uppercase tracking-widest italic">Syncing with Google Network...</p>
          </div>
        ) : departureDate ? (
          flights.length > 0 ? (
            <div className="space-y-6">
              {flights.map(f => (
                <FlightCard 
                  key={f.id} 
                  flight={f} 
                  passengers={passengers}
                  onSelect={handleFlightSelect} 
                />
              ))}
            </div>
          ) : (
            <div className="py-20 bg-secondary border-4 border-foreground border-dashed text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-white border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Plane className="h-8 w-8 text-muted-foreground -rotate-45" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">No Flights Found</h3>
                <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Try different dates or search routes nearby.</p>
              </div>
              <Button onClick={() => navigate('/')} variant="outline" className="mt-2 border-2 border-foreground font-black uppercase text-xs">
                Modify Search
              </Button>
            </div>
          )
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
