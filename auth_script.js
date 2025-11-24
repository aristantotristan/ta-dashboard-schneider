// =======================================================
// auth_script.js: FUNGSI OTENTIKASI DAN ROLE MANAGEMENT (FINAL)
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 

// FIX: Inisialisasi Klien Supabase (Menggunakan window.supabase)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const messageElement = document.getElementById('message'); // Untuk pesan error/sukses di login/register

// --- Fungsi Sign Up (Register) ---
async function signUp() {
    const fullName = document.getElementById('fullName')?.value;
    const division = document.getElementById('division')?.value;
    const role = document.getElementById('userRole')?.value; 
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!fullName || !division || !role || !email || !password) {
        if (messageElement) messageElement.textContent = 'Semua field wajib diisi.';
        return;
    }

    // 1. Panggil Supabase Auth untuk mendaftar
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (authError) {
        if (messageElement) messageElement.textContent = 'Gagal mendaftar: ' + authError.message;
        return;
    }

    // 2. Jika pendaftaran berhasil, buat profile di tabel 'user_profiles'
    const userId = authData.user.id;
    const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
            { id: userId, full_name: fullName, division: division, user_role: role } 
        ]);
        
    if (profileError) {
        console.error('Gagal membuat profile:', profileError);
        if (messageElement) messageElement.textContent = 'Pendaftaran berhasil, tetapi gagal membuat profile. Hubungi Admin.';
        return;
    }

    if (messageElement) {
        messageElement.style.color = 'green';
        messageElement.textContent = 'Pendaftaran berhasil! Silakan cek email Anda.';
    }
}


// --- Fungsi Sign In (Login) ---
async function signIn() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        if (messageElement) messageElement.textContent = 'Login Gagal: ' + error.message;
    } else {
        if (messageElement) {
            messageElement.style.color = 'green';
            messageElement.textContent = 'Login Berhasil! Mengarahkan ke Dashboard...';
        }
        window.location.href = 'index.html'; 
    }
}

// --- Fungsi Logout ---
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout Gagal:', error);
    } else {
        window.location.href = 'login.html'; 
    }
}


// --- Fungsi Kunci: Pengecekan Sesi dan Role Pengguna ---
async function checkUserRole() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
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
        console.error("Gagal mengambil profile:", profileError);
        return { isLoggedIn: true, role: 'user', profile: { full_name: 'Unknown', division: 'Unknown' } }; 
    }

    return { isLoggedIn: true, role: profileData.user_role, profile: profileData };
}

// Global functions for HTML
window.supabase = supabase;
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.checkUserRole = checkUserRole;
