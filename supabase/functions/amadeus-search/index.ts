import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { origin, destination, departureDate, adults } = await req.json()

    // 1. Ambil Credentials dari Environment Variables Supabase
    // (Bukan dari .env file React, tapi dari dashboard Supabase)
    const AMADEUS_CLIENT_ID = Deno.env.get('AMADEUS_CLIENT_ID')
    const AMADEUS_CLIENT_SECRET = Deno.env.get('AMADEUS_CLIENT_SECRET')
    const AMADEUS_BASE_URL = 'https://test.api.amadeus.com' // Gunakan 'test' untuk development

    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
      throw new Error('Amadeus credentials are not configured in Supabase.')
    }

    // 2. Step 1: Dapatkan Access Token (OAuth2)
    const tokenResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 3. Step 2: Cari Flight Offers (v2/shopping/flight-offers)
    const flightResponse = await fetch(
      `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=${adults}&max=10`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    const flightData = await flightResponse.json()

    return new Response(JSON.stringify(flightData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
