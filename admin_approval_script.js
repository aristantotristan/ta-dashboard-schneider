// =======================================================
// admin_approval_script.js: LOGIKA PERSETUJUAN ADMIN
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const PROFILES_TABLE = 'user_profiles';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Menggunakan ANONYMOUS KEY dari auth_script.js

// Ambil daftar pengguna yang belum disetujui
async function fetchPendingUsers() {
    // 1. Cek Otorisasi (Wajib): Pastikan hanya Admin yang diizinkan
    const authStatus = await checkUserRole();
    if (authStatus.role !== 'admin') {
        alert("Akses Ditolak: Hanya Admin yang dapat mengakses halaman ini.");
        window.location.href = 'index.html';
        return;
    }
    
    // 2. Ambil data user yang is_approved = FALSE
    // Kita menggunakan JOIN implisit (dot notation) untuk mendapatkan email dari auth.users
    const { data: pendingUsers, error } = await supabase
        .from(PROFILES_TABLE)
        .select(`id, full_name, division, user_role, auth_user:auth.users (email)`)
        .eq('is_approved', false)
        .order('full_name', { ascending: true }); // Urutkan berdasarkan nama

    if (error) {
        console.error("Gagal memuat pengguna:", error);
        document.querySelector('#approvalTable tbody').innerHTML = '<tr><td colspan="5">Error memuat data. Cek RLS Policy.</td></tr>';
        return;
    }
    
    renderApprovalTable(pendingUsers);
}

// Render tabel
function renderApprovalTable(users) {
    const tbody = document.querySelector('#approvalTable tbody');
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: green;">Tidak ada akun yang menunggu persetujuan.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = tbody.insertRow();
        // Ambil email dari data JOIN (auth_user)
        const userEmail = user.auth_user ? user.auth_user.email : 'N/A'; 
        
        row.insertCell().textContent = user.full_name;
        row.insertCell().textContent = userEmail;
        row.insertCell().textContent = user.division;
        row.insertCell().textContent = user.user_role.toUpperCase();

        const actionCell = row.insertCell();
        const button = document.createElement('button');
        button.textContent = 'Setujui Akun';
        button.className = 'approve-btn';
        // Panggil fungsi approveUser dengan ID unik pengguna
        button.onclick = () => approveUser(user.id);
        actionCell.appendChild(button);
    });
}

// Fungsi untuk menyetujui (Update) user_profiles
async function approveUser(userId) {
    const { error } = await supabase
        .from(PROFILES_TABLE)
        .update({ is_approved: true })
        .eq('id', userId);

    if (error) {
        alert(`Gagal menyetujui user: ${error.message}. Pastikan RLS Policy UPDATE untuk Admin sudah diatur!`);
    } else {
        alert("User berhasil disetujui! Status: APPROVED TRUE.");
        fetchPendingUsers(); // Refresh daftar
    }
}

// Global function for HTML
window.approveUser = approveUser; // Ekspos fungsi ke HTML

document.addEventListener('DOMContentLoaded', fetchPendingUsers);
