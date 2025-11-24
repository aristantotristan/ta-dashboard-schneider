// =======================================================
// control_script.js: FOKUS LOG DOWNTIME KONEKSI
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const DOWNTIME_TABLE = 'connection_downtime_log';
const API_URL = `${SUPABASE_URL}/rest/v1/${DOWNTIME_TABLE}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Fungsi Utama: Mengambil dan Menampilkan Log Downtime ---
async function fetchDowntimeLog() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const tbody = document.querySelector('#downtimeLogTable tbody');
    tbody.innerHTML = `<tr><td colspan="4">Mencari log downtime...</td></tr>`;

    if (!startDateInput || !endDateInput) {
        alert("Mohon pilih Tanggal Mulai dan Tanggal Akhir.");
        tbody.innerHTML = `<tr><td colspan="4">Pilih tanggal dan tekan 'Tampilkan Log' untuk melihat riwayat.</td></tr>`;
        return;
    }
    
    // Logika filter waktu yang sudah kita Sempurnakan
    const startDate = new Date(startDateInput);
    startDate.setHours(0, 0, 0, 0); 
    const endDate = new Date(endDateInput);
    endDate.setHours(23, 59, 59, 999); 
    
    if (startDate.getTime() >= endDate.getTime()) {
        alert("Tanggal Mulai harus lebih awal dari Tanggal Akhir.");
        return;
    }

    const startFilter = startDate.toISOString();
    const endFilter = endDate.toISOString();

    document.getElementById('dateRangeDisplay').textContent = 
        `Periode yang ditampilkan: ${startDate.toLocaleDateString('id-ID')} - ${new Date(endDateInput).toLocaleDateString('id-ID')}`;

    // Query: Cari log dimana downtime_start berada DALAM rentang filter
    const url = `${API_URL}?select=*&downtime_start=gte.${startFilter}&downtime_start=lte.${endFilter}&order=downtime_start.desc`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        
        displayLogTable(data);

    } catch (error) {
        console.error("Gagal mengambil log downtime:", error);
        tbody.innerHTML = `<tr><td colspan='4'>Error: ${error.message}. Cek RLS Policy.</td></tr>`;
    }
}

// --- Menampilkan Log di Tabel ---
function displayLogTable(logs) {
    const tbody = document.querySelector('#downtimeLogTable tbody');
    tbody.innerHTML = '';
    
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan='4'>Tidak ada riwayat gangguan koneksi dalam periode ini.</td></tr>`;
        return;
    }

    logs.forEach(log => {
        const row = tbody.insertRow();
        
        // Format Waktu Mulai
        row.insertCell().textContent = new Date(log.downtime_start).toLocaleString('id-ID'); 
        
        // Format Waktu Pulih
        row.insertCell().textContent = log.downtime_end ? new Date(log.downtime_end).toLocaleString('id-ID') : 'BELUM PULIH';
        
        // Durasi (Menit)
        const duration = log.duration_minutes ? `${log.duration_minutes.toFixed(1)} Menit` : 'Belum Selesai';
        row.insertCell().textContent = duration;

        // Penyebab
        row.insertCell().textContent = log.cause || 'Tidak Diketahui';
    });
}

// Global function for HTML
window.fetchDowntimeLog = fetchDowntimeLog;

// Inisialisasi: Hapus log saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('downtimeLogTable').querySelector('tbody').innerHTML = 
        '<tr><td colspan="4">Pilih tanggal dan tekan \'Tampilkan Log\' untuk melihat riwayat.</td></tr>';
});
