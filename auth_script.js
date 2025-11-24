// =======================================================
// auth_script.js: HANYA LOGIKA AUTH & ROLE (TANPA REDIRECT)
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ... (signUp, signIn, signOut functions are unchanged) ...

// --- Fungsi Kunci: Pengecekan Sesi dan Role Pengguna (FINAL FIX) ---
async function checkUserRole() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        // HANYA MENGEMBALIKAN STATUS. Tidak ada redirect di sini!
        return { isLoggedIn: false, role: 'guest', profile: {} };
    }

    const userId = session.user.id;

    // Ambil profile dan role
    const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_role, full_name, division')
        .eq('id', userId)
        .single();
    
    if (profileError || !profileData) {
        return { isLoggedIn: true, role: 'user', profile: { full_name: 'Unknown', division: 'Unknown' } }; 
    }

    return { isLoggedIn: true, role: profileData.user_role, profile: profileData };
}

// Global functions for HTML
window.supabase = supabase;
window.checkUserRole = checkUserRole;

// ... (export fungsi signIn, signUp, signOut juga harus dipertahankan) ...
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
