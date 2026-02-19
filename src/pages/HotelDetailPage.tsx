import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Wifi, 
  Car, 
  Wind, 
  Utensils, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Building2,
  ChevronRight,
  ChevronLeft,
  Info
} from 'lucide-react';

interface Hotel {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  link?: string;
  address?: string;
  hotel_class?: number;
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  images?: { original: string; thumbnail: string }[];
  nearby_places?: { name: string; transportations: { type: string; duration: string }[] }[];
  reviews_breakdown?: { name: string; positive: number; negative: number; neutral: number; total: number }[];
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleBookNow = () => {
    if (!hotel) return;
    const params = new URLSearchParams({
      hotelId: hotel.id,
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      adults: searchParams.get('adults') || '1',
      rooms: searchParams.get('rooms') || '1',
    });
    navigate(`/booking/hotel?${params.toString()}`);
  };

  useEffect(() => {
    const savedHotel = sessionStorage.getItem('selectedHotel');
    if (savedHotel) {
      const parsed = JSON.parse(savedHotel);
      if (parsed.id === id) {
        setHotel(parsed);
      } else {
        // In a real app, we would fetch by ID here
        navigate('/hotels');
      }
    } else {
      navigate('/hotels');
    }
  }, [id, navigate]);

  if (!hotel) return null;

  const nextImage = () => {
    if (!hotel.images) return;
    setActiveImageIndex((prev) => (prev + 1) % hotel.images!.length);
  };

  const prevImage = () => {
    if (!hotel.images) return;
    setActiveImageIndex((prev) => (prev - 1 + hotel.images!.length) % hotel.images!.length);
  };

  return (
    <Layout>
      <div className="container py-8 min-h-screen">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-8 border-2 border-foreground font-black hover:bg-foreground hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> KEMBALI KE HASIL
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Gallery & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="bg-white border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative group">
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                {hotel.images && hotel.images.length > 0 ? (
                  <>
                    <img 
                      src={hotel.images[activeImageIndex].original} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== hotel.images?.[activeImageIndex].thumbnail) {
                          target.src = hotel.images?.[activeImageIndex].thumbnail || '';
                        }
                      }}
                    />
                    <div className="absolute inset-y-0 left-4 flex items-center">
                      <Button 
                        size="icon" 
                        onClick={prevImage}
                        className="bg-white text-foreground border-2 border-foreground hover:bg-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <Button 
                        size="icon" 
                        onClick={nextImage}
                        className="bg-white text-foreground border-2 border-foreground hover:bg-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {hotel.images && hotel.images.length > 1 && (
                <div className="p-4 border-t-4 border-foreground bg-secondary/30 flex gap-2 overflow-x-auto no-scrollbar">
                  {hotel.images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative min-w-[100px] h-20 border-2 transition-all ${
                        activeImageIndex === idx ? 'border-primary scale-105 z-10' : 'border-foreground hover:border-primary opacity-70'
                      }`}
                    >
                      <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-white border-4 border-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h1 className="text-5xl font-black uppercase tracking-tighter italic">{hotel.name}</h1>
                  {hotel.hotel_class && (
                    <div className="flex gap-1 bg-foreground text-white px-2 py-1 border-2 border-foreground">
                      {[...Array(hotel.hotel_class)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <MapPin className="h-5 w-5" />
                  <p className="font-bold uppercase tracking-tight">{hotel.address}</p>
                </div>

                {hotel.description && (
                  <p className="text-lg font-medium leading-relaxed border-l-4 border-primary pl-6 py-2">
                    {hotel.description}
                  </p>
                )}
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                  <Info className="h-6 w-6 text-primary" /> AMENITIES & FASILITAS
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities?.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border-2 border-foreground bg-secondary/10 font-bold uppercase text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Places */}
              {hotel.nearby_places && hotel.nearby_places.length > 0 && (
                <div>
                  <h3 className="text-2xl font-black uppercase mb-6">TEMPAT TERDEKAT</h3>
                  <div className="space-y-4">
                    {hotel.nearby_places.map((place, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                        <span className="font-black uppercase italic">{place.name}</span>
                        <div className="flex gap-4">
                          {place.transportations.map((t, tidx) => (
                            <span key={tidx} className="text-[10px] font-bold bg-secondary px-2 py-1 border-2 border-foreground flex items-center gap-1">
                              {t.type === 'Taxi' ? <Car className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {t.duration}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Booking Sidebar */}
          <div className="space-y-8">
            <div className="bg-white border-4 border-foreground p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sticky top-8">
              <div className="mb-8 p-6 bg-primary text-primary-foreground border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-80">Mulai dari</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{hotel.currency} {hotel.price?.toLocaleString()}</span>
                  <span className="text-sm font-bold opacity-80">/malam</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 border-2 border-foreground bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase">Check-in</span>
                  </div>
                  <span className="text-[10px] font-bold">{hotel.check_in_time || '14:00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 border-2 border-foreground bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase">Check-out</span>
                  </div>
                  <span className="text-[10px] font-bold">{hotel.check_out_time || '12:00'}</span>
                </div>
              </div>

              {hotel.rating && (
                <div className="mb-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black italic">{hotel.rating}/5</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{hotel.reviews} ulasan asli</span>
                    </div>
                    <div className="bg-emerald-400 text-foreground border-2 border-foreground px-3 py-1 font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      Sempurna
                    </div>
                  </div>
                  
                  {hotel.reviews_breakdown && (
                    <div className="space-y-2 pt-4 border-t-2 border-foreground border-dashed">
                      {hotel.reviews_breakdown.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span>{item.name}</span>
                            <span>{Math.round((item.positive / (item.total || 1)) * 100)}%</span>
                          </div>
                          <div className="h-2 w-full bg-secondary border-2 border-foreground">
                            <div 
                              className="h-full bg-emerald-400" 
                              style={{ width: `${(item.positive / (item.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleBookNow}
                className="w-full h-16 border-4 border-foreground bg-primary text-primary-foreground hover:bg-white hover:text-foreground transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] font-black uppercase italic text-lg"
              >
                Pesan Sekarang <ChevronRight className="ml-2 h-6 w-6" />
              </Button>

              <p className="mt-4 text-[10px] font-bold text-center text-muted-foreground uppercase italic px-4">
                Konfirmasi instan • Jaminan harga terbaik • Pembayaran aman
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
