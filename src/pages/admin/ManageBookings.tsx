import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  Search, 
  RefreshCw, 
  MoreVertical, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  ArrowRight,
  User as UserIcon,
  Ticket,
  FileText,
  Upload,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

interface BookingRecord {
  id: string;
  booking_reference: string;
  user_id: string;
  status: string;
  total_price: number;
  created_at: string;
  passengers_count: number;
  flight_data: any;
  profiles?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
  eticket_url?: string;
}

export default function ManageBookings() {
  const { role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Bookings first
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: bookingData, error: bookingError } = await query;
      if (bookingError) throw bookingError;

      // 2. Fetch Profiles for these bookings to avoid join relationship issues
      const userIds = [...new Set((bookingData || []).map(b => b.user_id).filter(Boolean))];
      
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

      // 3. Combine data
      const combined = (bookingData || []).map(b => ({
        ...b,
        profiles: b.user_id ? profileMap[b.user_id] : null
      }));

      setBookings(combined);
    } catch (error: any) {
      toast.error("Error loading bookings: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (role === 'admin') {
      fetchBookings();
    }
  }, [role, fetchBookings]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking status updated`, { id: loadingToast });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const handleUploadEticket = async (bookingId: string, file: File) => {
    const loadingToast = toast.loading(`Uploading e-ticket...`);
    try {
      // 0. Find current booking to check for old ticket
      const currentBooking = bookings.find(b => b.id === bookingId);
      const oldUrl = currentBooking?.eticket_url;

      // 1. Upload new file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `etickets/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bookings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('bookings')
        .getPublicUrl(filePath);

      // 3. Update booking record
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ eticket_url: publicUrl })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // 4. Trigger Email Notification (Non-blocking)
      const flightData = currentBooking?.flight_data;
      if (currentBooking?.user_id) {
        supabase.functions.invoke('send-eticket-notification', {
          body: {
            userId: currentBooking.user_id,
            bookingRef: currentBooking.booking_reference,
            flightData: flightData,
            eticketUrl: publicUrl
          }
        }).then(({ error: mailError }) => {
          if (mailError) console.error("Failed to send notification email:", mailError);
          else console.log("E-ticket notification email sent successfully");
        });
      }

      // 5. Delete old file if it exists
      if (oldUrl) {
        try {
          // Extract path from URL: .../public/bookings/etickets/filename
          const pathParts = oldUrl.split('/bookings/');
          if (pathParts.length > 1) {
            const oldFilePath = pathParts[1];
            await supabase.storage.from('bookings').remove([oldFilePath]);
          }
        } catch (deleteError) {
          console.error("Failed to delete old eticket:", deleteError);
          // Don't fail the whole operation if delete fails
        }
      }

      toast.success(`E-Ticket uploaded successfully`, { id: loadingToast });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, eticket_url: publicUrl } : b));
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const filteredBookings = bookings.filter(booking => 
    booking.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) return <div className="p-10 text-center font-black">AUTHENTICATING...</div>;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
              <ClipboardList className="h-10 w-10 text-primary" />
              Booking Management
            </h1>
            <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Review and manage all customer reservations</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <Button 
                onClick={fetchBookings} 
                disabled={loading}
                variant="outline"
                className="border-2 border-foreground bg-white hover:bg-secondary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all"
              >
              <RefreshCw className={`h-4 w-4 ${loading && 'animate-spin'}`} />
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,250px,200px] gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input 
                placeholder="Search by Reference or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 border-2 border-foreground font-bold focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 border-2 border-foreground font-black uppercase text-xs rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-foreground rounded-none">
                  <SelectItem value="all">ALL STATUS</SelectItem>
                  <SelectItem value="Success">SUCCESS</SelectItem>
                  <SelectItem value="Pending">PENDING</SelectItem>
                  <SelectItem value="Cancelled">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-secondary/30 border-2 border-foreground border-dashed p-2 flex items-center justify-center">
              <span className="font-black text-xs uppercase italic">{filteredBookings.length} Bookings Found</span>
            </div>
          </div>
        </Card>

        {/* Table Content */}
        <Card className="border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-foreground text-white border-b-4 border-foreground">
                <tr>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Reference</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Customer</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Route</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Total Price</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">E-Ticket</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Date</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-foreground">
                {loading && filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center font-black animate-pulse bg-slate-50 uppercase italic text-muted-foreground">Syncing Travel Records...</td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center font-black bg-slate-50 uppercase italic text-muted-foreground">No Bookings Match Your Search.</td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <span className="font-mono font-black text-primary text-sm uppercase tracking-tighter">
                          {booking.booking_reference || 'NO-REF'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 border-2 border-foreground bg-primary/10 flex items-center justify-center rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black uppercase text-xs leading-none">
                              {booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : 'Unknown'}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-bold mt-1 uppercase truncate max-w-[120px]">
                              ID: {booking.user_id?.split('-')[0]}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black italic text-xs uppercase">{booking.flight_data?.departure?.airport?.code}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-black italic text-xs uppercase">{booking.flight_data?.arrival?.airport?.code}</span>
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">
                          {booking.flight_data?.airline} • {booking.passengers_count} Pax
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-xs">
                          {booking.flight_data?.currency || 'IDR'} {booking.total_price?.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge className={`rounded-none border-2 border-foreground font-black uppercase text-[9px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                          ${booking.status === 'Success' ? 'bg-emerald-400 text-foreground' : 
                            booking.status === 'Pending' ? 'bg-amber-400 text-foreground' : 
                            'bg-rose-400 text-white'}`}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {booking.status === 'Success' ? (
                          <div className="flex flex-col gap-1.5">
                            {booking.eticket_url && (
                              <a 
                                href={booking.eticket_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[9px] uppercase hover:bg-emerald-100 transition-colors w-fit"
                              >
                                <FileText className="h-3 w-3" /> View Ticket
                              </a>
                            )}
                            
                            <div className="relative">
                              <input
                                type="file"
                                id={`eticket-${booking.id}`}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadEticket(booking.id, file);
                                }}
                              />
                              <label
                                htmlFor={`eticket-${booking.id}`}
                                className={`flex items-center gap-1.5 px-2 py-1 border font-black text-[9px] uppercase cursor-pointer transition-colors w-fit ${
                                  booking.eticket_url 
                                    ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                <Upload className="h-3 w-3" /> {booking.eticket_url ? 'Change File' : 'Upload Ticket'}
                              </label>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase italic flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Waiting Payment
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-[10px] text-muted-foreground uppercase">
                        {new Date(booking.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/booking/detail/${booking.id}`)}
                            className="h-8 border-2 border-foreground bg-white hover:bg-primary hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-4 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-48">
                              <DropdownMenuLabel className="font-black uppercase text-[10px]">Change Status:</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-foreground h-0.5" />
                              <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'Success')} className="font-bold uppercase text-xs cursor-pointer flex gap-2 focus:bg-emerald-50 focus:text-emerald-700">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Mark as Success
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'Pending')} className="font-bold uppercase text-xs cursor-pointer flex gap-2 focus:bg-amber-50 focus:text-amber-700">
                                <Clock className="h-4 w-4 text-amber-600" /> Mark as Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'Cancelled')} className="font-bold uppercase text-xs cursor-pointer flex gap-2 focus:bg-rose-50 focus:text-rose-700">
                                <XCircle className="h-4 w-4 text-rose-600" /> Mark as Cancelled
                              </DropdownMenuItem>
                              {booking.status === 'Success' && (
                                <>
                                  <DropdownMenuSeparator className="bg-foreground h-0.5" />
                                  <DropdownMenuItem asChild className="font-bold uppercase text-xs cursor-pointer flex gap-2">
                                    <label htmlFor={`eticket-${booking.id}`} className="flex items-center gap-2 w-full cursor-pointer">
                                      <Upload className="h-4 w-4" /> {booking.eticket_url ? 'Re-upload' : 'Upload'} E-Ticket
                                    </label>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
