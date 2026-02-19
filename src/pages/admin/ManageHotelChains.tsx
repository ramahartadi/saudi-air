import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Switch } from "@/components/ui/switch";

interface HotelChain {
  id: string;
  name: string;
  brand_id: string;
  is_active: boolean;
  created_at: string;
}

export default function ManageHotelChains() {
  const { role, isLoading: authLoading } = useAuth();
  const [chains, setChains] = useState<HotelChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (role === 'admin') {
      fetchChains();
    }
  }, [role]);

  const fetchChains = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hotel_chains')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setChains(data || []);
    } catch (error: any) {
      toast.error("Error loading hotel chains: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addChain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBrandId.trim()) {
      toast.error("Please fill in both Name and Brand ID");
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('hotel_chains')
        .insert([{ 
          name: newName.trim(),
          brand_id: newBrandId.trim()
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('Hotel group or Brand ID already exists');
        throw error;
      }

      setChains(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewBrandId('');
      toast.success(`Hotel Group "${data.name}" added successfully`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const updateBrandId = async (id: string, newId: string) => {
    try {
      const { error } = await supabase
        .from('hotel_chains')
        .update({ brand_id: newId })
        .eq('id', id);

      if (error) throw error;
      
      setChains(prev => prev.map(c => c.id === id ? { ...c, brand_id: newId } : c));
      toast.success(`Brand ID updated`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hotel_chains')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setChains(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      toast.success(`Hotel Group status updated`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteChain = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('hotel_chains')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChains(prev => prev.filter(c => c.id !== id));
      toast.success(`Hotel Group "${name}" removed`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredChains = chains.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="p-10 text-center font-black italic animate-pulse text-2xl uppercase tracking-widest text-foreground">
        Verifying Admin Access...
      </div>
    </div>
  );
  
  if (role !== 'admin') return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Hotel Groups</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Manage global hotel chains for localized search filters</p>
          </div>
          <Button 
            onClick={fetchChains} 
            disabled={loading}
            className="border-2 border-foreground bg-white text-foreground hover:bg-secondary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading && 'animate-spin'}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add New Chain Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
              <CardHeader className="border-b-4 border-foreground bg-primary/5">
                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Add New Group
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={addChain} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px]">Chain Name (Display)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="e.g. Hilton Hotels" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        className="border-2 border-foreground pl-10 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px]">Brand ID (SearchApi ID)</Label>
                    <div className="relative">
                      <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="e.g. 37" 
                        value={newBrandId} 
                        onChange={(e) => setNewBrandId(e.target.value)}
                        className="border-2 border-foreground pl-10 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isAdding}
                    className="w-full h-12 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all hover:bg-primary/90 mt-2"
                  >
                    {isAdding ? 'Adding...' : 'Register Group'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="p-4 border-4 border-foreground bg-indigo-50 rounded-none italic">
              <p className="text-xs font-bold uppercase text-indigo-800 flex items-center gap-2">
                <Search className="h-4 w-4" /> Info:
              </p>
              <p className="text-[10px] mt-1 text-indigo-900 leading-relaxed font-medium">
                Hotel groups yang terdaftar di sini adalah satu-satunya grup yang akan dijual di aplikasi. Pastikan Brand ID sesuai dengan dokumentasi SearchApi agar filter berfungsi dengan benar.
              </p>
            </div>
          </div>

          {/* Chain List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input 
                placeholder="Search groups..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 pr-4 bg-white border-4 border-foreground font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-foreground text-white border-b-4 border-foreground">
                    <tr>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Group Name</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Brand ID</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Status</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Created At</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center font-black animate-pulse uppercase tracking-[0.2em] italic">Accessing Hotel Registry...</td>
                      </tr>
                    ) : filteredChains.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center font-black uppercase opacity-30">No hotel groups found.</td>
                      </tr>
                    ) : (
                      filteredChains.map((chain) => (
                        <tr key={chain.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <span className="font-black text-lg uppercase tracking-tight">
                              {chain.name}
                            </span>
                          </td>
                          <td className="p-4">
                            <Input 
                              defaultValue={chain.brand_id}
                              onBlur={(e) => {
                                if (e.target.value !== chain.brand_id) {
                                  updateBrandId(chain.id, e.target.value);
                                }
                              }}
                              className="w-32 h-8 border-2 border-foreground bg-secondary/20 font-bold text-[10px] rounded-none focus:bg-white transition-colors"
                              placeholder="e.g. 37"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Switch 
                                checked={chain.is_active}
                                onCheckedChange={() => toggleStatus(chain.id, chain.is_active)}
                                className="data-[state=checked]:bg-emerald-500 border-2 border-foreground"
                              />
                              <span className={`font-black uppercase text-[10px] ${chain.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {chain.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-xs text-muted-foreground">
                            {new Date(chain.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteChain(chain.id, chain.name)}
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
