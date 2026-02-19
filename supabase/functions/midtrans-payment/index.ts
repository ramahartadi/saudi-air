import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Handle GET (Hanya untuk verifikasi URL oleh Midtrans Dashboard)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'active', message: 'Midtrans Payment Edge Function is running' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })
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

    // --- WEBHOOK NOTIFICATION FROM MIDTRANS ---
    if (!action && body.order_id) {
      console.log('--- WEBHOOK RECEIVED ---')
      console.log('Order ID:', body.order_id)
      
      const { order_id, status_code, gross_amount, signature_key } = body
      const cryptoInput = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`
      const encoder = new TextEncoder()
      const data = encoder.encode(cryptoInput)
      const hashBuffer = await crypto.subtle.digest('SHA-512', data)
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

      if (hashHex !== signature_key) {
        return new Response(JSON.stringify({ status: 'ignored' }), { headers: corsHeaders, status: 200 })
      }

      const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
      const transactionStatus = body.transaction_status || ''
      const fraudStatus = body.fraud_status || ''

      let status = 'Pending'
      if (['capture', 'settlement'].includes(transactionStatus)) {
        status = fraudStatus === 'challenge' ? 'Challenge' : 'Success'
      } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
        status = 'Failed'
      }

      const isHotelOrder = order_id.startsWith('HOTEL-')
      
      if (isHotelOrder) {
        const bookingRef = order_id.split('-')[1] // HOTEL-REFERENCE-TIMESTAMP
        await supabase.from('hotel_bookings').update({ status }).eq('booking_reference', bookingRef)
        console.log(`Hotel Booking ${bookingRef} updated to ${status}`)
      } else {
        const bookingId = order_id.split('-').slice(0, 5).join('-')
        const { data: booking } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select(`*, booking_passengers (*)`).maybeSingle()
        
        if (booking && status === 'Success') {
          // Send invoice for flights (legacy logic)
          try {
            let email = 'customer@example.com'
            if (booking.user_id) {
              const { data: userAuth } = await supabase.auth.admin.getUserById(booking.user_id)
              if (userAuth?.user?.email) email = userAuth.user.email
            }
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-invoice`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
              body: JSON.stringify({
                email, bookingRef: booking.booking_reference, flight: booking.flight_data,
                passengers: booking.booking_passengers, totalPrice: booking.total_price,
                status: 'Success', paymentMethod: body.payment_type || 'Midtrans',
                baseUrl: Deno.env.get('APP_URL') || 'https://skybook-travel.vercel.app', bookingId: booking.id
              })
            })
          } catch (e) { console.error('Invoice error:', e) }
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders })
    }

    // --- CREATE TRANSACTION ACTION ---
    if (action === 'create-transaction') {
      const { bookingId, customerDetails } = params

      // VERIFIKASI USER (Mencegah Hijacking)
      const authHeaderReq = req.headers.get('Authorization')
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Ambil User ID dari JWT jika ada
      let requestUserId = null
      if (authHeaderReq) {
        const token = authHeaderReq.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) requestUserId = user.id
      }

      // 1. AMBIL DATA DARI DATABASE (Source of Truth)
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*') // 'flight_data' and 'hotel_data' should be in '*'
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        throw new Error('Booking not found in database.')
      }

      console.log('Processing booking for payment:', {
        id: booking.id,
        type: booking.booking_type,
        hasFlight: !!booking.flight_data,
        hasHotel: !!booking.hotel_data
      })

      // Validasi: Jika booking punya user_id, harus cocok dengan yang me-request
      if (booking.user_id && booking.user_id !== requestUserId) {
        throw new Error('Unauthorized: You do not have permission to pay for this booking.')
      }

      // Pastikan status masih Pending
      if (booking.status !== 'Pending') {
        throw new Error(`Booking status is ${booking.status}, cannot create payment session.`)
      }

      // 2. Gunakan Token Lama Jika Masih Valid
      if (booking.midtrans_token && booking.payment_expiry) {
        const expiryDate = new Date(booking.payment_expiry)
        if (new Date() < expiryDate) {
          return new Response(JSON.stringify({ token: booking.midtrans_token }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
      }

      // 3. Siapkan Data untuk Midtrans Murni dari Database
      const orderId = `${bookingId}-${Date.now()}`
      const finalAmount = Math.round(booking.total_price)
      
      const isHotel = booking.booking_type === 'hotel'
      const itemName = isHotel 
        ? `Hotel: ${booking.hotel_data?.name || 'Hotel Stay'}`
        : `Flight: ${booking.flight_data?.departure?.airport?.city || ''} - ${booking.flight_data?.arrival?.airport?.city || ''}`;
      
      // Buat item details berdasarkan data penerbangan/hotel dari DB
      const itemDetailsFromDb = [
        {
          id: (isHotel ? booking.id : (booking.flight_data?.id || booking.id)),
          price: finalAmount,
          quantity: 1,
          name: itemName.substring(0, 50) || 'Travel Booking'
        }
      ]

      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: finalAmount,
        },
        customer_details: {
          ...customerDetails,
          email: customerDetails.email || 'customer@example.com'
        },
        item_details: itemDetailsFromDb,
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
      status: 400,
    })
  }
})
