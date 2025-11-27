// lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// Variabel ENV yang didefinisikan di Vercel Dashboard / .env.local
// NEXT_PUBLIC_ harus digunakan agar bisa diakses di sisi browser (client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Inisialisasi Klien Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Catatan: Jika NEXT_PUBLIC_SUPABASE_URL tidak terbaca, 
// periksa apakah sudah diatur dengan benar di Vercel/GitHub/local.env.
