// =======================================================
// control_script.js: FOKUS PENCATATAN LOG KONEKSI
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const LOG_TABLE = 'system_connection_log';
const API_URL = `${SUPABASE_URL}/rest/v1/${LOG_TABLE}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 1. Fungsi untuk Mengambil dan Menampilkan Log Koneksi ---
async function fetchConnectionLogs() {
    try {
        // Ambil hanya log bertipe CONNECTION_TROUBLE, diurutkan terbaru
        const response = await fetch(`${API_URL}?select=*&log_type=eq.CONNECTION_TROUBLE&order=timestamp.desc`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        
        displayConnectionLog(data);
        updateConnectionStatus(data);

    } catch (error) {
        console.error("Gagal mengambil log koneksi:", error);
        document.querySelector('#connectionLogTable tbody').innerHTML = `<tr><td colspan='3'>Error: ${error.message}</td></tr>`;
    }
}

// --- 2. Menampilkan Log di Tabel ---
function displayConnectionLog(logs) {
    const tbody = document.querySelector('#connectionLogTable tbody');
    tbody.innerHTML = '';
    
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan='3'>Tidak ada riwayat gangguan koneksi.</td></tr>`;
        return;
    }

    logs.forEach(log => {
        const row = tbody.insertRow();
        row.insertCell().textContent = log.event_status;
        row.insertCell().textContent = new Date(log.timestamp).toLocaleString('id-ID');
        row.insertCell().textContent = log.details || '-';
    });
}

// --- 3. Memperbarui Status Koneksi Terakhir ---
function updateConnectionStatus(logs) {
    const connStatusElement = document.getElementById('connectionStatus');
    const latestLog = logs[0]; // Karena sudah diurutkan dari yang terbaru

    if (latestLog && latestLog.event_status === 'DISCONNECTED') {
        connStatusElement.textContent = `TERPUTUS sejak ${new Date(latestLog.timestamp).toLocaleString('id-ID')}`;
        connStatusElement.className = 'status-stopped';
    } else if (latestLog && latestLog.event_status === 'RECONNECTED') {
        connStatusElement.textContent = 'KONEKSI OK';
        connStatusElement.className = 'status-running';
    } else {
         connStatusElement.textContent = 'KONEKSI OK (Belum ada log)';
         connStatusElement.className = 'status-running';
    }
}

// --- 4. Fungsi Kunci: Mencatat Status Koneksi (POST) ---
async function logConnectionStatus(status) {
    const detailLog = prompt(`Masukkan Keterangan Detail untuk status ${status}:`) || status;
    
    // Nanti diganti dengan user ID setelah Auth
    const userName = 'Maintenance Team TA'; 

    const payload = {
        log_type: 'CONNECTION_TROUBLE',
        event_status: status,
        machine_id: 'GLOBAL_COMM', // Asumsi: trouble koneksi bersifat global (WiFi)
        user_id: userName, 
        details: detailLog
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY 
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`✅ Status ${status} berhasil dicatat!`);
            fetchConnectionLogs(); // Refresh log
        } else {
            alert('❌ Gagal mencatat status. Cek RLS Policy (INSERT) untuk system_connection_log!');
        }
    } catch (error) {
        console.error('Error POST:', error);
    }
}

// Global functions for HTML
window.logConnectionStatus = logConnectionStatus;

// Inisialisasi: Ambil log saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchConnectionLogs);
