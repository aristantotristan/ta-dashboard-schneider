// =======================================================
// KODE LENGKAP trouble_fetch.js DENGAN LOG DETAIL HARIAN
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const TABLE_NAME = 'machine_daily_status';

// Fungsi utama untuk mengambil data trouble
async function fetchTroubleData() {
    const machineId = document.getElementById('machineId').value;
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const tbody = document.querySelector('#troubleTable tbody');
    
    tbody.innerHTML = `<tr><td colspan="6">Mencari log trouble untuk ${machineId}...</td></tr>`;

    // 1. Validasi input
    if (!machineId || !startDateInput || !endDateInput) {
        alert("Mohon pilih Mesin ID, Tanggal Mulai dan Tanggal Akhir.");
        document.getElementById('selectedMachineDisplay').textContent = "N/A";
        tbody.innerHTML = `<tr><td colspan="6">Pilih mesin, tanggal, dan tekan 'Cek Trouble' untuk melihat laporan.</td></tr>`;
        return;
    }

    // Tampilkan Mesin ID yang dipilih
    document.getElementById('selectedMachineDisplay').textContent = machineId;
    
    // --- Logika Penentuan Filter Waktu ---
    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);
    endDate.setHours(23, 59, 59, 999); 
    
    if (startDate.getTime() >= endDate.getTime()) {
        alert("Tanggal Mulai harus lebih awal dari Tanggal Akhir.");
        tbody.innerHTML = `<tr><td colspan="6">Tanggal tidak valid.</td></tr>`;
        return;
    }

    // Tampilkan rentang tanggal yang dipilih di UI
    document.getElementById('dateRangeDisplay').textContent = 
        `Periode: ${startDate.toLocaleDateString('id-ID')} - ${new Date(endDateInput).toLocaleDateString('id-ID')}`;
    
    // URL API Supabase: FILTER BERDASARKAN MACHINE_ID dan REPORT_DATE
    const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&machine_id=eq.${machineId}&report_date=gte.${startDateInput}&report_date=lte.${endDateInput}&order=report_date.asc`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}. Cek RLS Policy.`);
        }

        const data = await response.json();
        
        if (data.length === 0) {
             tbody.innerHTML = `<tr><td colspan="6">Tidak ada log harian yang tercatat untuk ${machineId} dalam periode ini.</td></tr>`;
             return;
        }

        // Langsung tampilkan data karena tidak perlu agregasi (NEW)
        displayDetailedLog(data);
        
    } catch (error) {
        console.error("Gagal mengambil data trouble:", error);
        tbody.innerHTML = `<tr><td colspan='6'>Error: ${error.message}.</td></tr>`;
    }
}

// Fungsi BARU: Menampilkan Log Harian Satu per Satu
function displayDetailedLog(data) {
    const tbody = document.querySelector('#troubleTable tbody');
    tbody.innerHTML = '';
    
    data.forEach(record => {
        const row = tbody.insertRow();
        const statusText = record.is_operational ? 'ON (Stabil)' : 'OFF (Trouble)';
        const statusClass = record.is_operational ? 'status-on' : 'status-off';
        
        // Tanggal
        row.insertCell().textContent = new Date(record.report_date).toLocaleDateString('id-ID');
        
        // Status Harian
        const statusCell = row.insertCell();
        statusCell.textContent = statusText;
        statusCell.className = statusClass;
        
        // Detail Trouble
        row.insertCell().textContent = record.trouble_count;
        row.insertCell().textContent = record.trouble_type || 'N/A';
        row.insertCell().textContent = record.uptime_hours.toFixed(1);
        row.insertCell().textContent = record.downtime_hours.toFixed(1);

        // Jika ada trouble, beri highlight pada baris
        if (!record.is_operational) {
            row.style.backgroundColor = '#fce4e4'; // Merah muda pudar
        }
    });
}

// Fungsi groupDataByMachine (dihapus/tidak digunakan)

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi tidak diperlukan, tunggu user input
});
