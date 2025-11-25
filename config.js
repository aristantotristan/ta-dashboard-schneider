// =======================================================
// config.js: KREDENSIAL SUPABASE FINAL (Digunakan oleh semua fetch script)
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVutGCN0imAM8'; // GANTI INI DENGAN KEY ASLI ANDA JIKA BERBEDA

// Inisialisasi Klien Supabase (Diakses oleh semua file JS lain)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
