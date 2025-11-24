// --- Fungsi Sign Up (Register) yang Direvisi ---
async function signUp() {
    const fullName = document.getElementById('fullName')?.value;
    const division = document.getElementById('division')?.value;
    const role = document.getElementById('userRole')?.value; // <-- BARU
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!fullName || !division || !role || !email || !password) {
        messageElement.textContent = 'Semua field wajib diisi.';
        return;
    }

    // 1. Panggil Supabase Auth untuk mendaftar
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (authError) {
        messageElement.textContent = 'Gagal mendaftar: ' + authError.message;
        return;
    }

    // 2. Jika pendaftaran berhasil, buat profile di tabel 'user_profiles'
    const userId = authData.user.id;
    const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
            { id: userId, full_name: fullName, division: division, user_role: role } // <-- SIMPAN ROLE BARU
        ]);
        
    if (profileError) {
        console.error('Gagal membuat profile:', profileError);
        messageElement.textContent = 'Pendaftaran berhasil, tetapi gagal membuat profile. Hubungi Admin.';
        return;
    }

    messageElement.style.color = 'green';
    messageElement.textContent = 'Pendaftaran berhasil! Silakan cek email Anda.';
}
