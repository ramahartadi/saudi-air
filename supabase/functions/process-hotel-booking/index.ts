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

    const { hotelData, guestDetails, roomsCount, totalPrice } = await req.json()

    if (!hotelData || !guestDetails || !totalPrice) {
      throw new Error('Missing required booking data')
    }

    // Generate booking reference
    const bookingRef = 'HTL' + Math.random().toString(36).substr(2, 8).toUpperCase()

    // 1. Create Hotel Booking
    const { data: booking, error: bookingError } = await supabase
      .from('hotel_bookings')
      .insert({
        user_id: userId,
        hotel_id: hotelData.id,
        hotel_name: hotelData.name,
        hotel_address: hotelData.address,
        check_in: hotelData.checkIn,
        check_out: hotelData.checkOut,
        nights_count: hotelData.nights,
        rooms_count: roomsCount || 1,
        adults_count: hotelData.adults || 1,
        total_price: totalPrice,
        currency: hotelData.currency || 'IDR',
        status: 'Pending',
        booking_reference: bookingRef
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // 2. Create Guest details (using hotel_booking_guests table)
    const guestRecords = guestDetails.map((g: any) => ({
      booking_id: booking.id,
      title: g.title || 'Mr',
      first_name: g.firstName,
      last_name: g.lastName,
      date_of_birth: g.dateOfBirth || null,
      nationality: g.nationality || null
    }))

    const { error: pError } = await supabase.from('hotel_booking_guests').insert(guestRecords)
    if (pError) throw pError

    // 3. Trigger Invoice (Optional, can be moved to payment success)
    if (email) {
      // Logic for invoice remains similar but with different payload
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
    console.error('Hotel Booking creation error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
