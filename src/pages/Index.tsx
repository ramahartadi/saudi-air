import { Layout } from '@/components/layout/Layout';
import { FlightSearchForm } from '@/components/flight/FlightSearchForm';
import { Plane, Shield, Clock, CreditCard, Compass, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { role, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [role, user, isLoading, navigate]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="border-b-4 border-foreground bg-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="container py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground bg-white mb-6 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Plane className="h-4 w-4 text-primary" />
              SKY-HIGH LUXURY, GROUND-LEVEL PRICING
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase italic leading-[0.9]">
              Find Your Next<br />
              <span className="text-primary stroke-foreground">Great Escape</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-bold uppercase tracking-tight">
              Connect to over 100+ destinations with Saudi Airlines. Fast, secure, and brutally transparent.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="border-4 border-foreground bg-white p-6 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <FlightSearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { icon: Shield, title: 'Secure Booking', desc: 'Bank-grade encryption for all your flight transactions.' },
              { icon: Clock, title: 'Real-Time Sync', desc: 'Connect directly to Amadeus GDS for accurate availability.' },
              { icon: CreditCard, title: 'No Hidden Fees', desc: 'Transparent pricing with Neo-Brutalist clarity.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 border-4 border-foreground bg-secondary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="h-16 w-16 border-4 border-foreground bg-primary flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <feature.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-3 italic tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground font-bold leading-snug uppercase text-xs tracking-wide">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
