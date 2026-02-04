import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Save, Percent, ShieldCheck, User, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { role, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discounts, setDiscounts] = useState({
    agent: 10,
    user: 5
  });
  const [currency, setCurrency] = useState({
    eurToIdr: 17500
  });

  useEffect(() => {
    if (role === 'admin') {
      fetchSettings();
    }
  }, [role]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch Discounts
      const { data: discData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'discounts')
        .single();

      if (discData?.value) {
        setDiscounts(discData.value);
      }

      // Fetch Currency
      const { data: currData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'currency')
        .single();

      if (currData?.value) {
        setCurrency(currData.value);
      }
    } catch (err: any) {
      console.error("Fetch Settings Error:", err);
      toast.error("Failed to load settings from database");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      
      // Save Discounts
      const { error: discError } = await supabase
        .from('app_settings')
        .upsert({ id: 'discounts', value: discounts, updated_at: timestamp });

      // Save Currency
      const { error: currError } = await supabase
        .from('app_settings')
        .upsert({ id: 'currency', value: currency, updated_at: timestamp });

      if (discError || currError) throw (discError || currError);

      toast.success("All settings updated successfully!");
    } catch (err: any) {
      console.error("Save Settings Error:", err);
      toast.error("Failed to save settings: " + err.message);
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
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">System Settings</h1>
          <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Configure global application parameters</p>
        </div>

        <div className="grid gap-8">
          {/* Discount Settings Card */}
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
            <CardHeader className="bg-foreground text-white border-b-4 border-foreground">
              <CardTitle className="uppercase font-black italic flex items-center gap-3">
                <Percent className="h-6 w-6" />
                Global Discount Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <p className="font-bold text-sm text-muted-foreground uppercase leading-relaxed">
                Set percentage-based discounts that will be applied to live prices fetched from Amadeus API. 
                These discounts are automatically calculated based on the logged-in user's role.
              </p>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4 p-6 border-4 border-foreground bg-indigo-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <Label className="font-black uppercase text-sm">Agent Discount (%)</Label>
                  </div>
                  <Input 
                    type="number"
                    value={discounts.agent}
                    onChange={(e) => setDiscounts({...discounts, agent: Number(e.target.value)})}
                    className="border-2 border-foreground h-14 text-2xl font-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <p className="text-[10px] font-bold text-indigo-700 uppercase">Applied to all accounts with 'agent' role</p>
                </div>

                <div className="space-y-4 p-6 border-4 border-foreground bg-emerald-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-emerald-600" />
                    <Label className="font-black uppercase text-sm">Standard User Discount (%)</Label>
                  </div>
                  <Input 
                    type="number"
                    value={discounts.user}
                    onChange={(e) => setDiscounts({...discounts, user: Number(e.target.value)})}
                    className="border-2 border-foreground h-14 text-2xl font-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Applied to all standard verified customers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings Card */}
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
            <CardHeader className="bg-amber-400 text-foreground border-b-4 border-foreground">
              <CardTitle className="uppercase font-black italic flex items-center gap-3">
                <Globe className="h-6 w-6" />
                Currency Conversion Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-black uppercase italic">EUR to IDR Manual Rate</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                    Override the default conversion rate for Amadeus API prices. This rate will be used to multiply any prices returned in EUR.
                  </p>
                </div>
                
                <div className="w-full md:w-64 space-y-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">IDR</span>
                    <Input 
                      type="number"
                      value={currency.eurToIdr}
                      onChange={(e) => setCurrency({...currency, eurToIdr: Number(e.target.value)})}
                      className="border-4 border-foreground h-14 pl-12 text-2xl font-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-slate-50"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase bg-secondary p-2 border-2 border-foreground">
                    <span>Current Multiplier</span>
                    <span className="text-primary font-black">x{currency.eurToIdr.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Note */}
          <div className="p-6 border-4 border-foreground bg-amber-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase italic mb-2">Technical Note:</h3>
            <p className="text-xs font-bold leading-relaxed italic uppercase">
              Prices are calculated as: Final Price = Original Price * (1 - Discount / 100). 
              The conversion to IDR is applied AFTER the discount. Changes affect all live searches immediately.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-4 border-t-4 border-foreground/10">
          <Button 
            onClick={fetchSettings}
            disabled={loading || saving}
            variant="outline"
            className="border-4 border-foreground h-16 px-10 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:shadow-none transition-all bg-white"
          >
            Discard Changes
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || saving}
            className="bg-primary text-primary-foreground border-4 border-foreground h-16 px-16 font-black uppercase italic text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:shadow-none transition-all"
          >
            {saving ? (
              <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-3 h-6 w-6" /> Save All Settings</>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
