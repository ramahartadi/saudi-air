import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, MapPin, Star, Building2, ExternalLink, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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
  reviews_breakdown?: { name: string; positive: number; negative: number; neutral: number }[];
}

export default function HotelsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const location = searchParams.get('location') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = searchParams.get('adults') || '1';
  const rooms = searchParams.get('rooms') || '1';
  const chains = searchParams.get('chains') || '';
  
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHotels = async () => {
    setLoading(true);
    setHotels([]);
    try {
      const hotelChainsArray = chains ? chains.split(',') : [];
      
      const { data, error } = await supabase.functions.invoke('searchapi-hotels', {
        body: {
          action: 'search-hotels',
          params: { 
            location,
            checkIn,
            checkOut,
            adults,
            rooms,
            hotelChains: hotelChainsArray
          }
        }
      });

      if (error) throw error;
      
      if (data && data.properties) {
        if (data.properties.length > 0) {
          console.log('FIRST HOTEL DATA:', data.properties[0]);
        }
        // Helpful for Admin discovery of Brand IDs
        if (data.brands) {
          console.log('DISCOVERED BRANDS (Use these IDs in Admin):', data.brands);
        }
        const mappedHotels = data.properties.map((h: any) => ({
          id: h.property_token || h.data_id || Math.random().toString(36).substr(2, 9),
          name: h.name,
          description: h.description,
          price: h.price_per_night?.extracted_price || 0,
          currency: 'IDR',
          rating: h.rating,
          reviews: h.reviews,
          thumbnail: h.images?.[0]?.thumbnail || h.thumbnail,
          link: h.link,
          address: h.city ? `${h.city}, ${h.country || ''}` : '',
          hotel_class: h.extracted_hotel_class || 0,
          amenities: h.amenities || [],
          check_in_time: h.check_in_time,
          check_out_time: h.check_out_time,
          images: h.images || [],
          nearby_places: h.nearby_places || [],
          reviews_breakdown: h.reviews_breakdown || []
        }));
        setHotels(mappedHotels);
      } else {
        toast.error("Tidak ada hotel yang ditemukan.");
      }
    } catch (err: any) {
      console.error('Hotel Search Error:', err);
      toast.error('Gagal mengambil data hotel.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (hotel: Hotel) => {
    sessionStorage.setItem('selectedHotel', JSON.stringify(hotel));
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults,
      rooms
    });
    navigate(`/hotels/${hotel.id}?${params.toString()}`);
  };

  useEffect(() => {
    if (location && checkIn && checkOut) {
      fetchHotels();
    }
  }, [location, checkIn, checkOut, chains]);

  return (
    <Layout>
      <div className="container py-8 min-h-screen">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 border-2 border-foreground font-black">
          <ArrowLeft className="mr-2 h-4 w-4" /> KEMBALI KE PENCARIAN
        </Button>

        <div className="bg-white border-4 border-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">
                Menginap di {location}
              </h1>
              <p className="font-bold text-muted-foreground uppercase text-xs mt-2 bg-secondary inline-block px-2 py-1 border border-foreground">
                {checkIn} SAMPAI {checkOut} • {adults} DEWASA • {rooms} KAMAR
              </p>
              {chains && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {chains.split(',').map(c => (
                    <span key={c} className="text-[10px] font-black uppercase bg-primary text-primary-foreground px-2 py-0.5 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-black uppercase tracking-widest italic">Mengecek ketersediaan hotel...</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {hotels.length > 0 ? hotels.map((hotel) => (
              <div key={hotel.id} className="bg-white border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative h-56 border-b-4 border-foreground overflow-hidden">
                  {hotel.thumbnail ? (
                    <img src={hotel.thumbnail} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {hotel.hotel_class && (
                    <div className="absolute top-4 left-4 bg-white border-2 border-foreground px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-0.5">
                        {[...Array(hotel.hotel_class)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground border-2 border-foreground font-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {hotel.currency} {hotel.price?.toLocaleString()}<span className="text-[10px] font-bold">/malam</span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-black uppercase leading-tight mb-2 italic tracking-tighter group-hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase text-muted-foreground truncate">{hotel.address}</p>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    {hotel.rating && (
                      <div className="flex items-center gap-1">
                        <span className="bg-emerald-400 border-2 border-foreground px-1.5 py-0.5 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {hotel.rating}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{hotel.reviews} ulasan</span>
                      </div>
                    )}
                  </div>

                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-6">
                      {hotel.amenities.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[9px] font-black uppercase border-2 border-foreground bg-secondary px-1.5 py-0.5">
                          {a}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="text-[9px] font-black underline">+{hotel.amenities.length - 3} LAGI</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t-2 border-foreground border-dashed">
                    <Button 
                      onClick={() => handleViewDetail(hotel)}
                      className="w-full h-12 border-2 border-foreground bg-white text-foreground hover:bg-foreground hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] font-black uppercase italic text-xs"
                    >
                      LIHAT DETAIL <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 bg-secondary border-4 border-foreground border-dashed text-center">
                <p className="text-2xl font-black uppercase opacity-20">Tidak ada hotel yang cocok di wilayah ini.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
