// config.js: KREDENSIAL SUPABASE FINAL
const SUPABASE_URL = 'https://rojhcadtqfynlqzubftx.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs';

// Inisialisasi Klien Supabase (Diakses oleh semua file JS lain)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
