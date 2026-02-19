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
      throw new Error('SearchApi API key is not configured in Supabase Secrets.')
    }

    if (action === 'get-quota') {
      console.log('Action: get-quota initiated')
      const response = await fetch(`https://www.searchapi.io/api/v1/me?api_key=${SEARCHAPI_API_KEY}`)
      const quotaData = await response.json()
      
      console.log('Quota response:', quotaData)

      return new Response(JSON.stringify(quotaData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Initialize Admin Client ONLY for actions that need database access
    const adminClient = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_SERVICE_ROLE_KEY ?? ''
    )

    if (action === 'search-flights' || action === 'get-featured') {
      // Fetch active airlines and flight settings
      const [airlinesRes, settingsRes] = await Promise.all([
        adminClient.from('managed_airlines').select('code, baggage_info').eq('is_active', true),
        adminClient.from('app_settings').select('value').eq('id', 'flight_settings').single()
      ])

      const managedAirlines = airlinesRes.data
      const settings = settingsRes.data?.value || {}
      const maxPriceOneWay = settings.maxPriceOneWay || 999999999
      const maxPriceRoundTrip = settings.maxPriceRoundTrip || 999999999

      const airlineFilter = managedAirlines?.map(a => a.code).join(',')
      
      const tripType = params?.tripType || 'one-way'
      const applicableLimit = tripType === 'round-trip' ? maxPriceRoundTrip : maxPriceOneWay

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

      if (airlineFilter) {
        console.log('Applying airline filter:', airlineFilter)
        finalParams.included_airlines = airlineFilter
      }
      
      if (applicableLimit && applicableLimit < 999999999) {
        console.log('Applying price limit:', applicableLimit)
        finalParams.max_price = applicableLimit.toString()
      }

      console.log('SearchApi Final Params:', JSON.stringify(finalParams))

      const searchParams = new URLSearchParams(finalParams)
      const response = await fetch(`${BASE_URL}?${searchParams.toString()}`)
      const data = await response.json()

      if (data.error) {
        console.error('SearchApi Engine Error:', data.error)
        return new Response(JSON.stringify({ error: data.error, details: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      console.log(`SearchApi Raw Result: ${data.best_flights?.length || 0} best, ${data.other_flights?.length || 0} other.`)
      
      if (data.best_flights?.length > 0) {
        console.log('Sample Best Flight (Keys):', Object.keys(data.best_flights[0]))
      } else if (data.other_flights?.length > 0) {
        console.log('Sample Other Flight (Keys):', Object.keys(data.other_flights[0]))
      }

      // Filter by price as requested: only flights with a valid price are kept.
      const filterFlight = (f: any) => {
        const price = f.price || 0;
        return price > 0 && price <= applicableLimit;
      }

      if (data.best_flights) {
        const before = data.best_flights.length
        data.best_flights = data.best_flights.filter(filterFlight)
        console.log(`Best flights: ${before} -> ${data.best_flights.length} after filter`)
      }
      
      if (data.other_flights) {
        const before = data.other_flights.length
        data.other_flights = data.other_flights.filter(filterFlight)
        console.log(`Other flights: ${before} -> ${data.other_flights.length} after filter`)
      }

      data.managed_airlines = managedAirlines || []
      
      console.log(`Final Result: Found ${data.best_flights?.length || 0} best, ${data.other_flights?.length || 0} other.`)

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (action === 'search-airports') {
      const { keyword } = params
      console.log('Action: search-airports, keyword:', keyword)
      
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
      throw new Error(`Action ${action} not supported`)
    }

  } catch (error) {
    console.error('Function error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
