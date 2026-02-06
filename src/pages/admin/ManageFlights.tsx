import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Save, Plane, Loader2, Gauge, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ManageFlights() {
  const { role, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maxPriceOneWay: 11000000,
    maxPriceRoundTrip: 22000000
  });

  useEffect(() => {
    if (role === 'admin') {
      fetchSettings();
    }
  }, [role]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'flight_settings')
        .single();

      if (data?.value) {
        setSettings({
          maxPriceOneWay: data.value.maxPriceOneWay || 11000000,
          maxPriceRoundTrip: data.value.maxPriceRoundTrip || 22000000
        });
      }
    } catch (err: any) {
      console.error("Fetch Flight Settings Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          id: 'flight_settings', 
          value: settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Flight settings updated successfully!");
    } catch (err: any) {
      console.error("Save Flight Settings Error:", err);
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="p-10 text-center font-black">AUTHENTICATING...</div>;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-8 pb-20">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Flight Management</h1>
          <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Configure search visibility and pricing filters</p>
        </div>

        <div className="grid gap-8">
          {/* Price Filter Card */}
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground border-b-4 border-foreground">
              <CardTitle className="uppercase font-black italic flex items-center gap-3">
                <Gauge className="h-6 w-6" />
                Price Visibility Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <p className="font-bold text-sm text-muted-foreground uppercase leading-relaxed">
                Tentukan batas harga maksimum terpisah untuk tiket Sekali Jalan (One-Way) dan Pulang-Pergi (Round-Trip).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* One Way Limit */}
                <div className="space-y-4 p-6 border-4 border-foreground bg-indigo-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-5 w-5 text-indigo-600 rotate-[-45deg]" />
                    <Label className="font-black uppercase text-sm">One-Way Max Price (IDR)</Label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">Rp</span>
                    <Input 
                      type="number"
                      value={settings.maxPriceOneWay}
                      onChange={(e) => setSettings({...settings, maxPriceOneWay: Number(e.target.value)})}
                      className="border-2 border-foreground h-14 pl-12 text-xl font-black rounded-none focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Round Trip Limit */}
                <div className="space-y-4 p-6 border-4 border-foreground bg-emerald-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-5 w-5 text-emerald-600" />
                    <Label className="font-black uppercase text-sm">Round-Trip Max Price (IDR)</Label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">Rp</span>
                    <Input 
                      type="number"
                      value={settings.maxPriceRoundTrip}
                      onChange={(e) => setSettings({...settings, maxPriceRoundTrip: Number(e.target.value)})}
                      className="border-2 border-foreground h-14 pl-12 text-xl font-black rounded-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <div className="p-6 border-4 border-foreground bg-primary/5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase italic mb-2">System Behavior:</h3>
            <ul className="text-[10px] font-bold leading-relaxed uppercase list-disc pl-4 space-y-1">
              <li>Penyaringan dilakukan pada level server sebelum data dikirim ke client.</li>
              <li>Mempengaruhi semua jenis perjalanan (One-way & Round-trip).</li>
              <li>Harga yang dibandingkan adalah harga total (termasuk pajak).</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t-4 border-foreground/10">
          <Button 
            onClick={fetchSettings}
            disabled={loading || saving}
            variant="outline"
            className="border-4 border-foreground h-16 px-10 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:shadow-none transition-all bg-white"
          >
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || saving}
            className="bg-primary text-primary-foreground border-4 border-foreground h-16 px-16 font-black uppercase italic text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:shadow-none transition-all"
          >
            {saving ? (
              <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Updating...</>
            ) : (
              <><Save className="mr-3 h-6 w-6" /> Deploy Settings</>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
