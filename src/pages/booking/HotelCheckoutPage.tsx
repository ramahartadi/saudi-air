import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, Loader2, ShieldCheck, 
  ArrowRight, Landmark, QrCode, Wallet,
  Lock, CheckCircle2, Home, MapPin, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function HotelCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('hotel_bookings')
          .select('*, hotel_booking_guests(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (err) {
        console.error("Fetch booking error:", err);
        toast.error("Data booking tidak ditemukan.");
        navigate('/my-bookings');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();
  }, [id, navigate]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('midtrans-hotel-payment', {
        body: {
          bookingId: booking.id,
          customerDetails: {
            first_name: userData.user?.email?.split('@')[0] || 'Guest',
            email: userData.user?.email || '',
          }
        }
      });

      if (error) throw error;
      if (!data.token) throw new Error("Gagal mendapatkan token pembayaran");

      (window as any).snap.pay(data.token, {
        onSuccess: function(result: any) {
          toast.success("Pembayaran Berhasil!");
          navigate(`/booking/hotel-confirmation?ref=${booking.booking_reference}`);
        },
        onPending: function(result: any) {
          toast.info("Menunggu pembayaran...");
          navigate(`/my-bookings`);
        },
        onError: function(result: any) {
          toast.error("Pembayaran Gagal.");
          setIsProcessing(false);
        }
      });

    } catch (err: any) {
      toast.error("Gagal memproses pembayaran: " + err.message);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="font-black uppercase italic">Securing payment session...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 min-h-screen max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-2">Checkout Hotel</h1>
          <p className="font-bold text-muted-foreground uppercase text-xs tracking-widest bg-secondary inline-block px-4 py-1 border-2 border-foreground">
            Selesaikan pembayaran untuk reservasi kamar Anda
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr,350px]">
          <div className="space-y-6">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground border-b-4 border-foreground">
                <CardTitle className="uppercase font-black italic flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Secure Payment Gateway
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-6">
                <div className="flex justify-center gap-4 mb-2">
                   <QrCode className="h-8 w-8" />
                   <Landmark className="h-8 w-8" />
                   <CreditCard className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic">Pilih Metode Pembayaran</h3>
                  <p className="text-sm font-bold text-muted-foreground uppercase">
                    QRIS, Virtual Account, Kartu Kredit, atau E-Wallet
                  </p>
                </div>

                <Button 
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full h-20 text-2xl font-black uppercase italic tracking-tighter border-4 border-foreground bg-emerald-500 hover:bg-emerald-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : 'BAYAR SEKARANG'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
              <CardHeader className="bg-foreground text-white border-b-4 border-foreground">
                <CardTitle className="uppercase font-black italic text-sm">Review Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-slate-50 space-y-4">
                <div>
                  <h4 className="font-black uppercase italic leading-tight">{booking.hotel_name}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {booking.hotel_address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-y-2 border-slate-200 py-4 my-4">
                  <div>
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Check-in</p>
                    <p className="text-xs font-bold uppercase">{new Date(booking.check_in).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Check-out</p>
                    <p className="text-xs font-bold uppercase">{new Date(booking.check_out).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold">
                     <span>{booking.rooms_count} Kamar x {booking.nights_count} Malam</span>
                     <span>{booking.currency} {booking.total_price.toLocaleString()}</span>
                   </div>
                   <div className="pt-2 border-t-2 border-foreground flex justify-between items-end">
                      <span className="text-xs font-black uppercase">Total</span>
                      <span className="text-2xl font-black text-primary leading-none">
                        {booking.currency} {booking.total_price.toLocaleString()}
                      </span>
                   </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
