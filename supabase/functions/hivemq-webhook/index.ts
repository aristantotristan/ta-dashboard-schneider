// File: supabase/functions/hivemq-webhook/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tipe data ini SESUAI dengan JSON dari ESP32 v19-mu
interface Esp32Payload {
  id: number
  status: string
  v?: number
  i?: number
  p?: number
  q?: number
  s?: number
  pf?: number
  hz?: number
  e?: number
  q_tot?: number
  e_part?: number
  q_part?: number
  op_time?: number
}

// Tipe data yang dikirim oleh HiveMQ Webhook
interface HiveMQWebhookData {
  payload: string // Data ESP32-mu ada di sini, tapi sebagai string
}

Deno.serve(async (req) => {
  try {
    // 1. Ambil data JSON mentah dari HiveMQ
    const hivemq_data: HiveMQWebhookData = await req.json()

    // 2. Data ESP32-mu ada di dalam 'payload' dan masih berbentuk Teks
    // Kita harus parse JSON-nya
    const data_esp32: Esp32Payload = JSON.parse(hivemq_data.payload);

    // 3. Buat koneksi ke Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 4. Siapkan data untuk database (sesuai nama kolom SQL)
    const dataToInsert = {
      id_mesin: data_esp32.id,
      status: data_esp32.status,
      v: data_esp32.v,
      i: data_esp32.i,
      p: data_esp32.p,
      q: data_esp32.q,
      s: data_esp32.s,
      pf: data_esp32.pf,
      hz: data_esp32.hz,
      e: data_esp32.e,
      q_tot: data_esp32.q_tot,
      e_part: data_esp32.e_part,
      q_part: data_esp32.q_part,
      op_time: data_esp32.op_time
    }

    // 5. Masukkan ke tabel 'data_energi'
    const { error } = await supabase.from('data_energi').insert(dataToInsert)
    if (error) { throw error } // Jika gagal insert, lempar error

    // 6. Kirim balasan "OK" ke HiveMQ
    return new Response(JSON.stringify({ message: "Data received by Supabase" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200, // 200 OK
    })

  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})
