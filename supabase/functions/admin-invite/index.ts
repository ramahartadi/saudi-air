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
    // 1. Client dengan Service Role (Untuk bypass/invite)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Client dengan User Token (Untuk cek siapa yang manggil)
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Cek User
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) throw new Error('Login diperlukan.')

    // Cek Role di Database
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error(`Akses ditolak. Role Anda adalah: ${profile?.role || 'tidak ada'}`)
    }

    const body = await req.json()
    const { email, firstName, lastName, phone, role, requestId, redirectTo } = body
    
    console.log(`Processing invite for: ${email}, redirecting to: ${redirectTo}`)

    // 3. Eksekusi Invite
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: role,
        is_approved: true
      },
      redirectTo: redirectTo || `${new URL(req.headers.get('origin') || 'http://localhost:5173').origin}/reset-password`
    })

    if (inviteError) throw inviteError

    // 4. Update status request
    if (requestId) {
      await adminClient
        .from('registration_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
    }

    return new Response(JSON.stringify({ message: 'Berhasil mengundang user' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
