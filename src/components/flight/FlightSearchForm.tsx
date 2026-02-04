import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, Users, ArrowRightLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AirportSearch } from './AirportSearch';
import { useAuth } from '@/hooks/useAuth';

export function FlightSearchForm() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [flightClass, setFlightClass] = useState('economy');

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !departureDate) {
      import('sonner').then(({ toast }) => {
        toast.error('Mohon isi Kota Asal, Tujuan, dan Tanggal Keberangkatan!');
      });
      return;
    }
    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      returnDate: returnDate || '',
      passengers,
      class: flightClass,
      tripType,
    });
    
    navigate(`/flights?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="space-y-8">
      {/* Trip Type Toggle */}
      <div className="flex gap-3">
        {['one-way', 'round-trip'].map((type) => (
          <Button
            key={type}
            type="button"
            variant={tripType === type ? 'default' : 'outline'}
            onClick={() => setTripType(type as any)}
            className={`h-10 px-6 font-black uppercase text-xs border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all ${
              tripType === type ? 'border-foreground bg-primary text-primary-foreground' : 'border-foreground hover:bg-secondary'
            }`}
          >
            {type.replace('-', ' ')}
          </Button>
        ))}
      </div>

      {/* Origin & Destination */}
      <div className="space-y-4">
        <div className="grid gap-6 md:grid-cols-[1fr,auto,1fr]">
          <div className="space-y-3">
            <Label htmlFor="origin" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
              <Plane className="h-4 w-4 rotate-[-45deg] text-primary" />
              Origin City
            </Label>
            <AirportSearch 
              id="origin" 
              value={origin} 
              onChange={setOrigin} 
              placeholder="Example: CGK or MAD" 
            />
          </div>

          <div className="flex items-end justify-center pb-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="h-12 w-12 border-2 border-foreground bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all hover:bg-secondary"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-3">
            <Label htmlFor="destination" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
              <Plane className="h-4 w-4 rotate(45deg) text-primary" />
              Destination
            </Label>
            <AirportSearch 
              id="destination" 
              value={destination} 
              onChange={setDestination} 
              placeholder="Example: JED or LON" 
            />
          </div>
        </div>
      </div>

      {/* Dates, Passengers, Class */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="space-y-3">
          <Label htmlFor="departure" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Departure
          </Label>
          <Input
            id="departure"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            required
            className="border-2 border-foreground h-12 font-bold focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
          />
        </div>

        {tripType === 'round-trip' && (
          <div className="space-y-3">
            <Label htmlFor="return" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Return
            </Label>
            <Input
              id="return"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="border-2 border-foreground h-12 font-bold focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
            />
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="passengers" className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            Travelers
          </Label>
          <Select value={passengers} onValueChange={setPassengers}>
            <SelectTrigger id="passengers" className="border-2 border-foreground h-12 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-2 border-foreground rounded-none">
              {[...Array(40)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()} className="font-bold">
                  {i + 1} {(i + 1) === 1 ? 'Traveler' : 'Travelers'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="class" className="font-black uppercase text-xs tracking-widest text-muted-foreground">
            Travel Class
          </Label>
          <Select value={flightClass} onValueChange={setFlightClass}>
            <SelectTrigger id="class" className="border-2 border-foreground h-12 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-2 border-foreground rounded-none">
              <SelectItem value="economy" className="font-bold">Economy</SelectItem>
              <SelectItem value="business" className="font-bold">Business</SelectItem>
              <SelectItem value="first" className="font-bold">First Class</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Button */}
      <Button type="submit" size="lg" className="w-full h-16 text-xl font-black uppercase italic tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all border-4 border-foreground">
        <Search className="mr-3 h-6 w-6 stroke-[3px]" />
        Search Live Flights
      </Button>
    </form>
  );
}
