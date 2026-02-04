import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (userId) {
        // Fetch role directly to decide where to navigate
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        toast.success('Successfully logged in!');
        
        // Even if profile takes time or fails, we use the auth state change in AuthProvider
        // But for instant redirect:
        if (profile?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md border-2 border-foreground shadow-md">
          <CardHeader className="text-center border-b-2 border-foreground bg-secondary">
            <div className="h-14 w-14 border-2 border-foreground bg-primary flex items-center justify-center mx-auto mb-4">
              <Plane className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold italic uppercase tracking-tighter">Welcome Back</CardTitle>
            <p className="text-muted-foreground text-sm font-medium">
              Sign in to manage your bookings
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border-2 border-foreground pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">
                    Password
                  </Label>
                  <Link to="/forgot-password" disabled className="text-[10px] font-black uppercase hover:underline text-primary opacity-50 cursor-not-allowed">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-2 border-foreground pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black uppercase italic"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Secure Login'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs font-bold text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-black text-primary hover:underline uppercase tracking-tighter">
                  Create one now
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
