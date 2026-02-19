-- Add supporting columns for hotel bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'flight';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_data JSONB;

-- Update existing bookings to be 'flight' type
UPDATE bookings SET booking_type = 'flight' WHERE booking_type IS NULL;
