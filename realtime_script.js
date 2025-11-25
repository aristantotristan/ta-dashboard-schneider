// =======================================================
// realtime_script.js: LOGIC REAL-TIME FINAL
// =======================================================
// Kredensial di-load dari config.js
const SUPABASE_URL = 'rojhcadtqfynlqzubftx.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs'; 

const REALTIME_TABLE = 'realtime_telemetry';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let selectedMachineId = null;
let charts = {};
let allMachineData = []; // Menyimpan data semua mesin saat ini

document.addEventListener('DOMContentLoaded', fetchMachineList);

// 1. Mengambil daftar mesin yang tersedia
async function fetchMachineList() {
    try {
        // Ambil semua data karena kita perlu DISTINCT ID untuk dropdown
        const { data, error } = await supabase
            .from(REALTIME_TABLE)
            .select('machine_id, timestamp') // Ambil ID dan timestamp untuk sort
            .order('machine_id', { ascending: true });

        if (error) throw error;
        
        // Memastikan hanya ID unik yang muncul di dropdown
        const uniqueMachines = [...new Set(data.map(item => item.machine_id))];
        const select = document.getElementById('machine-select');
        select.innerHTML = '<option value="">-- Pilih Mesin --</option>'; // Reset dropdown

        uniqueMachines.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });

        // Set pesan default
        document.getElementById('no-data-message').style.display = 'block';

    } catch (error) {
        console.error("Error fetching machine list:", error);
    }
}

// 2. Handler saat mesin dipilih (Dipanggil dari onchange HTML)
function selectMachine(machineId) {
    if (machineId) {
        selectedMachineId = machineId;
        document.getElementById('telemetry-display').style.display = 'block';
        document.getElementById('no-data-message').style.display = 'none';
        
        // Membersihkan interval lama
        if (window.realtimeInterval) {
            clearInterval(window.realtimeInterval);
        }
        
        // Memulai fetch baru setiap 5 detik
        fetchLatestTelemetry(machineId); 
        window.realtimeInterval = setInterval(() => fetchLatestTelemetry(machineId), 5000); 
    } else {
        document.getElementById('telemetry-display').style.display = 'none';
        document.getElementById('no-data-message').style.display = 'block';
        if (window.realtimeInterval) {
            clearInterval(window.realtimeInterval);
        }
    }
}

// 3. Mengambil data telemetri terbaru
async function fetchLatestTelemetry(machineId) {
    try {
        const { data, error } = await supabase
            .from(REALTIME_TABLE)
            .select('*')
            .eq('machine_id', machineId)
            .order('created_at', { ascending: false }) // Ambil log terbaru
            .limit(1);

        if (error) throw error;
        
        if (data.length === 0) {
            document.getElementById('last-update').textContent = 'Tidak ada data real-time terbaru.';
            return;
        }

        const latestData = data[0];
        document.getElementById('last-update').textContent = new Date(latestData.created_at).toLocaleString('id-ID');
        
        // Render 
        renderCoreParameters(latestData);
        renderAllParameters(latestData);

    } catch (error) {
        console.error("Error fetching latest telemetry:", error);
        document.getElementById('last-update').textContent = 'Error: Gagal memuat data.';
    }
}

// --- FUNGSI RENDERING GAUGE/TABEL (Tetap Sama) ---
function renderCoreParameters(data) {
    // ... (Gunakan logika renderCoreParameters Anda dari balasan sebelumnya)
    // Logika ini harusnya sudah benar, menggunakan MAX_VALUES dan color logic.
    // ...
}

function renderAllParameters(data) {
    // ... (Gunakan logika renderAllParameters Anda dari balasan sebelumnya)
    // ...
}


// Expose functions to HTML
window.selectMachine = selectMachine;
