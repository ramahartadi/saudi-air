-- Fix not-null constraint on flight_data to allow hotel bookings
ALTER TABLE bookings ALTER COLUMN flight_data DROP NOT NULL;

-- Add supporting columns for hotel bookings (in case they weren't added yet)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'flight';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_data JSONB;

-- Ensure existing data is marked as flight
UPDATE bookings SET booking_type = 'flight' WHERE booking_type IS NULL;
