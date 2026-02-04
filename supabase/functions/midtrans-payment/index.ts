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
    const body = await req.json()
    const { action, params } = body
    
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')
    const IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
    const SNAP_URL = IS_PRODUCTION 
      ? 'https://app.midtrans.com/snap/v1/transactions' 
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    if (!MIDTRANS_SERVER_KEY) {
      throw new Error('Midtrans Server Key is not configured.')
    }

    const authHeader = `Basic ${btoa(MIDTRANS_SERVER_KEY + ':')}`

    // If it's a direct notification from Midtrans (no 'action' field)
    if (!action && body.order_id) {
      console.log('--- WEBHOOK RECEIVED ---')
      console.log('Order ID:', body.order_id)
      console.log('Transaction Status:', body.transaction_status)
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const orderId = body.order_id
      const bookingId = orderId.substring(0, 36)
      const transactionStatus = body.transaction_status || ''
      const fraudStatus = body.fraud_status || ''

      let status = 'Pending'
      if (['capture', 'settlement'].includes(transactionStatus)) {
        status = fraudStatus === 'challenge' ? 'Challenge' : 'Success'
      } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
        status = 'Failed'
      }

      console.log(`Updating Booking ID: ${bookingId} to Status: ${status}`)

      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update({ status: status })
        .eq('id', bookingId)
        .select(`*, booking_passengers (*)`)
        .maybeSingle()

      if (updateError) {
        console.error('DATABASE UPDATE FAILED:', updateError)
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
      }

      if (!booking) {
        console.error('BOOKING NOT FOUND in DB for ID:', bookingId)
        return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 })
      }

      console.log('Successfully updated status to:', status)

      // Trigger Email only if Success
      if (status === 'Success') {
        try {
          let email = 'customer@example.com'
          if (booking.user_id) {
            const { data: userAuth } = await supabase.auth.admin.getUserById(booking.user_id)
            if (userAuth?.user?.email) email = userAuth.user.email
          }

          console.log('Triggering Success Email to:', email)
          
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-invoice`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              email,
              bookingRef: booking.booking_reference,
              flight: booking.flight_data,
              passengers: booking.booking_passengers,
              totalPrice: booking.total_price,
              status: 'Success',
              baseUrl: Deno.env.get('APP_URL') || 'https://skybook-travel.vercel.app',
              bookingId: booking.id
            })
          })
          console.log('Invoice email triggered successfully')
        } catch (emailErr) {
          console.error('EMAIL TRIGGER ERROR (but status is saved):', emailErr)
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create-transaction') {
      const { bookingId, amount, customerDetails, itemDetails } = params

      // Midtrans Limits: 
      // order_id max 50 chars
      // name in item_details max 50 chars
      
      // UUID is 36 chars. Timestamp (ms) is 13 chars. Total 49 or 50 chars.
      // We use full bookingId as prefix.
      const orderId = `${bookingId}-${Date.now()}`
      
      const roundedAmount = Math.round(amount)
      
      // Clean and truncate item details
      const sanitizedItemDetails = itemDetails.map((item: any) => ({
        ...item,
        id: item.id.substring(0, 50),
        name: item.name.substring(0, 50),
        price: Math.round(item.price)
      }))

      // Re-calculate sum to be 100% sure it matches gross_amount
      const sumItems = sanitizedItemDetails.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)

      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: sumItems, // Use sum to avoid rounding mismatch
        },
        customer_details: {
          ...customerDetails,
          email: customerDetails.email || 'customer@example.com'
        },
        item_details: sanitizedItemDetails,
      }

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
      
      if (!response.ok) {
        console.error('Midtrans API Error:', data)
        return new Response(JSON.stringify({ 
          error: data.error_messages ? data.error_messages.join(', ') : 'Midtrans API Error' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 

    throw new Error(`Action ${action} not supported`)

  } catch (error: any) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Changed to 400 for better error visibility
    })
  }
})
