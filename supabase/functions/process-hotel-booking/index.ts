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

    const body = await req.json()
    console.log('Received booking request:', JSON.stringify(body))

    const { hotelData, guestDetails, roomsCount, totalPrice } = body

    if (!hotelData) throw new Error('Missing hotelData')
    if (!guestDetails || !Array.isArray(guestDetails) || guestDetails.length === 0) throw new Error('Missing or invalid guestDetails')
    if (totalPrice === undefined || totalPrice === null) throw new Error('Missing totalPrice')

    // Generate booking reference
    const bookingRef = 'HTL' + Math.random().toString(36).substring(2, 10).toUpperCase()

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
        nights_count: hotelData.nights || 1,
        rooms_count: roomsCount || 1,
        adults_count: hotelData.adults || 1,
        total_price: Math.round(Number(totalPrice)),
        currency: hotelData.currency || 'IDR',
        status: 'Pending',
        booking_reference: bookingRef
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Database error (hotel_bookings):', bookingError)
      throw new Error(`Gagal menyimpan data pesanan: ${bookingError.message}`)
    }

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
    if (pError) {
      console.error('Database error (hotel_booking_guests):', pError)
      throw new Error(`Gagal menyimpan data tamu: ${pError.message}`)
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
