import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    
    const SEARCHAPI_API_KEY = Deno.env.get('SEARCHAPI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const BASE_URL = 'https://www.searchapi.io/api/v1/search'

    if (!SEARCHAPI_API_KEY) {
      throw new Error('SearchApi API key is not configured.')
    }

    // Initialize Admin Client to bypass RLS
    const adminClient = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_SERVICE_ROLE_KEY ?? ''
    )

    // Fetch active airlines from database
    const { data: managedAirlines } = await adminClient
      .from('managed_airlines')
      .select('code')
      .eq('is_active', true)

    const airlineFilter = managedAirlines?.map(a => a.code).join(',')
    console.log('Active airline filter:', airlineFilter)

    if (action === 'search-flights' || action === 'get-featured') {
      let finalParams: any = {
        engine: 'google_flights',
        api_key: SEARCHAPI_API_KEY,
        currency: 'IDR',
        adults: '1'
      }
      
      if (action === 'get-featured') {
        finalParams = {
          ...finalParams,
          departure_id: 'CGK',
          arrival_id: 'JED',
          outbound_date: '2025-05-10',
          flight_type: 'one_way'
        }
      } else {
        const { origin, destination, date, returnDate, tripType, adults } = params
        finalParams = {
          ...finalParams,
          departure_id: origin,
          arrival_id: destination,
          outbound_date: date,
          adults: adults?.toString() || '1'
        }

        if (tripType === 'round-trip' && returnDate) {
          finalParams.flight_type = 'round_trip'
          finalParams.return_date = returnDate
        } else {
          finalParams.flight_type = 'one_way'
        }
      }

      // Add Airline Filter if available
      if (airlineFilter) {
        finalParams.included_airlines = airlineFilter
      }

      const searchParams = new URLSearchParams(finalParams)

      const response = await fetch(`${BASE_URL}?${searchParams.toString()}`)
      const data = await response.json()

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (action === 'search-airports') {
      const { keyword } = params
      const searchParams = new URLSearchParams({
        engine: 'google_flights_location',
        q: keyword,
        api_key: SEARCHAPI_API_KEY
      })

      const response = await fetch(`${BASE_URL}?${searchParams.toString()}`)
      const data = await response.json()

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      throw new Error(`Action ${action} not supported for SearchApi`)
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
