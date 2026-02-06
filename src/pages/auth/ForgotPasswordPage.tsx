import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSent(true);
      toast.success('Reset link sent to your email!');
    } catch (error) {
      console.error('Reset password error:', error);
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
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold italic uppercase tracking-tighter">
              {isSent ? 'Check Your Email' : 'Forgot Password'}
            </CardTitle>
            <p className="text-muted-foreground text-sm font-medium">
              {isSent 
                ? "We've sent a password reset link to your email." 
                : "Enter your email to receive a password reset link."}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {!isSent ? (
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

                <Button 
                  type="submit" 
                  className="w-full h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black uppercase italic"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/10 border-2 border-primary p-4 rounded-sm text-sm font-medium">
                  If an account exists for {email}, you will receive a password reset link shortly.
                </div>
                <Button 
                  variant="outline"
                  className="w-full h-12 border-2 border-foreground hover:bg-secondary transition-all font-black uppercase italic"
                  onClick={() => setIsSent(false)}
                >
                  Try another email
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-xs font-bold text-primary hover:underline uppercase tracking-tighter"
              >
                <ArrowLeft className="mr-2 h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
