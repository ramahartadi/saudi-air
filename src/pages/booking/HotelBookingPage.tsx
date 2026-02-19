import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Lock, Check, Building2, Users, Calendar, Info, MapPin, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PassengerForm } from '@/components/booking/PassengerForm';

interface Hotel {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  address?: string;
  thumbnail?: string;
  hotel_class?: number;
}

interface GuestData {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

const emptyGuest: GuestData = {
  title: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  nationality: '',
  passportNumber: '',
  passportExpiry: '',
};

export default function HotelBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Default values from search params
  const initialAdults = parseInt(searchParams.get('adults') || '1');
  const rooms = parseInt(searchParams.get('rooms') || '1');
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';

  const [guests, setGuests] = useState<GuestData[]>(
    Array(initialAdults).fill(null).map(() => ({ ...emptyGuest }))
  );

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedHotel');
    if (stored) {
      try {
        setHotel(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored hotel", e);
      }
    }
  }, []);

  const updateGuest = (index: number, data: GuestData) => {
    const updated = [...guests];
    updated[index] = data;
    setGuests(updated);
  };

  const isFormValid = useMemo(() => {
    return guests.every(g => g.title && g.firstName && g.lastName);
  }, [guests]);

  const numberOfNights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(() => {
    if (!hotel || !hotel.price) return 0;
    return hotel.price * numberOfNights * rooms;
  }, [hotel, numberOfNights, rooms]);

  const handleBooking = async () => {
    if (!hotel) return;
    
    setIsProcessing(true);
    
    try {
      const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('process-hotel-booking', {
        body: {
          hotelData: {
            ...hotel,
            checkIn,
            checkOut,
            nights: numberOfNights,
            rooms
          },
          guestDetails: guests,
          roomsCount: rooms,
          totalPrice: totalPrice,
          adults: initialAdults
        }
      });

      if (bookingError) throw bookingError;
      if (!bookingResult?.bookingId) throw new Error("Gagal membuat data pesanan.");

      // Store in session for confirmation display
      sessionStorage.setItem('lastBooking', JSON.stringify({
        reference: bookingResult.bookingRef,
        hotel,
        checkIn,
        checkOut,
        nights: numberOfNights,
        rooms,
        guests,
        totalPrice: totalPrice,
        bookingType: 'hotel'
      }));
      
      toast.success("Pesanan diproses! Mengalihkan ke pembayaran...");
      navigate(`/booking/hotel-checkout/${bookingResult.bookingId}`);
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error("Gagal melakukan pemesanan: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hotel) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-xl font-bold uppercase italic">Informasi Hotel Tidak Ditemukan</p>
          <Button onClick={() => navigate('/hotels')} className="mt-4 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase italic">
            Kembali ke Pencarian
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">Checkout Hotel</h1>
            <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase text-xs tracking-widest bg-secondary inline-block px-2 py-1 border border-foreground">
              Konfirmasi & Pembayaran Aman
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            <div className="space-y-8">
              {/* Hotel Summary Card */}
              <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground border-b-4 border-foreground p-6">
                  <CardTitle className="uppercase font-black italic flex items-center gap-3">
                    <Building2 className="h-6 w-6" /> Detail Akomodasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-48 md:h-auto border-b-4 md:border-b-0 md:border-r-4 border-foreground bg-slate-100">
                      {hotel.thumbnail ? (
                        <img src={hotel.thumbnail} alt={hotel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-6 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-2xl font-black uppercase italic">{hotel.name}</h2>
                          {hotel.hotel_class && (
                            <div className="flex gap-0.5">
                              {[...Array(hotel.hotel_class)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                          <MapPin className="h-3 w-3" /> {hotel.address}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-secondary/20 p-4 border-2 border-foreground border-dashed">
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Check-in</p>
                          <p className="font-bold text-sm uppercase">{checkIn ? new Date(checkIn).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Check-out</p>
                          <p className="font-bold text-sm uppercase">{checkOut ? new Date(checkOut).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                        </div>
                        <div className="col-span-2 border-t-2 border-foreground/10 pt-2 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase">Durasi & Kamar</span>
                          <span className="text-xs font-bold uppercase">{numberOfNights} Malam • {rooms} Kamar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase italic flex items-center gap-2">
                  <Users className="h-5 w-5" /> Data Tamu Utama
                </h3>
                {guests.map((guest, index) => (
                  <PassengerForm
                    key={index}
                    index={index}
                    data={guest}
                    onChange={(data) => updateGuest(index, data)}
                    isHotel
                  />
                ))}
              </div>

              {/* Important Info */}
              <div className="p-6 border-4 border-foreground bg-amber-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-start gap-4">
                  <Checkbox 
                    id="confirm-data" 
                    checked={isDataConfirmed}
                    onCheckedChange={(checked) => setIsDataConfirmed(checked as boolean)}
                    className="mt-1 border-2 border-foreground data-[state=checked]:bg-primary rounded-none h-6 w-6"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="confirm-data"
                      className="text-sm font-black uppercase italic tracking-tight cursor-pointer"
                    >
                      Saya mengonfirmasi bahwa semua data tamu sudah benar
                    </label>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                      Nama tamu harus sesuai dengan kartu identitas (KTP/Passport) yang akan ditunjukkan saat check-in.
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-6 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="border-4 border-foreground h-16 px-8 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  disabled={isProcessing}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" /> KEMBALI
                </Button>
                <Button 
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isProcessing || !isFormValid || !isDataConfirmed}
                  className="flex-1 border-4 border-foreground h-16 text-xl font-black uppercase italic tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-500 hover:text-white active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isProcessing ? 'MEMPROSES...' : 'PESAN & BAYAR SEKARANG'}
                </Button>
              </div>
            </div>

            {/* Price Sidebar */}
            <div className="space-y-6">
              <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-8">
                <CardHeader className="bg-foreground text-white border-b-4 border-foreground">
                  <CardTitle className="text-sm font-black uppercase tracking-widest italic">Rincian Harga</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground uppercase tracking-tight">Kamar x {rooms}</span>
                    <span className="font-black">{hotel.currency} {hotel.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground uppercase tracking-tight">Durasi {numberOfNights} Malam</span>
                    <span className="font-black text-emerald-600">Terhitung x{numberOfNights}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-4 border-foreground border-dashed">
                    <span className="font-black uppercase italic text-lg text-primary">Total Bayar</span>
                    <div className="text-right">
                      <p className="text-2xl font-black uppercase leading-none">{hotel.currency} {totalPrice.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Sudah termasuk pajak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-4 border-4 border-foreground bg-slate-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                <Lock className="h-4 w-4 mx-auto mb-2 text-primary" />
                <p className="text-[9px] font-black uppercase italic">Enkripsi 256-bit • Pembayaran Aman via Midtrans</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tight">Konfirmasi Pesanan</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground font-bold space-y-4">
              <div className="bg-amber-100 p-4 border-2 border-foreground text-[11px] uppercase leading-tight font-black">
                Mohon pastikan nama tamu sudah sesuai identitas. Pesanan hotel tidak dapat dibatalkan atau di-refund setelah pembayaran.
              </div>
              <p className="text-[10px] uppercase text-muted-foreground italic">
                Dengan mengklik "Ya, Pesan Sekarang", Anda menyetujui syarat & ketentuan pemesanan hotel.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-4">
            <AlertDialogCancel className="border-2 border-foreground font-black uppercase h-12 rounded-none">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBooking}
              className="bg-primary text-primary-foreground border-2 border-foreground font-black uppercase h-12 px-8 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Ya, Pesan Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
