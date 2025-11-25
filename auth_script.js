// =======================================================
// auth_script.js: FUNGSI OTENTIKASI, ROLE, DAN PASSWORD RESET (FINAL)
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 

// FIX: Inisialisasi Klien Supabase 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const messageElement = document.getElementById('message'); // Untuk pesan error/sukses di login/register

// --- Fungsi Sign Up (Register) ---
async function signUp() {
    const fullName = document.getElementById('fullName')?.value;
    const division = document.getElementById('division')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    // Set role default, semua pendaftar adalah USER yang belum disetujui
    const DEFAULT_ROLE = 'user'; 

    if (!fullName || !division || !email || !password) {
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

    // 2. Buat profile di tabel 'user_profiles'
    const userId = authData.user.id;
    const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
            { id: userId, full_name: fullName, division: division, user_role: DEFAULT_ROLE } 
        ]);
        
    if (profileError) {
        console.error('Gagal membuat profile:', profileError);
        if (messageElement) messageElement.textContent = 'Pendaftaran berhasil, tetapi gagal membuat profile. Hubungi Admin.';
        return;
    }

    if (messageElement) {
        messageElement.style.color = 'green';
        messageElement.textContent = 'Pendaftaran berhasil! Akun Anda menunggu persetujuan Admin.';
    }
}


// --- Fungsi Sign In (Login) ---
async function signIn() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (authError) {
        if (messageElement) messageElement.textContent = 'Login Gagal: ' + authError.message;
        return;
    }
    
    // --- LOGIKA PERSETUJUAN ADMIN (Approval Flow Check) ---
    const userId = authData.user.id;
    
    const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_approved')
        .eq('id', userId)
        .single();
        
    if (profileError) {
        if (messageElement) messageElement.textContent = 'Error: Gagal memverifikasi status akun.';
        return;
    }

    if (!profileData || profileData.is_approved === false) {
        // Jika TIDAK disetujui, paksa logout Auth dan tolak akses
        await supabase.auth.signOut(); 
        if (messageElement) messageElement.textContent = 'Akses Ditolak. Akun Anda menunggu persetujuan Admin.';
        return;
    }
    
    // Jika is_approved = true, lanjutkan ke dashboard
    if (messageElement) {
        messageElement.style.color = 'green';
        messageElement.textContent = 'Login Berhasil! Mengarahkan ke Dashboard...';
    }
    window.location.href = 'index.html'; 
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

// --- Fungsi Lupa Password (Password Reset) ---
async function requestPasswordReset() {
    const email = prompt("Masukkan Email yang Anda gunakan untuk mendaftar:");
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Redirect ke halaman khusus reset password
        redirectTo: window.location.origin + '/reset_password.html', 
    });

    if (error) {
        alert("Gagal mengirim link reset: " + error.message);
    } else {
        alert("Link reset password telah dikirim ke email Anda! Mohon cek kotak masuk Anda.");
    }
}


// --- Fungsi Kunci: Pengecekan Sesi dan Role Pengguna (Untuk Dashboard Protection) ---
async function checkUserRole() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        return { isLoggedIn: false, role: 'guest', profile: {} };
    }

    const userId = session.user.id;

    // Ambil profile dan role
    const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_role, full_name, division, is_approved')
        .eq('id', userId)
        .single();
    
    if (profileError || !profileData || profileData.is_approved === false) {
        // Jika profile hilang atau belum disetujui, perlakukan sebagai tamu 
        return { isLoggedIn: false, role: 'guest', profile: {} }; 
    }

    return { isLoggedIn: true, role: profileData.user_role, profile: profileData };
}

// Global functions for HTML
window.supabase = supabase;
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.checkUserRole = checkUserRole;
window.requestPasswordReset = requestPasswordReset;
