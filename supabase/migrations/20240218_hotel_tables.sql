-- Create Hotel Bookings Tables
CREATE TABLE IF NOT EXISTS hotel_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    hotel_id TEXT NOT NULL,
    hotel_name TEXT NOT NULL,
    hotel_address TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights_count INTEGER NOT NULL,
    rooms_count INTEGER NOT NULL DEFAULT 1,
    adults_count INTEGER NOT NULL DEFAULT 1,
    total_price BIGINT NOT NULL,
    currency TEXT DEFAULT 'IDR',
    status TEXT DEFAULT 'Pending',
    booking_reference TEXT UNIQUE NOT NULL,
    midtrans_token TEXT,
    payment_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_booking_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    title TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    nationality TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_booking_guests ENABLE ROW LEVEL SECURITY;

-- Policies for hotel_bookings
CREATE POLICY "Users can view their own hotel bookings" 
    ON hotel_bookings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hotel bookings" 
    ON hotel_bookings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policies for hotel_booking_guests
CREATE POLICY "Users can view their own hotel guests" 
    ON hotel_booking_guests FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM hotel_bookings 
            WHERE hotel_bookings.id = hotel_booking_guests.booking_id 
            AND hotel_bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own hotel guests" 
    ON hotel_booking_guests FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM hotel_bookings 
            WHERE hotel_bookings.id = hotel_booking_guests.booking_id 
            AND hotel_bookings.user_id = auth.uid()
        )
    );
