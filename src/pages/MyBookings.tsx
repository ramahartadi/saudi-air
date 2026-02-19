import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, Calendar, CreditCard, Loader2, ArrowRight, MapPin, Clock, Users, ChevronRight, Ticket, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MyBookings() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [flightBookings, setFlightBookings] = useState<any[]>([]);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("flights");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch Flights
        const { data: flights, error: flightError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (flightError) throw flightError;
        setFlightBookings(flights || []);

        // Fetch Hotels
        const { data: hotels, error: hotelError } = await supabase
          .from('hotel_bookings')
          .select('*, hotel_booking_guests(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (hotelError) throw hotelError;
        setHotelBookings(hotels || []);

      } catch (err) {
        console.error("Error loading bookings:", err);
        toast.error("Gagal memuat data pesanan.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, user, navigate]);

  const shouldShowLoader = authLoading || loading;

  if (shouldShowLoader) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="font-black uppercase tracking-widest italic text-sm">
            {authLoading ? "Verifying Account..." : "Syncing Travel Data..."}
          </p>
        </div>
      </Layout>
    );
  }

  const currentCount = activeTab === "flights" ? flightBookings.length : hotelBookings.length;

  return (
    <Layout>
      <div className="container py-12 min-h-screen">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">My Bookings</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] bg-secondary inline-block px-3 py-1 border-2 border-foreground">
              {currentCount} Registered {activeTab === "flights" ? "Trip" : "Stay"}{currentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Tabs defaultValue="flights" onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white p-1 border-4 border-foreground h-16 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none w-full md:w-auto">
            <TabsTrigger 
              value="flights" 
              className="flex-1 md:w-48 h-full font-black uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-0 transition-all"
            >
              <Plane className="mr-2 h-4 w-4" /> Flights
            </TabsTrigger>
            <TabsTrigger 
              value="hotels" 
              className="flex-1 md:w-48 h-full font-black uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-0 transition-all"
            >
              <Home className="mr-2 h-4 w-4" /> Hotels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="space-y-6">
            {flightBookings.length === 0 ? (
              <EmptyState type="flight" onAction={() => navigate('/')} />
            ) : (
              flightBookings.map((booking) => (
                <FlightBookingCard key={booking.id} booking={booking} navigate={navigate} />
              ))
            )}
          </TabsContent>

          <TabsContent value="hotels" className="space-y-6">
            {hotelBookings.length === 0 ? (
              <EmptyState type="hotel" onAction={() => navigate('/hotels')} />
            ) : (
              hotelBookings.map((booking) => (
                <HotelBookingCard key={booking.id} booking={booking} navigate={navigate} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function EmptyState({ type, onAction }: { type: 'flight' | 'hotel', onAction: () => void }) {
  return (
    <div className="p-20 text-center border-4 border-foreground bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {type === 'flight' ? <Plane className="h-16 w-16 mx-auto text-muted-foreground/20 mb-6" /> : <Home className="h-16 w-16 mx-auto text-muted-foreground/20 mb-6" />}
      <h2 className="text-3xl font-black uppercase italic mb-4">No {type === 'flight' ? 'Flights' : 'Hotel Stays'} Yet</h2>
      <p className="font-bold text-muted-foreground uppercase text-sm mb-8">Ready to start your next adventure?</p>
      <Button onClick={onAction} className="border-4 border-foreground h-14 px-8 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all">
        Search {type === 'flight' ? 'Flights' : 'Hotels'} Now
      </Button>
    </div>
  );
}

function FlightBookingCard({ booking, navigate }: { booking: any, navigate: any }) {
  return (
    <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden group hover:translate-y-[-4px] transition-all">
      <CardHeader className="border-b-4 border-foreground bg-slate-50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 border-4 border-foreground bg-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground">Booking Reference</p>
              <p className="text-xl font-black font-mono tracking-tighter text-primary">{booking.booking_reference}</p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Booked On</p>
            <p className="text-xs font-bold uppercase">{new Date(booking.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 md:p-8 grid md:grid-cols-[1fr,250px] gap-8">
          <div className="space-y-6">
            <FlightLeg displayLabel="Outbound" data={booking.flight_data} />
            {booking.flight_data.isRoundTrip && booking.flight_data.returnFlight && (
              <FlightLeg displayLabel="Return" data={booking.flight_data.returnFlight} isReturn />
            )}
          </div>
          <SummarySection 
            bookingId={booking.id}
            count={booking.passengers_count}
            countLabel="Travelers"
            currency={booking.flight_data.currency}
            price={booking.total_price}
            status={booking.status}
            type="flight"
            navigate={navigate}
            eticketUrl={booking.eticket_url}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HotelBookingCard({ booking, navigate }: { booking: any, navigate: any }) {
  return (
    <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden group hover:translate-y-[-4px] transition-all">
      <CardHeader className="border-b-4 border-foreground bg-slate-50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 border-4 border-foreground bg-primary flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground">Booking Reference</p>
              <p className="text-xl font-black font-mono tracking-tighter text-primary">#{booking.booking_reference}</p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Booked On</p>
            <p className="text-xs font-bold uppercase">{new Date(booking.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 md:p-8 grid md:grid-cols-[1fr,250px] gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-black uppercase text-[10px] bg-foreground text-white px-2 py-0.5">Hotel Stay</span>
                <span className="font-black uppercase text-sm truncate max-w-[200px] md:max-w-none">{booking.hotel_name}</span>
              </div>
              
              <div className="flex justify-between items-center bg-white p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Check-in</p>
                  <p className="text-2xl font-black italic tracking-tighter">{new Date(booking.check_in).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                  <p className="text-xs font-bold uppercase">{new Date(booking.check_in).getFullYear()}</p>
                </div>
                <div className="px-6">
                  <ArrowRight className="h-5 w-5 text-foreground/30" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Check-out</p>
                  <p className="text-2xl font-black italic tracking-tighter">{new Date(booking.check_out).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                  <p className="text-xs font-bold uppercase">{new Date(booking.check_out).getFullYear()}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[200px]">{booking.hotel_address}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {booking.nights_count} Night(s)
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {booking.rooms_count} Room(s)
                </div>
              </div>
            </div>
          </div>
          <SummarySection 
            bookingId={booking.id}
            count={booking.rooms_count}
            countLabel="Rooms"
            currency={booking.currency}
            price={booking.total_price}
            status={booking.status}
            type="hotel"
            navigate={navigate}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FlightLeg({ displayLabel, data, isReturn = false }: { displayLabel: string, data: any, isReturn?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-black uppercase text-[10px] ${isReturn ? 'bg-primary' : 'bg-foreground'} text-white px-2 py-0.5`}>{displayLabel}</span>
        <span className="font-black uppercase text-sm">{data.airline}</span>
        <span className="font-bold text-xs text-muted-foreground">• {data.flightNumber}</span>
      </div>

      <div className="flex justify-between items-center bg-white p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex-1">
          <p className="text-xs font-black text-muted-foreground uppercase">{data.departure.airport.city}</p>
          <p className="text-3xl font-black italic tracking-tighter">{data.departure.airport.code}</p>
          <p className="text-xs font-bold uppercase">{data.departure.time}</p>
        </div>
        <div className="px-6 flex flex-col items-center">
          <ArrowRight className={`h-5 w-5 text-foreground/30 ${isReturn ? 'rotate-180' : ''}`} />
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs font-black text-muted-foreground uppercase">{data.arrival.airport.city}</p>
          <p className="text-3xl font-black italic tracking-tighter">{data.arrival.airport.code}</p>
          <p className="text-xs font-bold uppercase">{data.arrival.time}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {data.departure.date}
        </div>
        {data.duration && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {data.duration}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-black uppercase text-muted-foreground">Status</p>
      <span className={`inline-block px-2 py-0.5 border-2 font-black text-[10px] uppercase rounded-none ${
        status === 'Success' 
          ? 'bg-emerald-100 text-emerald-700 border-emerald-700' 
          : status === 'Pending'
            ? 'bg-amber-100 text-amber-700 border-amber-700'
            : 'bg-slate-100 text-slate-700 border-slate-700'
      }`}>
        {status}
      </span>
    </div>
  );
}

function SummarySection({ bookingId, count, countLabel, currency, price, status, type, navigate, eticketUrl }: { 
  bookingId: string, 
  count: number, 
  countLabel: string, 
  currency: string, 
  price: number, 
  status: string, 
  type: 'flight' | 'hotel',
  navigate: any,
  eticketUrl?: string
}) {
  return (
    <div className="border-4 border-foreground bg-primary/5 p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black uppercase text-muted-foreground">{countLabel}</span>
          <span className="font-black uppercase text-sm">{count} {count > 1 ? (countLabel === 'Rooms' ? 'Rooms' : 'Travelers') : (countLabel === 'Rooms' ? 'Room' : 'Traveler')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-muted-foreground">{status === 'Success' ? 'Total Paid' : 'Total Amount'}</span>
          <span className="font-black text-xl text-primary">{currency || 'IDR'} {price.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {status === 'Pending' && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(type === 'flight' ? `/booking/checkout/${bookingId}` : `/booking/hotel-checkout/${bookingId}`);
            }}
            className="w-full mt-6 border-4 border-foreground h-12 font-black uppercase italic bg-amber-400 text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2"
          >
            Pay Now <CreditCard className="h-4 w-4" />
          </Button>
        )}
        {status === 'Success' && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              if (eticketUrl) window.open(eticketUrl, '_blank');
              else toast.info("Voucher sedang diproses.");
            }}
            className="w-full mt-6 border-4 border-foreground h-12 font-black uppercase italic bg-emerald-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2"
          >
            View {type === 'flight' ? 'E-Ticket' : 'Voucher'} <Ticket className="h-4 w-4" />
          </Button>
        )}
        <Button 
          onClick={() => navigate(type === 'flight' ? `/booking/detail/${bookingId}` : `/booking/hotel-confirmation?ref=${bookingId}`)}
          className={`w-full ${status === 'Pending' || status === 'Success' ? 'mt-0' : 'mt-6'} border-2 border-foreground h-12 font-black uppercase italic shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2`}
        >
          Detail <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
