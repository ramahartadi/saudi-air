-- Create managed_airlines table
CREATE TABLE IF NOT EXISTS public.managed_airlines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    is_active BOOLEAN DEFAULT true,
    baggage_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.managed_airlines ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on managed_airlines" ON public.managed_airlines
    FOR ALL USING (public.is_admin());

-- Public (actually authenticated users) can read active ones for search
CREATE POLICY "Everyone can read active managed_airlines" ON public.managed_airlines
    FOR SELECT USING (is_active = true);

-- Insert some defaults (optional)
INSERT INTO public.managed_airlines (code, name) 
VALUES 
('SV', 'Saudi Arabian Airlines'),
('GA', 'Garuda Indonesia'),
('EK', 'Emirates')
ON CONFLICT (code) DO NOTHING;
