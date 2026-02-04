import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plane, User, Users, ArrowLeft, Save, Trash2, 
  Plus, Loader2, ChevronRight, FileText, CalendarIcon, MapPin, Printer, X, CreditCard, Download 
} from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Passenger {
  id?: string;
  title: string;
  first_name: string;
  last_name: string;
  passport_number: string;
  passport_expiry: string;
  date_of_birth: string;
  nationality: string;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const printInvoice = () => {
    window.print();
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`SaudiAir_Invoice_${booking.booking_reference}.pdf`);
      toast.success("PDF Downloaded successfully!");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Booking
      const { data: bookingData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (bError) throw bError;
      setBooking(bookingData);

      // 2. Fetch Passengers
      const { data: pData, error: pError } = await supabase
        .from('booking_passengers')
        .select('*')
        .eq('booking_id', id);
      
      if (pError) throw pError;
      setPassengers(pData || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const addPassengerSlot = () => {
    if (passengers.length >= booking.passengers_count) {
      toast.error(`Maximum passengers for this booking is ${booking.passengers_count}`);
      return;
    }
    setPassengers([...passengers, { title: 'Mr', first_name: '', last_name: '', passport_number: '', passport_expiry: '', date_of_birth: '', nationality: '' }]);
  };

  const updatePassengerField = (index: number, field: keyof Passenger, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const removePassenger = async (index: number) => {
    const p = passengers[index];
    if (p.id) {
      // Delete from Supabase if it exists
      const { error } = await supabase.from('booking_passengers').delete().eq('id', p.id);
      if (error) {
        toast.error('Failed to delete passenger');
        return;
      }
    }
    const newPassengers = passengers.filter((_, i) => i !== index);
    setPassengers(newPassengers);
    toast.success('Passenger slot removed');
  };

  const saveAllPassengers = async () => {
    setSaving(true);
    try {
      // Logic for UPSERT
      const toUpsert = passengers.map(p => ({
        ...p,
        booking_id: id,
        // Make sure empty values don't break database if you have constraints
      }));

      const { error } = await supabase
        .from('booking_passengers')
        .upsert(toUpsert);

      if (error) throw error;
      toast.success('All passenger data saved successfully!');
      fetchData(); // Refresh to get IDs for new rows
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save passenger data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="font-black uppercase tracking-widest italic">Loading flight manifest...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 min-h-screen">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/my-bookings')}
          className="mb-8 border-2 border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all font-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          BACK TO BOOKINGS
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr,350px]">
          {/* Main Manifest Section */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">Passenger Manifest</h1>
                <p className="text-muted-foreground font-bold uppercase text-xs mt-2">
                  Update detail data for each of the {booking.passengers_count} travelers
                </p>
              </div>
              <div className="flex items-center gap-2 bg-primary text-white px-4 py-2 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Users className="h-5 w-5" />
                <span className="font-black">{passengers.length} / {booking.passengers_count}</span>
              </div>
            </div>

            <div className="space-y-6">
              {passengers.map((p, index) => (
                <Card key={index} className="border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="bg-foreground text-white p-3 flex justify-between items-center">
                    <span className="font-black uppercase text-xs tracking-widest">Traveler #{index + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:bg-rose-500 hover:text-white"
                      onClick={() => removePassenger(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-1">
                        <Label className="text-[10px] font-black uppercase">Title</Label>
                        <Select value={p.title} onValueChange={(v) => updatePassengerField(index, 'title', v)}>
                          <SelectTrigger className="border-2 border-foreground font-bold rounded-none h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-2 border-foreground rounded-none">
                            <SelectItem value="Mr">Mr.</SelectItem>
                            <SelectItem value="Mrs">Mrs.</SelectItem>
                            <SelectItem value="Ms">Ms.</SelectItem>
                            <SelectItem value="Child">Child</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-[10px] font-black uppercase">First Name</Label>
                        <Input 
                          placeholder="John" 
                          value={p.first_name} 
                          onChange={(e) => updatePassengerField(index, 'first_name', e.target.value)}
                          className="border-2 border-foreground font-bold h-11 rounded-none p-4"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-[10px] font-black uppercase">Last Name</Label>
                        <Input 
                          placeholder="Doe" 
                          value={p.last_name} 
                          onChange={(e) => updatePassengerField(index, 'last_name', e.target.value)}
                          className="border-2 border-foreground font-bold h-11 rounded-none p-4"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-[10px] font-black uppercase">Passport Number</Label>
                        <div className="relative">
                          <Input 
                            placeholder="A1234567" 
                            value={p.passport_number} 
                            onChange={(e) => updatePassengerField(index, 'passport_number', e.target.value)}
                            className="border-2 border-foreground font-bold h-11 rounded-none pl-10"
                          />
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-[10px] font-black uppercase">Date of Birth</Label>
                        <div className="relative">
                          <Input 
                            type="date"
                            value={p.date_of_birth} 
                            onChange={(e) => updatePassengerField(index, 'date_of_birth', e.target.value)}
                            className="border-2 border-foreground font-bold h-11 rounded-none pl-10"
                          />
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-[10px] font-black uppercase">Nationality</Label>
                        <div className="relative">
                          <Input 
                            placeholder="Indonesia" 
                            value={p.nationality} 
                            onChange={(e) => updatePassengerField(index, 'nationality', e.target.value)}
                            className="border-2 border-foreground font-bold h-11 rounded-none pl-10"
                          />
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-[10px] font-black uppercase">Passport Expiry</Label>
                        <div className="relative">
                          <Input 
                            type="date"
                            value={p.passport_expiry} 
                            onChange={(e) => updatePassengerField(index, 'passport_expiry', e.target.value)}
                            className="border-2 border-foreground font-bold h-11 rounded-none pl-10"
                          />
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {passengers.length < booking.passengers_count && (
                <Button 
                  variant="outline" 
                  onClick={addPassengerSlot}
                  className="w-full h-16 border-4 border-dashed border-foreground/30 hover:border-foreground hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-muted-foreground hover:text-foreground italic"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Passenger Slot
                </Button>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <Button 
                onClick={saveAllPassengers}
                disabled={saving || passengers.length === 0}
                className="h-16 px-12 border-4 border-foreground bg-emerald-500 text-white font-black text-xl uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-3"
              >
                {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-primary text-white">
              <CardHeader className="border-b-4 border-foreground">
                <CardTitle className="uppercase font-black flex items-center gap-2 tracking-tighter italic">
                  <Plane className="h-5 w-5 rotate-45" />
                  Flight Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase bg-white/10 p-2">
                  <span>Ref</span>
                  <span className="font-mono">{booking.booking_reference}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black uppercase bg-white/10 p-2">
                  <span>Status</span>
                  <span className={`px-2 py-0.5 border-2 ${
                    booking.status === 'Success' 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-700' 
                      : 'bg-amber-100 text-amber-700 border-amber-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="text-center py-4 bg-white/5 border-2 border-white/20">
                  <p className="text-3xl font-black">{booking.flight_data.departure.airport.code} → {booking.flight_data.arrival.airport.code}</p>
                  <p className="text-xs font-bold mt-2 opacity-80">{booking.flight_data.departure.date}</p>
                </div>
                <div className="flex justify-between items-center text-xs font-black uppercase">
                  <span>Airline</span>
                  <span>{booking.flight_data.airline}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black uppercase">
                  <span>Flight No</span>
                  <span>{booking.flight_data.flightNumber}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-slate-50">
              <CardHeader className="border-b-4 border-foreground bg-secondary">
                <CardTitle className="text-sm font-black uppercase">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-bold opacity-60 uppercase text-[10px]">Purchased</span>
                    <span className="font-black">{booking.passengers_count} Seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold opacity-60 uppercase text-[10px]">Completed</span>
                    <span className="font-black text-emerald-600">{passengers.filter(p => p.first_name && p.last_name).length} Seats</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-foreground/10 pt-3">
                    <span className="font-bold opacity-60 uppercase text-[10px]">Payment Status</span>
                    <span className={`font-black ${booking.status === 'Success' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {booking.status === 'Success' ? 'PAID' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {booking.status === 'Pending' && (
              <Button 
                onClick={() => navigate(`/booking/checkout/${booking.id}`)}
                className="w-full h-14 border-4 border-foreground bg-primary text-white font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="h-5 w-5" /> Complete Payment
              </Button>
            )}

            <Button 
              onClick={() => setShowInvoice(true)}
              className="w-full h-14 border-4 border-foreground bg-amber-400 text-foreground font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" /> View Digital Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Modal Overlay */}
      {showInvoice && (
        <div className="fixed inset-0 z-[100] bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-white border-8 border-foreground w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] relative">
            {/* Header Controls */}
            <div className="sticky top-0 bg-white border-b-4 border-foreground p-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 print:hidden">
              <h2 className="font-black uppercase italic text-xl tracking-tighter">Official Invoice</h2>
              <div className="flex flex-wrap justify-center gap-2">
                <Button 
                  onClick={downloadPDF} 
                  disabled={isExporting}
                  className="border-4 border-foreground bg-primary text-white font-black px-4 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
                <Button onClick={printInvoice} variant="outline" className="border-2 border-foreground font-black px-4 flex items-center gap-2">
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button onClick={() => setShowInvoice(false)} variant="ghost" size="icon" className="border-2 border-foreground hover:bg-rose-500 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Invoice Content */}
            <div ref={invoiceRef} className="p-8 md:p-12 space-y-6 bg-white text-[#333] font-sans">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="text-2xl font-black uppercase italic text-[#0081C9]">Skybook</h3>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black">{booking.status === 'Success' ? 'BUKTI PEMBELIAN (RECEIPT)' : 'TAGIHAN PEMBAYARAN (INVOICE)'}</h4>
                <div className="flex justify-between text-[11px] border-t border-slate-200 pt-2">
                  <span>Tanggal Jam : {new Date(booking.created_at).toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-bold">Nomor : #{booking.booking_reference}</span>
                </div>
              </div>

              <div className="space-y-0">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] border border-slate-300">DETAIL PEMBAYARAN</div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="p-2 border border-slate-300 w-8">No.</th>
                      <th className="p-2 border border-slate-300">Jenis Barang</th>
                      <th className="p-2 border border-slate-300 uppercase">Deskripsi</th>
                      <th className="p-2 border border-slate-300 text-center w-10">Jml.</th>
                      <th className="p-2 border border-slate-300 text-right">Harga Satuan</th>
                      <th className="p-2 border border-slate-300 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-300">1</td>
                      <td className="p-2 border border-slate-300 font-bold">Akomodasi Penerbangan</td>
                      <td className="p-2 border border-slate-300">
                        {booking.flight_data.airline} ({booking.flight_data.flightNumber})<br/>
                        {booking.flight_data.departure.airport.city} &rarr; {booking.flight_data.arrival.airport.city}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">{booking.passengers_count}</td>
                      <td className="p-2 border border-slate-300 text-right">{booking.flight_data.currency} {(booking.total_price / (booking.passengers_count || 1)).toLocaleString()}</td>
                      <td className="p-2 border border-slate-300 text-right">{booking.flight_data.currency} {booking.total_price.toLocaleString()}</td>
                    </tr>
                    {booking.status === 'Pending' && (
                      <tr className="bg-amber-50">
                        <td colSpan={6} className="p-3 border border-slate-300 italic">
                          <p className="font-black text-amber-700 uppercase mb-1">Instruksi Pembayaran:</p>
                          <p className="text-[9px]">Silakan lakukan transfer ke <strong>BANK MANDIRI 123-00-0987654-3</strong> A/N <strong>PT SKYBOOK TRAVEL</strong> atau gunakan QRIS di halaman checkout.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="border border-slate-300 p-3 space-y-2">
                  <h5 className="font-bold underline uppercase">Data Pemesan</h5>
                  <div className="grid grid-cols-[60px,1fr] gap-1">
                    <span className="opacity-60">Nama</span>
                    <span>: {user?.email?.split('@')[0] || 'Customer'}</span>
                    <span className="opacity-60">Email</span>
                    <span>: {user?.email || '-'}</span>
                    <span className="opacity-60">Status</span>
                    <span className="font-bold">: {booking.status.toUpperCase()}</span>
                  </div>
                </div>
                <div className="border border-slate-300 p-3 space-y-2">
                  <h5 className="font-bold underline uppercase">Detail Perusahaan</h5>
                  <div className="grid grid-cols-[60px,1fr] gap-1">
                    <span className="opacity-60">Nama</span>
                    <span>: PT Skybook Travel</span>
                    <span className="opacity-60">NPWP</span>
                    <span>: 01.234.567.8-901.000</span>
                    <span className="opacity-60">Alamat</span>
                    <span>: Jl. Premium Runway No. 1, Jakarta</span>
                  </div>
                </div>
              </div>

              <div className="space-y-0">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] border border-slate-300 uppercase">Tamu (Passengers)</div>
                <div className="p-3 border border-slate-300 text-[10px] leading-relaxed">
                  {passengers.length > 0 
                    ? passengers.map((p, i) => `${i + 1}. ${p.title} ${p.first_name} ${p.last_name}`).join(', ')
                    : `${booking.passengers_count} Penumpang`
                  }
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-200">
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex justify-between w-full max-w-[250px] text-[11px] font-bold">
                    <span>TOTAL :</span>
                    <span>{booking.flight_data.currency} {booking.total_price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[250px] text-sm font-black text-[#0081C9] border-t-2 border-slate-100 pt-1">
                    <span>JUMLAH PEMBAYARAN :</span>
                    <span>{booking.flight_data.currency} {booking.total_price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {booking.status === 'Success' ? (
                <div className="pt-8 flex justify-center">
                  <div className="relative w-32 h-32 border-4 border-[#0081C9] rounded-full flex flex-col items-center justify-center text-[#0081C9] font-black group">
                    <div className="text-3xl leading-none mb-1">PAID</div>
                    <div className="text-[9px] border-t border-[#0081C9] pt-1 tracking-widest uppercase">Receipt</div>
                    <div className="absolute top-[65%] left-[-15%] right-[-15%] bg-[#0081C9] text-white text-[10px] py-0.5 rotate-[-12deg] uppercase text-center shadow-sm">Verified</div>
                  </div>
                </div>
              ) : (
                <div className="pt-8 text-center border-2 border-dashed border-amber-400 bg-amber-50 p-6">
                  <h4 className="font-black text-amber-600 uppercase italic">Menunggu Pembayaran</h4>
                  <p className="text-[10px] font-bold text-amber-500 uppercase mt-1">Silakan selesaikan pembayaran untuk menerbitkan tiket</p>
                </div>
              )}

              <div className="pt-10 border-t border-slate-100 text-center space-y-2">
                <p className="text-[9px] text-slate-400 italic">
                  Bukti pembelian ini sah dan diterbitkan secara elektronik oleh sistem Skybook Digital.<br/>
                  Untuk bantuan, silakan hubungi Skybook Help Center: support@skybook.com
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
