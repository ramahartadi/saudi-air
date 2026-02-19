import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()
    
    const SEARCHAPI_API_KEY = Deno.env.get('SEARCHAPI_API_KEY')
    const BASE_URL = 'https://www.searchapi.io/api/v1/search'

    if (!SEARCHAPI_API_KEY) {
      throw new Error('SearchApi API key is not configured in Supabase Secrets.')
    }

    if (action === 'search-hotels') {
      const { location, checkIn, checkOut, adults, children, rooms, hotelChains } = params
      
      const searchParams = new URLSearchParams({
        engine: 'google_hotels',
        q: location,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: adults?.toString() || '1',
        property_type: 'hotel',
        currency: 'IDR',
        api_key: SEARCHAPI_API_KEY
      })

      if (children) searchParams.append('children', children.toString())
      if (rooms) searchParams.append('rooms', rooms.toString())
      
      if (hotelChains && hotelChains.length > 0) {
        // SearchApi.io Google Hotels engine uses 'brands' for hotel chains
        searchParams.append('brands', hotelChains.join(','))
      }

      console.log(`Searching hotels for: ${location} (${checkIn} to ${checkOut})`)
      
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
