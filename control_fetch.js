// =======================================================
// !!! GANTI DENGAN KREDENSIAL SUPABASE ANDA !!!
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
// =======================================================
const LOG_TABLE = 'system_connection_log';
const API_URL = `${SUPABASE_URL}/rest/v1/${LOG_TABLE}`;

// Fungsi untuk mengambil dan menampilkan semua log
async function fetchLogs() {
    try {
        const response = await fetch(`${API_URL}?select=*&order=timestamp.desc`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        displayControlLog(data.filter(log => log.log_type === 'CONTROL'));
        displayConnectionLog(data.filter(log => log.log_type === 'CONNECTION_TROUBLE'));
        
        // Cek status sistem dan koneksi terbaru
        updateStatusDisplay(data);

    } catch (error) {
        console.error("Gagal mengambil log:", error);
        document.querySelector('#controlLogTable tbody').innerHTML = `<tr><td colspan='3'>Error: ${error.message}</td></tr>`;
    }
}

// Menampilkan log Start/Stop
function displayControlLog(logs) {
    const tbody = document.querySelector('#controlLogTable tbody');
    tbody.innerHTML = '';

    logs.forEach(log => {
        const row = tbody.insertRow();
        row.insertCell().textContent = log.event_status;
        row.insertCell().textContent = log.user_id || 'N/A';
        row.insertCell().textContent = new Date(log.timestamp).toLocaleString();
    });
}

// Menampilkan log Trouble Koneksi (Satpam IoT)
function displayConnectionLog(logs) {
    const tbody = document.querySelector('#connectionLogTable tbody');
    tbody.innerHTML = '';

    logs.forEach(log => {
        const row = tbody.insertRow();
        row.insertCell().textContent = log.event_status;
        row.insertCell().textContent = new Date(log.timestamp).toLocaleString();
        row.insertCell().textContent = log.details.includes('Durasi') ? log.details.split('Durasi: ')[1] : '-';
        row.insertCell().textContent = log.details;
    });
}

// Memperbarui display status
function updateStatusDisplay(data) {
    // 1. Status Data Logging (Ambil status CONTROL terbaru)
    const latestControl = data.filter(log => log.log_type === 'CONTROL')[0];
    const statusText = latestControl && latestControl.event_status === 'START' ? 'BERJALAN' : 'DIHENTIKAN';
    const statusColor = latestControl && latestControl.event_status === 'START' ? 'green' : 'red';
    
    document.getElementById('systemStatus').textContent = statusText;
    document.getElementById('systemStatus').style.color = statusColor;

    // 2. Status Koneksi (Ambil status CONNECTION_TROUBLE terbaru)
    const latestConnection = data.filter(log => log.log_type === 'CONNECTION_TROUBLE')[0];
    const connStatusText = latestConnection && latestConnection.event_status === 'RECONNECTED' ? 'KONEKSI OK' : 'TERPUTUS';
    const connStatusColor = latestConnection && latestConnection.event_status === 'RECONNECTED' ? 'green' : 'red';
    
    document.getElementById('connectionStatus').textContent = connStatusText;
    document.getElementById('connectionStatus').style.color = connStatusColor;
}

// Fungsi dummy untuk mencatat aksi tombol Start/Stop (POST ke Supabase)
async function logControl(action) {
    const payload = {
        log_type: 'CONTROL',
        event_status: action,
        user_id: 'admin_test_TA', // Nanti diganti dengan user dari login
        details: `Sistem di-${action} secara manual.`
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
            alert(`Aksi ${action} berhasil dicatat!`);
            fetchLogs(); // Refresh log setelah berhasil POST
        } else {
            alert('Gagal mencatat aksi. Cek RLS Policy POST di Supabase!');
        }
    } catch (error) {
        console.error('Error POST:', error);
    }
}


document.addEventListener('DOMContentLoaded', fetchLogs);
