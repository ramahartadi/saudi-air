import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, Loader2, ShieldCheck, 
  ArrowRight, Landmark, QrCode, Wallet,
  Lock, CheckCircle2, Plane, Luggage
} from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (err) {
        console.error("Fetch booking error:", err);
        toast.error("Format data booking tidak ditemukan.");
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
      
      const { data, error } = await supabase.functions.invoke('midtrans-payment', {
        body: {
          action: 'create-transaction',
          params: {
            bookingId: booking.id,
            amount: booking.total_price,
            customerDetails: {
              first_name: userData.user?.email?.split('@')[0] || 'Customer',
              email: userData.user?.email || '',
            },
            itemDetails: [
              {
                id: booking.flight_data.id,
                price: booking.total_price,
                quantity: 1,
                name: `Flight: ${booking.flight_data.departure.airport.city} - ${booking.flight_data.arrival.airport.city}`
              }
            ]
          }
        }
      });

      if (error) throw error;
      if (!data.token) throw new Error("Gagal mendapatkan token pembayaran");

      (window as any).snap.pay(data.token, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          toast.success("Pembayaran Berhasil!");
          navigate(`/booking/confirmation?ref=${booking.booking_reference}`);
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          toast.info("Menunggu pembayaran...");
          navigate(`/my-bookings`);
        },
        onError: function(result: any) {
          console.error('Payment error:', result);
          toast.error("Pembayaran Gagal.");
          setIsProcessing(false);
        },
        onClose: function() {
          console.log('Snap closed');
          setIsProcessing(false);
        }
      });

    } catch (err: any) {
      console.error("Payment error:", err);
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
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-2">Checkout</h1>
          <p className="font-bold text-muted-foreground uppercase text-xs tracking-widest bg-secondary inline-block px-4 py-1 border-2 border-foreground">
            Selesaikan pembayaran untuk menerbitkan tiket
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
                  <div className="h-10 w-10 border-2 border-foreground bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="h-10 w-10 border-2 border-foreground bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="h-10 w-10 border-2 border-foreground bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="h-10 w-10 border-2 border-foreground bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic">Siap untuk Membayar?</h3>
                  <p className="text-sm font-bold text-muted-foreground uppercase">
                    Klik tombol di bawah untuk memilih metode pembayaran <br />
                    (QRIS, Virtual Account, Kartu Kredit, atau E-Wallet)
                  </p>
                </div>

                <Button 
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full h-20 text-2xl font-black uppercase italic tracking-tighter border-4 border-foreground bg-emerald-500 hover:bg-emerald-600 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> MEMPROSES...</>
                  ) : (
                    <>BAYAR SEKARANG <ArrowRight className="ml-3 h-8 w-8 stroke-[3px]" /></>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-emerald-600 pt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Powered by Midtrans Secured Connection
                </div>
              </CardContent>
            </Card>
            
            <div className="p-6 border-4 border-foreground bg-slate-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex gap-4 items-center">
              <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
              <p className="text-xs font-bold leading-tight uppercase">
                Keamanan Anda adalah prioritas kami. <br />
                Seluruh transaksi dienkripsi secara aman oleh Midtrans.
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
              <CardHeader className="bg-foreground text-white border-b-4 border-foreground">
                <CardTitle className="uppercase font-black italic text-sm">Detail Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-slate-50">
                {/* Flight Summary */}
                <div className="p-6 border-b-2 border-slate-200">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-4">Penerbangan</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className="text-lg font-black font-mono leading-none">{booking.flight_data.departure.time}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{booking.flight_data.departure.airport.code}</p>
                    </div>
                    <div className="flex flex-col items-center flex-1 px-4">
                      <p className="text-[9px] font-black italic opacity-60 uppercase">{booking.flight_data.duration}</p>
                      <div className="w-full h-0.5 bg-slate-300 relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      </div>
                      <p className="text-[8px] font-black uppercase text-primary mt-1">
                        {booking.flight_data.stops === 0 ? 'Langsung' : `${booking.flight_data.stops} Transit`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black font-mono leading-none">{booking.flight_data.arrival.time}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{booking.flight_data.arrival.airport.code}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-4">
                    <div className="bg-white border-2 border-foreground px-2 py-1 text-[9px] font-black uppercase italic flex items-center gap-1">
                       <Plane className="h-3 w-3" /> {booking.flight_data.airline}
                    </div>
                    <div className="bg-blue-50 border-2 border-blue-600 text-blue-600 px-2 py-1 text-[9px] font-black uppercase italic flex items-center gap-1">
                       <Luggage className="h-3 w-3" /> Bagasi: {booking.flight_data.baggage}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Kode Booking</p>
                    <p className="font-mono font-black text-xl text-primary">{booking.booking_reference}</p>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase opacity-60">Harga Tiket ({booking.passengers_count}x)</span>
                      <span className="font-black">{booking.flight_data.currency} {booking.total_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600">
                      <span className="text-xs font-bold uppercase">Biaya Layanan</span>
                      <span className="font-black text-xs uppercase italic tracking-tighter">GRATIS</span>
                    </div>
                    <div className="pt-4 border-t-2 border-foreground flex justify-between items-end">
                      <span className="text-xs font-black uppercase">Total Bayar</span>
                      <span className="text-2xl font-black text-primary leading-none">
                        {booking.flight_data.currency} {booking.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-400 p-4 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase text-center leading-tight">
                E-tiket akan dikirim <br /> setelah booking confirmed
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
