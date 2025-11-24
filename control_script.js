// =======================================================
// control_script.js: Logika Safety Tombol
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const SYSTEM_STATUS_TABLE = 'system_status';
const SINGLE_ROW_ID = 1; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const systemStatusDisplay = document.getElementById('systemStatus');
const lastActionByDisplay = document.getElementById('lastActionBy');
const lastActionAtDisplay = document.getElementById('lastActionAt');

// --- 1. Fungsi Inti: Mengubah Status Tombol dan UI ---
function updateButtonState(isRunning, lastActionBy = 'N/A', lastActionAt = 'N/A') {
    if (isRunning) {
        // Status BERJALAN: Start dinonaktifkan, Stop diaktifkan
        startButton.disabled = true;
        stopButton.disabled = false;
        systemStatusDisplay.textContent = 'BERJALAN';
        systemStatusDisplay.className = 'status-indicator status-running';
    } else {
        // Status BERHENTI: Start diaktifkan, Stop dinonaktifkan
        startButton.disabled = false;
        stopButton.disabled = true;
        systemStatusDisplay.textContent = 'BERHENTI';
        systemStatusDisplay.className = 'status-indicator status-stopped';
    }
    
    lastActionByDisplay.textContent = lastActionBy;
    
    if (lastActionAt !== 'N/A') {
        lastActionAtDisplay.textContent = new Date(lastActionAt).toLocaleString('id-ID');
    } else {
        lastActionAtDisplay.textContent = lastActionAt;
    }
}

// --- 2. Mengambil Status Saat Ini dari Supabase (Dipanggil saat refresh) ---
async function fetchSystemStatus() {
    try {
        const { data, error } = await supabase
            .from(SYSTEM_STATUS_TABLE)
            .select('is_running, last_action_by, last_action_at')
            .eq('id', SINGLE_ROW_ID)
            .single();

        if (error) throw error;

        if (data) {
            updateButtonState(data.is_running, data.last_action_by, data.last_action_at);
        } else {
            updateButtonState(false, 'SYSTEM', new Date().toISOString());
        }

    } catch (error) {
        console.error("Gagal mengambil status sistem:", error);
        alert("Error koneksi: Gagal mengambil status sistem.");
        // Gagal ambil data, status tombol tidak aman, nonaktifkan keduanya
        startButton.disabled = true;
        stopButton.disabled = true;
    }
}

// --- 3. Fungsi START SISTEM ---
async function startSystem() {
    // Audit: Minta Nama User (Akan diganti dengan data Auth nanti)
    const userName = prompt("⚠️ MASUKKAN NAMA ANDA untuk audit START:") || 'ADMIN TANPA NAMA';
    
    // Nonaktifkan tombol sementara proses update
    startButton.disabled = true;
    stopButton.disabled = true;

    try {
        const { error } = await supabase
            .from(SYSTEM_STATUS_TABLE)
            .update({ 
                is_running: true, 
                last_action_by: userName, 
                last_action_at: new Date().toISOString() 
            })
            .eq('id', SINGLE_ROW_ID);

        if (error) throw error;

        alert(`✅ Sistem BERHASIL DIMULAI oleh ${userName}!`);
        // Ambil status terbaru untuk update UI
        fetchSystemStatus(); 
        
    } catch (error) {
        console.error("Gagal memulai sistem:", error);
        alert(`❌ Gagal memulai sistem: ${error.message}.`);
        // Kembalikan status tombol ke keadaan terakhir yang diketahui
        fetchSystemStatus(); 
    }
}

// --- 4. Fungsi STOP SISTEM ---
async function stopSystem() {
    // Audit: Minta Nama User (Akan diganti dengan data Auth nanti)
    const userName = prompt("⚠️ MASUKKAN NAMA ANDA untuk audit STOP:") || 'ADMIN TANPA NAMA';
    
    // Nonaktifkan tombol sementara proses update
    startButton.disabled = true;
    stopButton.disabled = true;
    
    try {
        const { error } = await supabase
            .from(SYSTEM_STATUS_TABLE)
            .update({ 
                is_running: false, 
                last_action_by: userName, 
                last_action_at: new Date().toISOString() 
            })
            .eq('id', SINGLE_ROW_ID);

        if (error) throw error;
        
        alert(`✅ Sistem BERHASIL DIHENTIKAN oleh ${userName}!`);
        // Ambil status terbaru untuk update UI
        fetchSystemStatus();

    } catch (error) {
        console.error("Gagal menghentikan sistem:", error);
        alert(`❌ Gagal menghentikan sistem: ${error.message}.`);
        // Kembalikan status tombol ke keadaan terakhir yang diketahui
        fetchSystemStatus();
    }
}

// Global functions for HTML
window.startSystem = startSystem;
window.stopSystem = stopSystem;

// Inisialisasi: Ambil status saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchSystemStatus);
