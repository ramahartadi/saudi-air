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

          // Map Midtrans payment_type to readable name
          let paymentMethod = body.payment_type || 'Midtrans'
          if (paymentMethod === 'bank_transfer') {
            const bank = body.va_numbers?.[0]?.bank || body.permata_va_number ? 'Permata' : ''
            paymentMethod = `Virtual Account ${bank.toUpperCase()}`.trim()
          } else if (paymentMethod === 'credit_card') {
            paymentMethod = 'Kartu Kredit'
          } else if (paymentMethod === 'qris') {
            paymentMethod = 'QRIS'
          } else if (paymentMethod === 'cstore') {
            paymentMethod = body.store?.toUpperCase() || 'Retail Outlet'
          } else if (paymentMethod === 'echannel') {
            paymentMethod = 'Mandiri Bill Payment'
          } else if (paymentMethod === 'gopay') {
            paymentMethod = 'GoPay'
          }
          
          console.log('Triggering Success Email to:', email, 'Method:', paymentMethod)
          
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
              paymentMethod: paymentMethod, // LULUSKAN METODE PEMBAYARAN DISINI
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

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // 1. Check if we already have a valid token that hasn't expired
      // Note: Assumes columns midtrans_token and payment_expiry exist in bookings table
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('midtrans_token, payment_expiry, status')
        .eq('id', bookingId)
        .maybeSingle()

      if (existingBooking?.midtrans_token && existingBooking.payment_expiry) {
        const expiryDate = new Date(existingBooking.payment_expiry)
        const now = new Date()

        if (now < expiryDate && existingBooking.status === 'Pending') {
          console.log('--- REUSING EXISTING SNAP TOKEN ---')
          return new Response(JSON.stringify({ token: existingBooking.midtrans_token }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        } else if (now >= expiryDate && existingBooking.status === 'Pending') {
          console.log('--- PAYMENT EXPIRED, CANCELLING BOOKING ---')
          await supabase
            .from('bookings')
            .update({ status: 'Failed' })
            .eq('id', bookingId)
          
          return new Response(JSON.stringify({ 
            error: 'Batas waktu pembayaran (30 menit) telah habis. Pesanan ini telah dibatalkan secara otomatis.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }
      }

      // 2. Create New Transaction if no valid token exists
      // UUID is 36 chars. Timestamp (ms) is 13 chars. Total 49 or 50 chars.
      const orderId = `${bookingId}-${Date.now()}`
      const roundedAmount = Math.round(amount)
      
      const sanitizedItemDetails = itemDetails.map((item: any) => ({
        ...item,
        id: item.id.substring(0, 50),
        name: item.name.substring(0, 50),
        price: Math.round(item.price)
      }))

      const sumItems = sanitizedItemDetails.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)

      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: sumItems,
        },
        customer_details: {
          ...customerDetails,
          email: customerDetails.email || 'customer@example.com'
        },
        item_details: sanitizedItemDetails,
        expiry: {
          unit: 'minutes',
          duration: 30
        }
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

      // 3. Save the new token and expiry time to DB
      const expiryTime = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      await supabase
        .from('bookings')
        .update({
          midtrans_token: data.token,
          payment_expiry: expiryTime
        })
        .eq('id', bookingId)

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
