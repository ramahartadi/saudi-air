import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Users, Plane, ClipboardList, ShieldCheck, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { role, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [quota, setQuota] = useState<{ used: number, allowance: number, loading: boolean }>({
    used: 0,
    allowance: 0,
    loading: true
  });
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    activeBookings: 0,
    flightsToday: 0,
    salesVolume: 0,
    loading: true
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStatsData(prev => ({ ...prev, loading: true }));

        // 1. Total Users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 2. Active Bookings (Pending & Success)
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Pending', 'Success']);

        // 3. Sales Volume (Success only)
        const { data: salesData } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('status', 'Success');
        
        const totalSales = salesData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;

        // 4. Flights Today (Estimated from bookings made today)
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        // 5. Recent Bookings (Separate fetch to avoid join relationship issues)
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (bookingData && bookingData.length > 0) {
          const userIds = [...new Set(bookingData.map(b => b.user_id).filter(Boolean))];
          
          let profileMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', userIds);
            
            if (profileData) {
              profileData.forEach(p => {
                profileMap[p.id] = p;
              });
            }
          }

          const combined = bookingData.map(b => ({
            ...b,
            profiles: b.user_id ? profileMap[b.user_id] : null
          }));

          setRecentBookings(combined);
        } else {
          setRecentBookings([]);
        }

        setStatsData({
          totalUsers: usersCount || 0,
          activeBookings: bookingsCount || 0,
          flightsToday: todayCount || 0,
          salesVolume: totalSales,
          loading: false
        });

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        toast.error('Gagal mengambil data dashboard: ' + err.message);
        setStatsData(prev => ({ ...prev, loading: false }));
      }
    };

    const fetchQuota = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('searchapi-flights', {
          body: { action: 'get-quota' }
        });

        if (error) throw error;

        if (data && data.account) {
          setQuota({
            used: data.account.current_month_usage,
            allowance: data.account.monthly_allowance,
            loading: false
          });
        }
      } catch (err) {
        console.error('Error fetching API quota:', err);
        setQuota(prev => ({ ...prev, loading: false }));
      }
    };

    if (role === 'admin') {
      fetchDashboardData();
      fetchQuota();
    }
  }, [role]);

  // Tampilkan loading screen saat masih fetching auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center border-4 border-foreground bg-primary animate-bounce shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Plane className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="font-black uppercase tracking-widest text-foreground">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Hanya redirect jika SUDAH PASTI bukan admin (loading selesai dan role bukan admin)
  if (!isLoading && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { label: 'Total Users', value: statsData.loading ? '...' : statsData.totalUsers.toLocaleString(), change: '+12%', icon: Users, color: 'bg-indigo-500' },
    { label: 'Active Bookings', value: statsData.loading ? '...' : statsData.activeBookings.toLocaleString(), change: '+3%', icon: ClipboardList, color: 'bg-emerald-500' },
    { label: 'Flights Today', value: statsData.loading ? '...' : statsData.flightsToday.toLocaleString(), change: '-5%', icon: Plane, color: 'bg-orange-500' },
    { label: 'Sales Volume', value: statsData.loading ? '...' : `IDR ${(statsData.salesVolume >= 1000000 ? (statsData.salesVolume / 1000000).toFixed(1) + 'Jt' : (statsData.salesVolume / 1000).toFixed(1) + 'k')}`, change: '+18%', icon: TrendingUp, color: 'bg-pink-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1 font-medium">Welcome back to the command center.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
                <div className={`${stat.color} p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="flex items-center mt-1">
                  <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1 font-bold">vs last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="border-b-2 border-foreground bg-secondary flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black uppercase">Recent Bookings</CardTitle>
              <Button 
                onClick={() => navigate('/admin/bookings')}
                variant="outline" 
                size="sm" 
                className="border-2 border-foreground h-8 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted border-b-2 border-foreground">
                    <tr>
                      <th className="p-4 text-xs font-black uppercase">Ref</th>
                      <th className="p-4 text-xs font-black uppercase">Customer</th>
                      <th className="p-4 text-xs font-black uppercase">Destination</th>
                      <th className="p-4 text-xs font-black uppercase">Status</th>
                      <th className="p-4 text-xs font-black uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground">
                    {recentBookings.length > 0 ? (
                      recentBookings.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="p-4 text-sm font-bold">{row.booking_reference}</td>
                          <td className="p-4 text-sm font-bold">
                            {row.profiles ? `${row.profiles.first_name || ''} ${row.profiles.last_name || ''}`.trim() : (row.user_id?.substring(0, 8) || 'Guest')}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {row.flight_data?.arrival?.airport?.city || 'Unknown'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] 
                              ${row.status === 'Success' ? 'bg-emerald-400' : row.status === 'Pending' ? 'bg-amber-400' : 'bg-rose-400'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-black">IDR {row.total_price?.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground font-bold uppercase italic">
                          No bookings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <CardHeader className="border-b-2 border-foreground bg-secondary">
              <CardTitle className="text-lg font-black uppercase text-foreground">Action Needed</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex flex-col gap-4">
              <div className="p-4 border-2 border-foreground bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex gap-3">
                <div className="bg-amber-400 p-2 border-2 border-foreground h-fit">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase underline decoration-2 underline-offset-4">Identity Verification</p>
                  <p className="text-xs text-muted-foreground mt-1">3 agents are waiting for document approval.</p>
                </div>
              </div>

              <div className="p-4 border-2 border-foreground bg-indigo-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex gap-3">
                <div className="bg-indigo-400 p-2 border-2 border-foreground h-fit font-bold text-white">
                  i
                </div>
                <div>
                  <p className="text-sm font-black uppercase underline decoration-2 underline-offset-4">API Quota Alert</p>
                  {quota.loading ? (
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic">Fetching latest quota...</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      SearchApi: <span className="font-black text-foreground">{quota.used?.toLocaleString()}</span> / {quota.allowance?.toLocaleString()} credits used.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-2 pt-4">
                <p className="text-xs font-black uppercase text-muted-foreground text-center">Quick Links</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="text-[10px] h-8 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase">Logs</Button>
                  <Button variant="outline" className="text-[10px] h-8 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase">Backups</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
