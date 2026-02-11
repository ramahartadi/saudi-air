import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Zap, 
  RefreshCcw, 
  BarChart3, 
  Calendar, 
  ShieldCheck, 
  Activity,
  CreditCard,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface QuotaData {
  account: {
    current_month_usage: number;
    monthly_allowance: number;
    remaining_credits: number;
  };
  api_usage: {
    searches_this_hour: number;
    hourly_rate_limit: number;
  };
  subscription: {
    period_start: string;
    period_end: string;
  };
}

export default function SearchApiPage() {
  const [data, setData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('searchapi-flights', {
        body: { action: 'get-quota' }
      });

      if (error) throw error;
      if (res) setData(res);
    } catch (err: any) {
      console.error('Error fetching SearchApi quota:', err);
      toast.error('Failed to fetch API statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const usagePercentage = data 
    ? (data.account.current_month_usage / data.account.monthly_allowance) * 100 
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">SearchApi.io Status</h1>
            <p className="text-muted-foreground mt-1 font-medium">Detailed API usage and subscription monitoring.</p>
          </div>
          <Button 
            onClick={fetchQuota} 
            disabled={loading}
            className="border-2 border-foreground bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase h-12"
          >
            {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh Data
          </Button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Monthly Usage
                <BarChart3 className="h-4 w-4 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{loading ? '...' : data?.account.current_month_usage.toLocaleString()}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Searches performed this month</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Remaining Free Credit
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{loading ? '...' : data?.account.remaining_credits.toLocaleString()}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Free search credits available</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Hourly Usage
                <Clock className="h-4 w-4 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{loading ? '...' : data?.api_usage.searches_this_hour.toLocaleString()}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Current hour activity</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-pink-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Rate Limit
                <Zap className="h-4 w-4 text-pink-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{loading ? '...' : data?.api_usage.hourly_rate_limit.toLocaleString()}</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Max searches per hour</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage Visualization */}
          <Card className="lg:col-span-2 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="border-b-2 border-foreground bg-secondary">
              <CardTitle className="text-lg font-black uppercase">Quota Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-black uppercase text-muted-foreground">Monthly Consumption</p>
                    <p className="text-4xl font-black mt-1">
                      {usagePercentage.toFixed(1)}% <span className="text-lg text-muted-foreground">/ 100%</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Allowance</p>
                    <p className="text-lg font-black">{data?.account.monthly_allowance.toLocaleString()} Credits</p>
                  </div>
                </div>

                <div className="h-12 w-full border-2 border-foreground bg-slate-100 shadow-inner relative overflow-hidden">
                  <div 
                    className="h-full bg-primary border-r-2 border-foreground transition-all duration-1000 ease-out"
                    style={{ width: `${usagePercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:40px_40px] animate-[pulse_2s_infinite]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="p-4 border-2 border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Used</p>
                    <p className="text-lg font-black">{data?.account.current_month_usage.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border-2 border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Free</p>
                    <p className="text-lg font-black">{data?.account.remaining_credits.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border-2 border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Total</p>
                    <p className="text-lg font-black">{data?.account.monthly_allowance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="border-b-2 border-foreground bg-secondary">
              <CardTitle className="text-lg font-black uppercase">Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 border-2 border-foreground bg-primary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CreditCard className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground">Billing Cycle</p>
                  <p className="text-sm font-bold uppercase">Monthly Pay-As-You-Go</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border-2 border-foreground bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-foreground" />
                    <p className="text-[10px] font-black uppercase">Cycle Start</p>
                  </div>
                  <p className="text-sm font-black">
                    {data ? new Date(data.subscription.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
                  </p>
                </div>

                <div className="p-4 border-2 border-foreground bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-foreground" />
                    <p className="text-[10px] font-black uppercase">Cycle End</p>
                  </div>
                  <p className="text-sm font-black">
                    {data ? new Date(data.subscription.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-foreground border-dashed">
                <div className="flex items-center gap-2 text-primary">
                  <Activity className="h-4 w-4" />
                  <p className="text-xs font-black uppercase">System Status: Operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
