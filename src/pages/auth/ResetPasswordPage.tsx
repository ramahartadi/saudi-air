import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Password berhasil disimpan! Selamat datang.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-12 flex items-center justify-center">
        <Card className="w-full max-w-md border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
          <CardHeader className="text-center border-b-4 border-foreground bg-primary">
            <div className="h-16 w-16 border-4 border-foreground bg-white flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Lock className="h-8 w-8 text-foreground" />
            </div>
            <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tighter">Reset Your Password</CardTitle>
            <p className="text-primary-foreground/80 font-bold uppercase text-[10px] mt-1">
              Please enter your new password below
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-black uppercase text-xs">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-2 border-foreground rounded-none h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-black uppercase text-xs">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="border-2 border-foreground rounded-none h-12"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-emerald-400 hover:bg-emerald-500 text-foreground border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all font-black uppercase text-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
                <Save className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
