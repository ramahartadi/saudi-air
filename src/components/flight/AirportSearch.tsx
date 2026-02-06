import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Plane, Loader2, MapPin } from 'lucide-react';

interface AirportSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id: string;
}

export function AirportSearch({ value, onChange, placeholder, id }: AirportSearchProps) {
  const [keyword, setKeyword] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.length >= 2) {
        searchAirports();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAirports = async () => {
    if (keyword.length < 2) return;
    setLoading(true);
    setIsOpen(true);
    
    try {
      const { data, error } = await supabase
        .from('airports')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${keyword}%,city_name.ilike.%${keyword}%,iata_code.ilike.%${keyword}%`)
        .limit(10);

      if (error) throw error;
      
      const mappedResults = data?.map(a => ({
        id: a.id,
        name: a.name,
        iataCode: a.iata_code,
        address: {
          cityName: a.city_name,
          countryName: a.country_name
        }
      })) || [];

      setResults(mappedResults);
    } catch (err) {
      console.error('Airport fetch error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (airport: any) => {
    onChange(airport.iataCode);
    setKeyword(`${airport.name} (${airport.iataCode})`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative group">
        <Input
          id={id}
          value={keyword}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setKeyword(val);
            setIsOpen(true);
            // Jika user mengetik 3 huruf (Format IATA), kita anggap itu kodenya
            if (val.length === 3) {
              onChange(val);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="border-2 border-foreground h-12 pl-10 bg-white font-bold placeholder:text-muted-foreground focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
      </div>

      {isOpen && (keyword.length >= 2 || results.length > 0) && (
        <div className="absolute z-[100] w-full mt-2 bg-white border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-72 overflow-y-auto rounded-none">
          {loading && results.length === 0 ? (
            <div className="p-4 text-center font-black uppercase text-xs animate-pulse">Scanning Air Traffic...</div>
          ) : results.length > 0 ? (
            <div className="divide-y-2 divide-foreground">
              {results.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-3 hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black uppercase text-sm leading-tight">{item.name}</p>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">
                        {item.address.cityName}, {item.address.countryName}
                      </p>
                    </div>
                    <span className="bg-foreground text-white px-2 py-0.5 text-[10px] font-black group-hover:bg-white group-hover:text-foreground">
                      {item.iataCode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="p-4 text-center text-xs font-bold text-muted-foreground">NO AIRPORTS FOUND</div>
          )}
        </div>
      )}
    </div>
  );
}
