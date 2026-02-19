import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, User, Download, Home, ArrowRight, MapPin } from 'lucide-react';

export default function HotelConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showGuests, setShowGuests] = useState(false);
  
  const bookingRef = searchParams.get('ref') || '';
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('hotel_bookings')
          .select('*, hotel_booking_guests(*)')
          .eq('booking_reference', bookingRef)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (err) {
        console.error("Fetch booking error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (bookingRef) fetchBooking();
  }, [bookingRef]);

  if (loading) return null;

  if (!booking) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-xl font-bold">Booking not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl min-h-screen">
        <div className="text-center mb-10">
          <div className="h-24 w-24 border-4 border-foreground bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
            <CheckCircle className="h-12 w-12 stroke-[3px]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">RESERVED!</h1>
          <p className="inline-block bg-secondary text-foreground px-4 py-1 border-2 border-foreground font-bold uppercase text-xs tracking-widest">
            Kamar Anda telah berhasil dipesan.
          </p>
        </div>

        <div className="p-8 border-4 border-foreground bg-white text-center mb-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Booking Reference</p>
          <p className="text-5xl font-black font-mono tracking-tighter text-primary">#{booking.booking_reference}</p>
          <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200 text-sm font-black uppercase text-emerald-600">
             Voucher hotel akan segera dikirim ke email Anda
          </div>
        </div>

        <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-8 border-b-4 border-foreground bg-slate-50">
               <div className="flex items-center gap-3 mb-6">
                  <div className="bg-foreground text-white p-2">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase italic leading-none">{booking.hotel_name}</h3>
                    <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {booking.hotel_address}
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 border-2 border-foreground">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 font-sans">Check-in</p>
                    <p className="font-black italic">{new Date(booking.check_in).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="bg-white p-4 border-2 border-foreground text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 font-sans">Check-out</p>
                    <p className="font-black italic">{new Date(booking.check_out).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-white border-t-4 border-foreground">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span className="font-black uppercase tracking-tight">Data Tamu</span>
                  </div>
                  <span className="text-xs font-black">{booking.hotel_booking_guests?.length} Orang</span>
               </div>
               
               <div className="space-y-2">
                 {booking.hotel_booking_guests?.map((g: any, i: number) => (
                   <div key={i} className="p-3 border-2 border-foreground bg-slate-50 font-bold text-sm">
                     {g.title} {g.first_name} {g.last_name}
                   </div>
                 ))}
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-6 mb-12">
          <Link to="/" className="flex-1">
            <Button className="w-full h-16 border-4 border-foreground font-black uppercase italic tracking-tighter shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xl">
              SELESAI
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
