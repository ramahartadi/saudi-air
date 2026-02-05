import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plane, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Search,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Switch } from "@/components/ui/switch";

interface Airline {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function ManageAirlines() {
  const { role, isLoading: authLoading } = useAuth();
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAirline, setNewAirline] = useState({ code: '', name: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (role === 'admin') {
      fetchAirlines();
    }
  }, [role]);

  const fetchAirlines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('managed_airlines')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      setAirlines(data || []);
    } catch (error: any) {
      toast.error("Error loading airlines: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAirline.code) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('managed_airlines')
        .insert([{ 
          code: newAirline.code.toUpperCase(), 
          name: newAirline.name || newAirline.code.toUpperCase() 
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('Airline code already exists');
        throw error;
      }

      setAirlines(prev => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
      setNewAirline({ code: '', name: '' });
      toast.success(`Airline ${data.code} added successfully`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAirlineStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('managed_airlines')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setAirlines(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
      toast.success(`Airline status updated`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteAirline = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to remove ${code}?`)) return;

    try {
      const { error } = await supabase
        .from('managed_airlines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAirlines(prev => prev.filter(a => a.id !== id));
      toast.success(`Airline ${code} removed`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (authLoading) return <div className="p-10 text-center font-black italic animate-pulse text-2xl uppercase tracking-widest">Verifying Admin Access...</div>;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Managed Airlines</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Control which airlines appear in search results</p>
          </div>
          <Button 
            onClick={fetchAirlines} 
            disabled={loading}
            className="border-2 border-foreground bg-white text-foreground hover:bg-secondary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading && 'animate-spin'}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Airline Form */}
          <div className="lg:col-span-1">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
              <CardHeader className="border-b-4 border-foreground bg-primary/5">
                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Add Airline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={addAirline} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px]">IATA Code (e.g., SV, GA)</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="SV" 
                        value={newAirline.code} 
                        onChange={(e) => setNewAirline({...newAirline, code: e.target.value})}
                        className="border-2 border-foreground pl-10 font-bold uppercase"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px]">Airline Name (Optional)</Label>
                    <div className="relative">
                      <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Saudi Arabian Airlines" 
                        value={newAirline.name} 
                        onChange={(e) => setNewAirline({...newAirline, name: e.target.value})}
                        className="border-2 border-foreground pl-10 font-bold"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isAdding}
                    className="w-full h-12 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all hover:bg-primary/90 mt-2"
                  >
                    {isAdding ? 'Adding...' : 'Add to Catalog'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-6 p-4 border-4 border-foreground bg-amber-50 rounded-none italic">
              <p className="text-xs font-bold uppercase text-amber-800 flex items-center gap-2">
                <Search className="h-4 w-4" /> Tip:
              </p>
              <p className="text-[10px] mt-1 text-amber-900 leading-relaxed font-medium">
                Sistem akan menyaring hasil pencarian dan hanya mengembalikan tiket dari maskapai yang berstatus <span className="underline decoration-2">ACTIVE</span> di daftar ini.
              </p>
            </div>
          </div>

          {/* Airline List */}
          <div className="lg:col-span-2">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-foreground text-white border-b-4 border-foreground">
                    <tr>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Code</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Airline Name</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Status</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center font-black animate-pulse uppercase tracking-[0.2em] italic">Accessing Airline Registry...</td>
                      </tr>
                    ) : airlines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center font-black uppercase opacity-30">No airlines configured. All airlines will be shown.</td>
                      </tr>
                    ) : (
                      airlines.map((airline) => (
                        <tr key={airline.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <span className="font-black text-xl uppercase italic tracking-tighter bg-secondary px-2 py-1 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              {airline.code}
                            </span>
                          </td>
                          <td className="p-4 font-bold uppercase text-sm">
                            {airline.name}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Switch 
                                checked={airline.is_active}
                                onCheckedChange={() => toggleAirlineStatus(airline.id, airline.is_active)}
                                className="data-[state=checked]:bg-emerald-500 border-2 border-foreground"
                              />
                              <span className={`font-black uppercase text-[10px] ${airline.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {airline.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteAirline(airline.id, airline.code)}
                              className="h-10 w-10 border-2 border-transparent hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-none"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
