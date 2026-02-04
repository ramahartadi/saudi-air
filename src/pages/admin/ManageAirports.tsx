import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plane, 
  Trash2, 
  Plus, 
  Search,
  MapPin,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Airport {
  id: string;
  iata_code: string;
  name: string;
  city_name: string;
  country_name: string;
  is_active: boolean;
  created_at: string;
}

export default function ManageAirports() {
  const { role, isLoading: authLoading } = useAuth();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAirport, setNewAirport] = useState({
    iata_code: '',
    name: '',
    city_name: '',
    country_name: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const fetchAirports = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('airports')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`iata_code.ilike.%${search}%,name.ilike.%${search}%,city_name.ilike.%${search}%,country_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order('iata_code', { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (error) throw error;
      setAirports(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("Error loading airports: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      const timer = setTimeout(() => {
        fetchAirports(currentPage, searchTerm);
      }, searchTerm ? 500 : 0);
      return () => clearTimeout(timer);
    }
  }, [role, currentPage, searchTerm, fetchAirports]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleAddAirport = async () => {
    if (!newAirport.iata_code || !newAirport.name || !newAirport.city_name || !newAirport.country_name) {
      toast.error("Please fill all fields");
      return;
    }

    const loadingToast = toast.loading("Adding airport...");
    try {
      const { error } = await supabase
        .from('airports')
        .insert([{
          iata_code: newAirport.iata_code.toUpperCase(),
          name: newAirport.name,
          city_name: newAirport.city_name,
          country_name: newAirport.country_name
        }]);

      if (error) throw error;

      toast.success("Airport added successfully", { id: loadingToast });
      setIsAddDialogOpen(false);
      setNewAirport({ iata_code: '', name: '', city_name: '', country_name: '' });
      fetchAirports(currentPage, searchTerm);
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('airports')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setAirports(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
      toast.success(`Airport ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteAirport = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete ${code}?`)) return;
    
    try {
      const { error } = await supabase
        .from('airports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAirports(prev => prev.filter(a => a.id !== id));
      toast.success("Airport deleted");
      // If current page is empty after delete, go to previous page
      if (airports.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchAirports(currentPage, searchTerm);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (authLoading) return <div className="p-10 text-center font-black">AUTHENTICATING...</div>;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Airport Management</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Manage departure and arrival destinations</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary border-4 border-foreground font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> Add Airport
                </Button>
              </DialogTrigger>
              <DialogContent className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase italic tracking-tight">Add New Airport</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-black uppercase text-[10px]">IATA Code</Label>
                    <Input 
                      className="col-span-3 border-2 border-foreground font-bold uppercase" 
                      placeholder="e.g. CGK" 
                      maxLength={3}
                      value={newAirport.iata_code}
                      onChange={e => setNewAirport({...newAirport, iata_code: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-black uppercase text-[10px]">Airport Name</Label>
                    <Input 
                      className="col-span-3 border-2 border-foreground font-bold" 
                      placeholder="e.g. Soekarno-Hatta Intl" 
                      value={newAirport.name}
                      onChange={e => setNewAirport({...newAirport, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-black uppercase text-[10px]">City</Label>
                    <Input 
                      className="col-span-3 border-2 border-foreground font-bold" 
                      placeholder="e.g. Jakarta" 
                      value={newAirport.city_name}
                      onChange={e => setNewAirport({...newAirport, city_name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-black uppercase text-[10px]">Country</Label>
                    <Input 
                      className="col-span-3 border-2 border-foreground font-bold" 
                      placeholder="e.g. Indonesia" 
                      value={newAirport.country_name}
                      onChange={e => setNewAirport({...newAirport, country_name: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddAirport} className="w-full bg-foreground text-white font-black uppercase tracking-widest text-xs h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                    Save Airport
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline"
              onClick={() => fetchAirports(currentPage, searchTerm)}
              className="border-2 border-foreground bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all hover:bg-secondary h-11"
            >
              <RefreshCw className={`h-4 w-4 ${loading && 'animate-spin'}`} />
            </Button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground" />
          <Input 
            placeholder="Search by name, city, or IATA code..." 
            className="h-14 pl-12 border-4 border-foreground font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-foreground text-white border-b-4 border-foreground">
                <tr>
                  <th className="p-4 font-black uppercase tracking-widest text-xs">Airport Details</th>
                  <th className="p-4 font-black uppercase tracking-widest text-xs">Location</th>
                  <th className="p-4 font-black uppercase tracking-widest text-xs">Status</th>
                  <th className="p-4 font-black uppercase tracking-widest text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-foreground">
                {loading && airports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center font-black animate-pulse">SYNCING AIR TRAFFIC...</td>
                  </tr>
                ) : airports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center font-black text-muted-foreground italic uppercase">No Airports Found</td>
                  </tr>
                ) : (
                  airports.map((airport) => (
                    <tr key={airport.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-secondary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="font-black text-lg">{airport.iata_code}</span>
                          </div>
                          <div>
                            <p className="font-black uppercase text-sm leading-none">{airport.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">IATA: {airport.iata_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span className="font-bold text-xs uppercase tracking-tight">{airport.city_name}, {airport.country_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 border-2 border-foreground font-black uppercase text-[9px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 w-fit
                          ${airport.is_active ? 'bg-emerald-400' : 'bg-slate-200 opacity-50'}`}>
                          {airport.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {airport.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="border-2 border-foreground h-10 w-10 p-0 hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-[-2px] translate-y-[-2px]">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-4 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-48">
                            <DropdownMenuItem onClick={() => toggleActive(airport.id, airport.is_active)} className="font-bold uppercase text-xs cursor-pointer flex gap-2">
                              {airport.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              {airport.is_active ? 'Hide Airport' : 'Show Airport'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteAirport(airport.id, airport.iata_code)} className="text-rose-600 font-black uppercase text-xs cursor-pointer flex gap-2 focus:bg-rose-500 focus:text-white">
                              <Trash2 className="h-4 w-4" /> Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t-4 border-foreground bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Showing <span className="text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="text-foreground">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of <span className="text-foreground">{totalCount}</span> airports
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-10 w-10 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  // Show only first, last, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`h-10 min-w-[40px] border-2 border-foreground font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all
                          ${currentPage === pageNumber ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="flex items-end pb-1 font-black">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages || totalPages === 0 || loading}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-10 w-10 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
