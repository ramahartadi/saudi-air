import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from send-eticket-notification!")

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, bookingRef, flightData, eticketUrl } = await req.json()

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing configuration env vars')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Get User Email and Name
    let email = ''
    let firstName = 'Pelanggan'
    
    if (userId) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      if (authError) {
        console.error('Error fetching user from auth:', authError)
      } else {
        email = authUser?.user?.email || ''
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', userId)
        .maybeSingle()
      
      if (profile?.first_name) firstName = profile.first_name
    }

    if (!email) {
      console.error('No email found for userId:', userId)
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`Sending E-Ticket notification to ${email} for booking ${bookingRef}`)

    // 2. Send Email
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Skybook <no-reply@autoen.id>',
        to: [email],
        subject: `[E-TICKET] Tiket Pesawat Anda Sudah Terbit - ${bookingRef}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0081C9; padding: 40px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; font-style: italic; font-weight: 900; letter-spacing: -1px;">Skybook</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: bold; opacity: 0.9;">YOUR E-TICKET IS READY!</p>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="margin-top: 0; color: #333; font-size: 20px;">Halo ${firstName},</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #555;">Kabar gembira! Tiket resmi untuk pesanan Anda dengan kode booking <strong style="color: #0081C9;">${bookingRef}</strong> telah diterbitkan oleh tim kami.</p>
              
              <div style="background-color: #f8fbff; padding: 20px; border: 2px solid #0081C9; border-left-width: 8px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #0081C9; letter-spacing: 1px; text-transform: uppercase;">Informasi Penerbangan:</p>
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                  <strong style="font-size: 18px; color: #333;">${flightData?.airline}</strong>
                  <span style="background: #0081C9; color: white; padding: 2px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; margin-left: 10px;">${flightData?.flightNumber}</span>
                </div>
                <p style="margin: 5px 0; font-size: 15px; font-weight: bold;">
                  ${flightData?.departure?.airport?.city} (${flightData?.departure?.airport?.code}) &rarr; ${flightData?.arrival?.airport?.city} (${flightData?.arrival?.airport?.code})
                </p>
                <p style="margin: 5px 0; font-size: 13px; color: #666;">
                  📅 ${flightData?.departure?.date} pukul ${flightData?.departure?.time}
                </p>
              </div>

              <p style="font-size: 14px; color: #555; margin-bottom: 25px;">Anda dapat melihat rincian pemesanan dan tiket digital di menu <strong>"My Bookings"</strong> atau mengunduh tiket PDF melalui tombol di bawah ini:</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${eticketUrl}" style="background-color: #2ecc71; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 900; display: inline-block; text-transform: uppercase; font-size: 15px; box-shadow: 0 6px 0px #27ae60; transition: all 0.2s;">
                  Download E-Ticket (PDF)
                </a>
              </div>

              <div style="background-color: #fff9e6; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #856404; font-weight: bold;">⚠️ PENTING: Mohon pastikan data pada E-Ticket sudah sesuai dengan identitas asli Anda.</p>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
              
              <div style="text-align: center;">
                <p style="font-size: 13px; color: #888; margin-bottom: 5px;">Terima kasih telah terbang bersama Skybook!</p>
                <p style="font-size: 11px; color: #aaa;">Ini adalah email otomatis, mohon tidak membalas email ini.</p>
              </div>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #999;">&copy; 2024 PT Skybook Travel. All rights reserved.</p>
            </div>
          </div>
        `,
      }),
    })

    const emailData = await emailRes.json()

    return new Response(JSON.stringify(emailData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Edge Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
