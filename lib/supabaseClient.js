// lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// --- KUNCI DIMASUKKAN LANGSUNG (untuk menjamin build sukses) ---
const supabaseUrl = 'https://rojhcadtqfynlqzubftx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
