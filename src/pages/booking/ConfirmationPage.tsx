import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Plane, Calendar, User, Download, Home, ArrowRight } from 'lucide-react';

export default function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [showPassengers, setShowPassengers] = useState(false);
  const [ticketEta, setTicketEta] = useState<string | null>(null);
  
  const bookingRef = searchParams.get('ref') || '';

  const booking = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('lastBooking') || 'null');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchAirlineEta = async () => {
      if (!booking?.flight?.flightNumber) return;
      
      try {
        // Extract airline code from flight number (first 2 chars)
        const airlineCode = booking.flight.flightNumber.substring(0, 2).toUpperCase();
        
        const { data, error } = await supabase
          .from('managed_airlines')
          .select('ticket_eta')
          .eq('code', airlineCode)
          .single();
        
        if (error) throw error;
        if (data?.ticket_eta) {
          setTicketEta(data.ticket_eta);
        }
      } catch (err) {
        console.error("Error fetching airline ETA:", err);
        // Default to 1x24 if not found
        setTicketEta('1x24 jam');
      }
    };

    if (booking) {
      fetchAirlineEta();
    }
  }, [booking]);

  if (!booking) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-xl font-bold">Booking not found</p>
          <Button onClick={() => navigate('/')} className="mt-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Search Flights</Button>
        </div>
      </Layout>
    );
  }

  const isHotel = booking.type === 'hotel';
  const currency = isHotel ? (booking.hotel?.currency || 'IDR') : (booking.flight?.currency || 'IDR');

  return (
    <Layout>
      <div className="container py-8 max-w-2xl min-h-screen">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="h-24 w-24 border-4 border-foreground bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
            <CheckCircle className="h-12 w-12 stroke-[3px]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">Confirmed!</h1>
          <p className="inline-block bg-secondary text-foreground px-4 py-1 border-2 border-foreground font-bold uppercase text-xs tracking-widest">
            {isHotel ? 'Your hotel stay is reserved.' : 'Your seat on the sky is reserved.'}
          </p>
        </div>

        {/* Booking Reference */}
        <div className="p-8 border-4 border-foreground bg-white text-center mb-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform hover:rotate-1 transition-transform">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Booking Reference</p>
          <p className="text-5xl font-black font-mono tracking-tighter text-primary">{booking.reference}</p>
          
          {!isHotel && ticketEta && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-2 border-2 border-emerald-600 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]">
                Tiket akan terbit dalam sekitar 1x24 jam kedepan
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-3 italic">
                *Estimasi waktu sesuai ketentuan maskapai {booking.flight.airline} ({ticketEta})
              </p>
            </div>
          )}

          {isHotel && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-2 border-2 border-emerald-600 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]">
                Voucher hotel akan segera dikirim melalui email
              </p>
            </div>
          )}
        </div>

        {/* Booking Details Card */}
        <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 overflow-hidden">
          <CardContent className="p-0">
            {isHotel ? (
              /* Hotel Info */
              <div className="p-8 border-b-4 border-foreground bg-slate-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-foreground text-white p-2">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black uppercase text-sm leading-none">
                      {booking.hotel.name}
                    </p>
                    <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider mt-1">{booking.hotel.address}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Check-in</p>
                    <p className="font-black italic">{booking.hotel.checkIn ? new Date(booking.hotel.checkIn).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                  </div>
                  <div className="bg-white p-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Check-out</p>
                    <p className="font-black italic">{booking.hotel.checkOut ? new Date(booking.hotel.checkOut).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm font-black uppercase">
                  <span>{booking.hotel.rooms} Room(s) • {booking.hotel.nights} Night(s)</span>
                </div>
              </div>
            ) : (
              /* Flight Info */
              <div className="p-8 border-b-4 border-foreground bg-slate-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-foreground text-white p-2">
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black uppercase text-sm leading-none">
                      {booking.flight.airline} {booking.flight.isRoundTrip && "(Round Trip)"}
                    </p>
                    <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider mt-1">{booking.flight.flightNumber}</p>
                  </div>
                </div>

                {/* Outbound Leg */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div>
                      <p className="text-3xl font-black italic">{booking.flight.departure.airport.code}</p>
                      <p className="text-xs font-bold uppercase text-muted-foreground">{booking.flight.departure.time}</p>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{booking.flight.duration}</p>
                      <div className="w-full h-1 bg-foreground relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-foreground px-1 py-0.5 text-[8px] font-black uppercase">
                          {booking.flight.stops === 0 ? 'DIRECT' : `${booking.flight.stops} STOP`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black italic">{booking.flight.arrival.airport.code}</p>
                      <p className="text-xs font-bold uppercase text-muted-foreground">{booking.flight.arrival.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-black uppercase mb-4">
                    <Calendar className="h-4 w-4 text-primary" />
                    {booking.flight.departure.date}
                  </div>
                </div>

                {/* Return Leg */}
                {booking.flight.isRoundTrip && booking.flight.returnFlight && (
                  <div className="mt-8 pt-8 border-t-4 border-dashed border-foreground/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-primary text-white p-2">
                        <Plane className="h-5 w-5 rotate-180" />
                      </div>
                      <div>
                        <p className="font-black uppercase text-sm leading-none">Return Flight</p>
                        <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider mt-1">{booking.flight.returnFlight.flightNumber}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-white p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div>
                        <p className="text-3xl font-black italic">{booking.flight.returnFlight.departure.airport.code}</p>
                        <p className="text-xs font-bold uppercase text-muted-foreground">{booking.flight.returnFlight.departure.time}</p>
                      </div>
                      <div className="flex-1 px-4 flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{booking.flight.returnFlight.duration || booking.flight.duration}</p>
                        <div className="w-full h-1 bg-primary relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-primary px-1 py-0.5 text-[8px] font-black uppercase">
                            {booking.flight.returnFlight.stops === 0 ? 'DIRECT' : `${booking.flight.returnFlight.stops} STOP`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black italic">{booking.flight.returnFlight.arrival.airport.code}</p>
                        <p className="text-xs font-bold uppercase text-muted-foreground">{booking.flight.returnFlight.arrival.time}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm font-black uppercase">
                      <Calendar className="h-4 w-4 text-primary" />
                      {booking.flight.returnFlight.departure.date}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-8 border-t-4 border-foreground flex items-center justify-between">
              <div className="text-right flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Total Paid</p>
                <p className="text-3xl font-black text-primary italic leading-none">{currency} {booking.totalPrice?.toLocaleString() || '0'}</p>
              </div>
            </div>

            {/* Passengers */}
            <div className="p-8 bg-white">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-primary" />
                <span className="font-black uppercase tracking-tight">Passenger Data</span>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowPassengers(!showPassengers)}
                  className="w-full flex justify-between items-center p-4 border-2 border-foreground bg-secondary font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all"
                >
                  <span>Count ({booking.passengersCount})</span>
                  <span className="flex items-center gap-2">
                    {showPassengers ? 'Hide List' : 'Traveler List'} 
                    <ArrowRight className={`h-4 w-4 transition-transform ${showPassengers ? 'rotate-90' : ''}`} />
                  </span>
                </button>

                {showPassengers && booking.passengers && (
                  <div className="animate-in slide-in-from-top duration-200 space-y-2 mt-4">
                    {booking.passengers.map((p: any, i: number) => (
                      <div key={i} className="p-4 border-2 border-foreground bg-white flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Traveler {i + 1}</p>
                          <p className="font-bold text-sm mt-1">{p.title} {p.firstName} {p.lastName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Passport</p>
                          <p className="font-mono font-bold text-xs mt-1">{p.passportNumber || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-6 mb-12">
          <Button 
            variant="outline" 
            className="flex-1 h-16 border-4 border-foreground font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all"
            onClick={() => window.print()}
          >
            <Download className="mr-2 h-5 w-5" />
            PRINT TICKET
          </Button>
          <Link to="/" className="flex-1">
            <Button className="w-full h-16 border-4 border-foreground font-black uppercase italic tracking-tighter shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all text-xl">
              <Home className="mr-2 h-6 w-6" />
              FINISH
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
