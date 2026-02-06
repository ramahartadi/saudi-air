import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, Calendar, CreditCard, Loader2, ArrowRight, MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MyBookings() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  console.log("🔄 [MyBookings] useEffect triggered");

  // 1️⃣ TUNGGU AUTH SELESAI
  if (authLoading) {
    console.log("⏳ [MyBookings] Waiting for Auth to finish loading...");
    return;
  }

  // 2️⃣ JIKA TIDAK ADA USER
  if (!user) {
    console.log("🚫 [MyBookings] No user found, redirect");
    navigate('/login');
    setLoading(false);
    return;
  }

  // 3️⃣ BARU BOLEH FETCH
  const loadData = async () => {
    try {
      console.log("📡 [MyBookings] Fetching bookings for:", user.id);

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("✅ [MyBookings] Bookings fetched:", data?.length || 0);
      setBookings(data || []);
    } catch (err) {
      console.error("💥 [MyBookings] Error:", err);
    } finally {
      console.log("🏁 [MyBookings] Stop loading");
      setLoading(false);
    }
  };

  loadData();

  return () => {
    console.log("🧹 [MyBookings] Cleanup triggered");
  };
}, [authLoading, user, navigate]);


  // Loader tampil HANYA JIKA auth belum siap, 
  // ATAU kita masih dalam proses 'loading' internal dan data memang belum ada.
  const shouldShowLoader = authLoading || (loading && bookings.length === 0);

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

  return (
    <Layout>
      <div className="container py-12 min-h-screen">
        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">My Bookings</h1>
          <p className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] bg-secondary inline-block px-3 py-1 border-2 border-foreground">
            {bookings.length} Registered Trip{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="p-20 text-center border-4 border-foreground bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Plane className="h-16 w-16 mx-auto text-muted-foreground/20 mb-6" />
            <h2 className="text-3xl font-black uppercase italic mb-4">No Bookings Yet</h2>
            <p className="font-bold text-muted-foreground uppercase text-sm mb-8">Ready to start your next adventure with Saudi Airlines?</p>
            <Button onClick={() => navigate('/')} className="border-4 border-foreground h-14 px-8 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all">
              Search Flights Now
            </Button>
          </div>
        ) : (
          <div className="grid gap-8">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden group hover:translate-y-[-4px] transition-all">
                <CardHeader className="border-b-4 border-foreground bg-slate-50 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 border-4 border-foreground bg-primary flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
                        <Plane className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Booking Reference</p>
                        <p className="text-xl font-black font-mono tracking-tighter text-primary">{booking.booking_reference}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Status</p>
                        <span className={`inline-block px-2 py-0.5 border-2 font-black text-[10px] uppercase rounded-none ${
                          booking.status === 'Success' 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-700' 
                            : booking.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700 border-amber-700'
                              : 'bg-slate-100 text-slate-700 border-slate-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Booked On</p>
                        <p className="text-xs font-bold uppercase">{new Date(booking.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 md:p-8 grid md:grid-cols-[1fr,250px] gap-8">
                    {/* Flight Info */}
                    <div className="space-y-6">
                      {/* Outbound Leg */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black uppercase text-[10px] bg-foreground text-white px-2 py-0.5">Outbound</span>
                          <span className="font-black uppercase text-sm">{booking.flight_data.airline}</span>
                          <span className="font-bold text-xs text-muted-foreground">• {booking.flight_data.flightNumber}</span>
                        </div>

                        <div className="flex justify-between items-center bg-white p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex-1">
                            <p className="text-xs font-black text-muted-foreground uppercase">{booking.flight_data.departure.airport.city}</p>
                            <p className="text-3xl font-black italic tracking-tighter">{booking.flight_data.departure.airport.code}</p>
                            <p className="text-xs font-bold uppercase">{booking.flight_data.departure.time}</p>
                          </div>
                          
                          <div className="px-6 flex flex-col items-center">
                            <ArrowRight className="h-5 w-5 text-foreground/30" />
                          </div>

                          <div className="flex-1 text-right">
                            <p className="text-xs font-black text-muted-foreground uppercase">{booking.flight_data.arrival.airport.city}</p>
                            <p className="text-3xl font-black italic tracking-tighter">{booking.flight_data.arrival.airport.code}</p>
                            <p className="text-xs font-bold uppercase">{booking.flight_data.arrival.time}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {booking.flight_data.departure.date}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {booking.flight_data.duration}
                          </div>
                        </div>
                      </div>

                      {/* Return Leg */}
                      {booking.flight_data.isRoundTrip && booking.flight_data.returnFlight && (
                        <div className="space-y-4 pt-4 border-t-2 border-dashed border-foreground/10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-black uppercase text-[10px] bg-primary text-white px-2 py-0.5">Return</span>
                            <span className="font-black uppercase text-sm">{booking.flight_data.returnFlight.airline}</span>
                            <span className="font-bold text-xs text-muted-foreground">• {booking.flight_data.returnFlight.flightNumber}</span>
                          </div>

                          <div className="flex justify-between items-center bg-white p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex-1">
                              <p className="text-xs font-black text-muted-foreground uppercase">{booking.flight_data.returnFlight.departure.airport.city}</p>
                              <p className="text-3xl font-black italic tracking-tighter">{booking.flight_data.returnFlight.departure.airport.code}</p>
                              <p className="text-xs font-bold uppercase">{booking.flight_data.returnFlight.departure.time}</p>
                            </div>
                            
                            <div className="px-6 flex flex-col items-center">
                              <ArrowRight className="h-5 w-5 text-foreground/30 rotate-180" />
                            </div>

                            <div className="flex-1 text-right">
                              <p className="text-xs font-black text-muted-foreground uppercase">{booking.flight_data.returnFlight.arrival.airport.city}</p>
                              <p className="text-3xl font-black italic tracking-tighter">{booking.flight_data.returnFlight.arrival.airport.code}</p>
                              <p className="text-xs font-bold uppercase">{booking.flight_data.returnFlight.arrival.time}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-secondary px-3 py-1 border-2 border-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {booking.flight_data.returnFlight.departure.date}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary Side */}
                    <div className="border-4 border-foreground bg-primary/5 p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Travelers</span>
                          <span className="font-black uppercase text-sm">{booking.passengers_count} Person{booking.passengers_count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">{booking.status === 'Success' ? 'Total Paid' : 'Total Amount'}</span>
                          <span className="font-black text-xl text-primary">{booking.flight_data.currency} {booking.total_price.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {booking.status === 'Pending' && (
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/booking/checkout/${booking.id}`);
                            }}
                            className="w-full mt-6 border-4 border-foreground h-12 font-black uppercase italic bg-amber-400 text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2"
                          >
                            Pay Now <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          onClick={() => navigate(`/booking/detail/${booking.id}`)}
                          className={`w-full ${booking.status === 'Pending' ? 'mt-0' : 'mt-6'} border-2 border-foreground h-12 font-black uppercase italic shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all text-sm flex items-center justify-center gap-2`}
                        >
                          Detail <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
