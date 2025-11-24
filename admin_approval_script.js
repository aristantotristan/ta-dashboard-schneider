// =======================================================
// admin_approval_script.js
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const PROFILES_TABLE = 'user_profiles';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ambil daftar pengguna yang belum disetujui
async function fetchPendingUsers() {
    // Memastikan hanya Admin yang bisa mengakses halaman ini (opsional)
    const authStatus = await checkUserRole();
    if (authStatus.role !== 'admin') {
        alert("Akses Ditolak: Hanya Admin yang dapat mengakses halaman ini.");
        window.location.href = 'index.html';
        return;
    }
    
    // Ambil data user yang is_approved = FALSE
    const { data: pendingUsers, error } = await supabase
        .from(PROFILES_TABLE)
        .select(`id, full_name, division, user_role, auth_user:auth.users (email)`)
        .eq('is_approved', false);

    if (error) {
        console.error("Gagal memuat pengguna:", error);
        document.querySelector('#approvalTable tbody').innerHTML = '<tr><td colspan="5">Error memuat data.</td></tr>';
        return;
    }
    
    renderApprovalTable(pendingUsers);
}

// Render tabel
function renderApprovalTable(users) {
    const tbody = document.querySelector('#approvalTable tbody');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Tidak ada akun yang menunggu persetujuan.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = tbody.insertRow();
        const userEmail = user.auth_user ? user.auth_user.email : 'N/A'; // Ambil email dari join
        
        row.insertCell().textContent = user.full_name;
        row.insertCell().textContent = userEmail;
        row.insertCell().textContent = user.division;
        row.insertCell().textContent = user.user_role.toUpperCase();

        const actionCell = row.insertCell();
        const button = document.createElement('button');
        button.textContent = 'Setujui Akun';
        button.style.backgroundColor = '#28a745';
        button.style.color = 'white';
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
        alert(`Gagal menyetujui user: ${error.message}. Cek RLS Policy UPDATE.`);
    } else {
        alert("User berhasil disetujui!");
        fetchPendingUsers(); // Refresh daftar
    }
}

document.addEventListener('DOMContentLoaded', fetchPendingUsers);
