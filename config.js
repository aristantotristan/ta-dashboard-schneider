// =======================================================
// config.js: KONFIGURASI GLOBAL
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 

// Inisialisasi Klien Supabase (FIXED: Menggunakan window.supabase)
// Klien ini akan digunakan oleh SEMUA file JS lainnya
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
