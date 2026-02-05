import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const body = await req.json()
    const { type, email, firstName, role, link } = body

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    let subject = ''
    let html = ''

    if (type === 'request_received') {
      subject = '[Skybook] Request Pendaftaran Diterima'
      html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #0081C9;">Halo ${firstName || ''},</h2>
          <p>Request pendaftaran kamu telah kami terima.</p>
          <p>Mohon tunggu konfirmasi selanjutnya dari admin kami untuk mengaktifkan akun kamu.</p>
          <p>Terima kasih telah memilih Skybook!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Ini adalah email otomatis, mohon tidak membalas email ini.</p>
        </div>
      `
    } else if (type === 'request_approved') {
      subject = '[Skybook] Akun Kamu Telah Diverifikasi'
      html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #0081C9;">Selamat ${firstName || ''}!</h2>
          <p>Admin kami telah berhasil memverifikasi permintaan kamu.</p>
          <p>Role yang diberikan: <strong>“${role}”</strong></p>
          <p>Klik tombol di bawah ini untuk mengaktifkan akun kamu dan membuat password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #0081C9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Aktifkan Akun Sekarang
            </a>
          </div>
          <p>Atau copy link berikut ke browser kamu:</p>
          <p style="font-size: 11px; color: #888; word-break: break-all;">${link}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Jika kamu tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.</p>
        </div>
      `
    } else {
      throw new Error('Invalid email type')
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Skybook <no-reply@autoen.id>',
        to: [email],
        subject: subject,
        html: html,
      }),
    })

    const data = await res.json()

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
