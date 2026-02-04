import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()
    
    // Ambil Credentials
    const AMADEUS_CLIENT_ID = Deno.env.get('AMADEUS_CLIENT_ID')
    const AMADEUS_CLIENT_SECRET = Deno.env.get('AMADEUS_CLIENT_SECRET')
    const AMADEUS_BASE_URL = 'https://test.api.amadeus.com'

    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
      throw new Error('Amadeus credentials are not configured.')
    }

    // Step 1: Get Access Token
    const tokenResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }),
    })
    const { access_token } = await tokenResponse.json()

    let endpoint = ''
    
    if (action === 'search-flights') {
      const { origin, destination, date, adults } = params
      endpoint = `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=${adults}&max=15`
    } else if (action === 'get-featured') {
      // Default ke Jeddah untuk demo
      endpoint = `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?originLocationCode=CGK&destinationLocationCode=JED&departureDate=2025-05-10&adults=1&max=3`
    } else if (action === 'search-cheapest-dates') {
      const { origin, destination } = params
      endpoint = `${AMADEUS_BASE_URL}/v1/shopping/flight-dates?origin=${origin}&destination=${destination}`
    } else if (action === 'search-airports') {
      const { keyword } = params
      endpoint = `${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${keyword}&view=LIGHT`
    } else {
      throw new Error(`Action ${action} not supported`)
    }

    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Kita return 200 agar frontend bisa handle error di body
    })
  }
})
