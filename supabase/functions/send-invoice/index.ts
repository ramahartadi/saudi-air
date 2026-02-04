import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

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
    console.log('Sending invoice request received:', body)
    const { email, bookingRef, flight, passengers, totalPrice, status, paymentMethod, baseUrl, bookingId } = body
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      throw new Error('Email service key missing')
    }

    const isPaid = status === 'Success'
    const checkoutUrl = `${baseUrl}/booking/checkout/${bookingId || bookingRef}`
    const dateNow = new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })

    console.log(`Preparing to send ${isPaid ? 'Receipt' : 'Invoice'} to ${email}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Skybook <onboarding@resend.dev>', // Temporarily using onboarding@resend.dev for better compatibility if not verified
        to: [email],
        subject: isPaid ? `[RECEIPT] Bukti Pembelian - ${bookingRef}` : `[INVOICE] Tagihan Pembayaran - ${bookingRef}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; background: #fff;">
            <div style="text-align: right; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #0081C9; font-style: italic;">Skybook</h2>
            </div>

            <div style="margin-bottom: 30px;">
              <h3 style="margin: 0; font-size: 16px;">${isPaid ? 'BUKTI PEMBELIAN (RECEIPT)' : 'TAGIHAN PEMBAYARAN (INVOICE)'}</h3>
              <table style="width: 100%; font-size: 12px; margin-top: 10px;">
                <tr>
                  <td style="width: 150px;">Tanggal Jam</td>
                  <td>: ${dateNow}</td>
                  <td style="text-align: right;">Nomor : #${bookingRef}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="background: #f4f4f4; padding: 5px 10px; font-weight: bold; font-size: 12px; border: 1px solid #ddd;">DETAIL PEMBAYARAN</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #ddd;">
                <thead>
                  <tr style="background: #f9f9f9; text-align: left;">
                    <th style="padding: 8px; border: 1px solid #ddd;">No.</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Jenis Barang</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Deskripsi</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Jml.</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Harga Satuan</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">1</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">Akomodasi Penerbangan</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">
                      ${flight.airline} (${flight.flightNumber})<br/>
                      ${flight.departure.airport.city} &rarr; ${flight.arrival.airport.city}
                    </td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${passengers.length}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${flight.currency} ${(totalPrice / (passengers.length || 1)).toLocaleString()}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${flight.currency} ${totalPrice.toLocaleString()}</td>
                  </tr>
                  ${!isPaid && paymentMethod ? `
                  <tr>
                    <td colspan="6" style="padding: 10px; background: #fffbeb; border: 1px solid #ddd;">
                      <div style="font-weight: bold;">INSTRUKSI PEMBAYARAN: ${paymentMethod.toUpperCase()}</div>
                      ${paymentMethod.includes('Bank') ? `
                        <div style="margin-top: 5px;">
                          Silakan Transfer ke: <strong>BANK MANDIRI 123-00-0987654-3</strong><br/>
                          Atas Nama: <strong>PT SKYBOOK TRAVEL</strong>
                        </div>
                      ` : `
                        <div style="margin-top: 5px;">Silakan scan QRIS yang muncul di aplikasi untuk menyelesaikan pembayaran Anda.</div>
                      `}
                    </td>
                  </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>

            <div style="display: flex; flex-direction: row; gap: 20px; font-size: 11px; margin-bottom: 30px;">
              <div style="flex: 1; border: 1px solid #ddd; padding: 10px;">
                <div style="font-weight: bold; margin-bottom: 5px; text-decoration: underline;">DATA PEMESAN</div>
                <table>
                  <tr><td style="width: 80px;">Nama</td><td>: Customer</td></tr>
                  <tr><td>Email</td><td>: ${email}</td></tr>
                  <tr><td>Metode</td><td>: ${paymentMethod || 'Belum dipilih'}</td></tr>
                </table>
              </div>
              <div style="flex: 1; border: 1px solid #ddd; padding: 10px;">
                <div style="font-weight: bold; margin-bottom: 5px; text-decoration: underline;">DETAIL PERUSAHAAN</div>
                <table>
                  <tr><td style="width: 80px;">Nama</td><td>: PT Skybook Travel</td></tr>
                  <tr><td>NPWP</td><td>: 01.234.567.8-901.000</td></tr>
                  <tr><td>Alamat</td><td>: Jl. Premium Runway No. 1, Jakarta</td></tr>
                </table>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="background: #f4f4f4; padding: 5px 10px; font-weight: bold; font-size: 12px; border: 1px solid #ddd;">TAMU (PASSENGERS)</div>
              <div style="padding: 10px; border: 1px solid #ddd; font-size: 11px;">
                ${passengers.map((p: any, i: number) => `${i + 1}. ${p.title} ${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`).join(', ')}
              </div>
            </div>

            <div style="text-align: right; margin-top: 30px;">
              <table style="width: 100%; font-size: 12px; font-weight: bold;">
                <tr><td style="padding: 5px; text-align: right;">TOTAL :</td><td style="padding: 5px; width: 150px; text-align: right;">${flight.currency} ${totalPrice.toLocaleString()}</td></tr>
                <tr style="font-size: 16px; color: #0081C9;">
                  <td style="padding: 5px; text-align: right;">JUMLAH PEMBAYARAN :</td>
                  <td style="padding: 5px; text-align: right;">${flight.currency} ${totalPrice.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            ${!isPaid ? `
              <div style="margin: 40px 0; text-align: center;">
                <a href="${checkoutUrl}" style="background: #0081C9; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; text-transform: uppercase;">
                  SELESAIKAN PEMBAYARAN SEKARANG
                </a>
                <p style="font-size: 10px; color: #999; margin-top: 10px;">Link ini akan mengarahkan Anda langsung ke halaman pembayaran aman kami.</p>
              </div>
            ` : `
              <div style="margin-top: 40px; text-align: center;">
                <div style="display: inline-block; border: 4px solid #0081C9; border-radius: 50%; width: 100px; height: 100px; color: #0081C9; font-weight: bold; position: relative; display: inline-flex; flex-direction: column; align-items: center; justify-content: center;">
                  <div style="font-size: 28px; line-height: 1;">PAID</div>
                  <div style="font-size: 9px; border-top: 1px solid #0081C9; padding-top: 3px; margin-top: 3px; text-transform: uppercase;">Receipt</div>
                  <div style="background: #0081C9; color: #fff; position: absolute; top: 65%; left: -20px; right: -20px; transform: rotate(-12deg); font-size: 10px; padding: 2px 0; text-transform: uppercase; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">VERIFIED</div>
                </div>
              </div>
            `}
            
            <div style="margin-top: 50px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
              Untuk pertanyaan apa pun, kunjungi Skybook Help Center: <a href="#" style="color: #0081C9; text-decoration: none;">www.skybook.com/help</a>
              <br/><br/>
              Syarat dan Ketentuan berlaku. Silakan lihat di website resmi kami.
            </div>
          </div>
        `,
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
