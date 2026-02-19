import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Building2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

export function HotelSearchForm() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('1');
  const [rooms, setRooms] = useState('1');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [availableChains, setAvailableChains] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchHotelChains();
  }, []);

  const fetchHotelChains = async () => {
    const { data } = await supabase
      .from('hotel_chains')
      .select('id, name, brand_id')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (data) setAvailableChains(data);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !checkIn || !checkOut) {
      import('sonner').then(({ toast }) => {
        toast.error('Mohon isi Tujuan, Tanggal Check-in, dan Check-out!');
      });
      return;
    }

    // If no specific chains selected, use all available active chains
    // because the user only wants to sell those groups.
    const chainsToFilter = selectedChains.length > 0 
      ? selectedChains 
      : availableChains.map(c => (c as any).brand_id).filter(Boolean);

    const params = new URLSearchParams({
      location,
      checkIn,
      checkOut,
      adults,
      rooms,
      chains: chainsToFilter.join(',')
    });

    console.log('HOTEL SEARCH PARAMS:', Object.fromEntries(params.entries()));
    
    navigate(`/hotels?${params.toString()}`);
  };

  const toggleChain = (brandId: string) => {
    setSelectedChains(prev => 
      prev.includes(brandId) 
        ? prev.filter(c => c !== brandId) 
        : [...prev, brandId]
    );
  };

  return (
    <form onSubmit={handleSearch} className="space-y-8">
      {/* ... existing interior form grid ... */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Destination */}
        <div className="space-y-3 lg:col-span-1">
          <Label htmlFor="location" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Destination
          </Label>
          <div className="relative group">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kota atau Hotel?"
              className="border-2 border-foreground h-12 h-12 pl-10 bg-white font-bold focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
              required
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          </div>
        </div>

        {/* Check-in */}
        <div className="space-y-3">
          <Label htmlFor="checkIn" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Check-in
          </Label>
          <Input
            id="checkIn"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="border-2 border-foreground h-12 font-bold focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
            required
          />
        </div>

        {/* Check-out */}
        <div className="space-y-3">
          <Label htmlFor="checkOut" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Check-out
          </Label>
          <Input
            id="checkOut"
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="border-2 border-foreground h-12 font-bold focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
            required
          />
        </div>

        {/* Guests & Rooms */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label htmlFor="adults" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Adults
            </Label>
            <Select value={adults} onValueChange={setAdults}>
              <SelectTrigger id="adults" className="border-2 border-foreground h-12 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 border-foreground rounded-none">
                {[...Array(5)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="font-bold">
                    {i + 1} Person
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label htmlFor="rooms" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
              <Building className="h-4 w-4 text-primary" />
              Rooms
            </Label>
            <Select value={rooms} onValueChange={setRooms}>
              <SelectTrigger id="rooms" className="border-2 border-foreground h-12 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-2 border-foreground rounded-none">
                {[...Array(5)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="font-bold">
                    {i + 1} Room
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Hotel Groups Filter */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
          <Building2 className="h-4 w-4 text-primary" />
          Filter Hotel Groups (Optional)
        </Label>
        <div className="flex flex-wrap gap-2">
          {availableChains.length === 0 ? (
            <p className="text-xs font-bold text-muted-foreground italic">No hotel groups configured.</p>
          ) : (
            availableChains.map((chain: any) => (
              <Badge
                key={chain.id}
                variant={selectedChains.includes(chain.brand_id) ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 border-2 text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[-1px] hover:translate-y-[-1px] ${
                  selectedChains.includes(chain.brand_id) 
                    ? "bg-primary text-primary-foreground border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" 
                    : "bg-white border-foreground hover:bg-secondary"
                }`}
                onClick={() => toggleChain(chain.brand_id)}
              >
                {chain.name}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Search Button */}
      <Button type="submit" size="lg" className="w-full h-16 text-xl font-black uppercase italic tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all border-4 border-foreground">
        <Building2 className="mr-3 h-6 w-6 stroke-[3px]" />
        Cari Akomodasi Terbaik
      </Button>
    </form>
  );
}
