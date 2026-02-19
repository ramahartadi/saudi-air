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
    const { action, bookingId, customerDetails } = await req.json()
    
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')
    const IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
    const SNAP_URL = IS_PRODUCTION 
      ? 'https://app.midtrans.com/snap/v1/transactions' 
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    if (!MIDTRANS_SERVER_KEY) throw new Error('Midtrans Server Key missing')

    const authHeader = `Basic ${btoa(MIDTRANS_SERVER_KEY + ':')}`
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get Booking from hotel_bookings
    const { data: booking, error: fetchError } = await supabase
      .from('hotel_bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) throw new Error('Hotel Booking not found')

    // 2. Prepare Payload
    const orderId = `HOTEL-${booking.booking_reference}-${Date.now()}`
    const finalAmount = Math.round(Number(booking.total_price))

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
      customer_details: {
        first_name: customerDetails?.first_name || 'Guest',
        email: customerDetails?.email || 'customer@example.com',
      },
      item_details: [
        {
          id: booking.hotel_id,
          price: finalAmount,
          quantity: 1,
          name: booking.hotel_name.substring(0, 50)
        }
      ],
      expiry: {
        unit: 'minutes',
        duration: 30
      }
    }

    // 3. Request to Midtrans
    const response = await fetch(SNAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error_messages?.join(', ') || 'Midtrans Error')

    // 4. Update Booking with token
    await supabase
      .from('hotel_bookings')
      .update({
        midtrans_token: data.token,
        payment_expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      })
      .eq('id', bookingId)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
