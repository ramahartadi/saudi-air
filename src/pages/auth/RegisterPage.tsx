import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simpan ke tabel pengajuan, bukan langsung mendaftar akun
      const { error } = await supabase
        .from('registration_requests')
        .insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role
          // Password tidak disimpan di sini karena alasan keamanan. 
          // User akan membuat password baru saat menerima link undangan (Invite).
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Email ini sudah pernah diajukan sebelumnya.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Kirim email notifikasi bahwa request diterima
      try {
        await supabase.functions.invoke('auth-notification', {
          body: {
            type: 'request_received',
            email: formData.email,
            firstName: formData.firstName
          }
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Kita tidak menghentikan proses jika email gagal dikirim
      }

      toast.success('Pengajuan akses berhasil dikirim! Mohon tunggu konfirmasi admin melalui email.');
      navigate('/login');
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg border-2 border-foreground shadow-md">
          <CardHeader className="text-center border-b-2 border-foreground bg-secondary">
            <div className="h-14 w-14 border-2 border-foreground bg-primary flex items-center justify-center mx-auto mb-4">
              <Plane className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Request Access</CardTitle>
            <p className="text-muted-foreground text-sm">
              Register your interest to join SkyBook
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-bold uppercase text-xs">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="John"
                    className="border-2 border-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-bold uppercase text-xs">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className="border-2 border-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold uppercase text-xs">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="border-2 border-foreground pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold uppercase text-xs">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  className="border-2 border-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="font-bold uppercase text-xs">
                  Account Type
                </Label>
                <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-2 border-foreground">
                    <SelectItem value="user">Individual User</SelectItem>
                    <SelectItem value="agent">Travel Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password fields removed because this is now a request-access form */}

              <Button 
                type="submit" 
                className="w-full h-12 shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Sending Request...' : 'Send Request'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
