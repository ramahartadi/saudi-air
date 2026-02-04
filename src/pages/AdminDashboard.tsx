import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Users, Plane, ClipboardList, ShieldCheck, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { role, user, isLoading } = useAuth();

  // Tampilkan loading screen saat masih fetching
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
    { label: 'Total Users', value: '1,234', change: '+12%', icon: Users, color: 'bg-indigo-500' },
    { label: 'Active Bookings', value: '56', change: '+3%', icon: ClipboardList, color: 'bg-emerald-500' },
    { label: 'Flights Today', value: '12', change: '-5%', icon: Plane, color: 'bg-orange-500' },
    { label: 'Sales Volume', value: 'SAR 45.2k', change: '+18%', icon: TrendingUp, color: 'bg-pink-500' },
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
              <Button variant="outline" size="sm" className="border-2 border-foreground h-8 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted border-b-2 border-foreground">
                    <tr>
                      <th className="p-4 text-xs font-black uppercase">ID</th>
                      <th className="p-4 text-xs font-black uppercase">Customer</th>
                      <th className="p-4 text-xs font-black uppercase">Destination</th>
                      <th className="p-4 text-xs font-black uppercase">Status</th>
                      <th className="p-4 text-xs font-black uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground">
                    {[
                      { id: 'BK-1021', name: 'Ahmad Al-Sudais', dest: 'London (LHR)', status: 'Success', amount: 'SAR 3,420' },
                      { id: 'BK-1022', name: 'Sarah Wilson', dest: 'Dubai (DXB)', status: 'Pending', amount: 'SAR 1,200' },
                      { id: 'BK-1023', name: 'Khalid Jamil', dest: 'Jeddah (JED)', status: 'Success', amount: 'SAR 850' },
                      { id: 'BK-1024', name: 'Fatima Noor', dest: 'Istanbul (IST)', status: 'Cancelled', amount: 'SAR 2,100' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="p-4 text-sm font-bold">{row.id}</td>
                        <td className="p-4 text-sm font-bold">{row.name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{row.dest}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] 
                            ${row.status === 'Success' ? 'bg-emerald-400' : row.status === 'Pending' ? 'bg-amber-400' : 'bg-rose-400'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-black">{row.amount}</td>
                      </tr>
                    ))}
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
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Amadeus API hit 85% of monthly limit.</p>
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
