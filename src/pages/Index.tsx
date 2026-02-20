import { Layout } from '@/components/layout/Layout';
import { FlightSearchForm } from '@/components/flight/FlightSearchForm';
import { HotelSearchForm } from '@/components/hotel/HotelSearchForm';
import { Plane, Shield, Clock, CreditCard, Compass, ArrowRight, Loader2, Building, BedDouble } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { role, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('flights');

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
              <Compass className="h-4 w-4 text-primary" />
              ELITE TRAVEL SOLUTIONS
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase italic leading-[0.9]">
              Your Journey<br />
              <span className="text-primary stroke-foreground">Defined By You</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-bold uppercase tracking-tight">
              Global flight and hotel bookings. Fast, secure, and completely transparent.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="border-4 border-foreground bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Tabs defaultValue="flights" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full h-auto p-0 bg-foreground rounded-none grid grid-cols-2">
                  <TabsTrigger 
                    value="flights" 
                    className="h-16 rounded-none font-black uppercase text-sm tracking-widest data-[state=active]:bg-white data-[state=active]:text-foreground text-white border-r-2 border-foreground transition-all"
                  >
                    <Plane className={`mr-2 h-5 w-5 ${activeTab === 'flights' ? 'text-primary' : ''}`} />
                    Flights
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hotels" 
                    className="h-16 rounded-none font-black uppercase text-sm tracking-widest data-[state=active]:bg-white data-[state=active]:text-foreground text-white transition-all"
                  >
                    <BedDouble className={`mr-2 h-5 w-5 ${activeTab === 'hotels' ? 'text-primary' : ''}`} />
                    Hotels
                  </TabsTrigger>
                </TabsList>
                <div className="p-6 md:p-10">
                  <TabsContent value="flights" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <FlightSearchForm />
                  </TabsContent>
                  <TabsContent value="hotels" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <HotelSearchForm />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { icon: Shield, title: 'Secure Booking', desc: 'Your data and transactions are protected with top-tier security.' },
              { icon: Clock, title: 'Real-Time Sync', desc: 'Get the most accurate flight and hotel availability in an instant.' },
              { icon: CreditCard, title: 'No Hidden Fees', desc: 'What you see is what you pay. No surprises at checkout.' },
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
