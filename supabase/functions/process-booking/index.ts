import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    let userId = null
    let email = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
        email = user.email
      }
    }

    const { flightData, passengersCount, passengersDetails } = await req.json()

    if (!flightData || !passengersCount || !passengersDetails) {
      throw new Error('Missing required booking data')
    }

    // --- SECURITY: RECALCULATE PRICE ON SERVER ---
    // In a real production app, you should fetch the latest price from the flight API (Amadeus, etc.)
    // For now, we will at least recalculate based on the provided flight price * count
    // to prevent simple "totalPrice" string manipulation from frontend.
    const basePrice = flightData.price
    const calculatedTotalPrice = basePrice * passengersCount

    // Generate booking reference
    const bookingRef = 'SB' + Math.random().toString(36).substr(2, 8).toUpperCase()

    // 1. Create Booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        flight_data: flightData,
        passengers_count: passengersCount,
        total_price: calculatedTotalPrice,
        status: 'Pending',
        booking_reference: bookingRef
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // 2. Create Passengers
    const passengerRecords = passengersDetails.map((p: any) => ({
      booking_id: booking.id,
      title: p.title,
      first_name: p.firstName,
      last_name: p.lastName,
      date_of_birth: p.dateOfBirth,
      nationality: p.nationality,
      passport_number: p.passportNumber,
      passport_expiry: p.passportExpiry
    }))

    const { error: pError } = await supabase.from('booking_passengers').insert(passengerRecords)
    if (pError) throw pError

    // 3. Trigger Invoice (Asynchronous or synchronous based on need)
    // We'll call the send-invoice function but won't wait for it to finish for faster response
    if (email) {
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.headers.get('apikey')}` // Use anon key for invocation
        },
        body: JSON.stringify({
          email,
          bookingRef: bookingRef,
          flight: flightData,
          passengers: passengersDetails,
          totalPrice: calculatedTotalPrice,
          status: 'Pending',
          baseUrl: Deno.env.get('APP_URL') || 'https://skybook-travel.vercel.app',
          bookingId: booking.id
        })
      }).catch(err => console.error('Email trigger error:', err))
    }

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: booking.id, 
      bookingRef: bookingRef 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Booking creation error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
